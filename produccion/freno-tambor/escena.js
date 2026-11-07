// Escena 3D del video "¿Tu scooter frena tarde? Cómo ajustar el freno de tambor".
// Scooter estilo Max (ruedas de 10", freno de tambor delantero, maneta izquierda).
// Pasos validados por el taller. Tiempos sincronizados con T('frase', 'palabra').
import { crearKit } from '../motor/kit.js';

export async function crear(ctx) {
  const { THREE, escena, camara, T, utiles } = ctx;
  const { limitar, suave, progreso, cubica } = utiles;
  const kit = crearKit({ THREE, escena, utiles });
  const { V, mat, luces, cilindroZ, RoundedBoxGeometry } = kit;

  const sc = kit.crearScooterMax({ pivote: 'trasera' });
  // La cámara mira desde el lado izquierdo (-z): se espejan las luces del kit
  luces.clave.position.set(1.2, 2.2, -1.8);
  luces.bordeCian.position.set(-1.6, 0.7, 0.6);
  luces.bordeRojo.position.set(1.4, 0.4, 1.6);
  mat.piso.metalness = 0.1;
  mat.piso.roughness = 0.6;
  mat.piso.envMapIntensity = 0.08;
  const { raiz, scooter, delantera, tambor, brazo, TOPE, PIVOTE_BRAZO, ANG_BRAZO, LARGO_BRAZO, B } = sc;

  const alinear = (malla, a, b) => {
    const d = new THREE.Vector3().subVectors(b, a);
    malla.position.copy(a).addScaledVector(d, 0.5);
    malla.scale.set(1, d.length(), 1);
    malla.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  };

  // ---------------- Cable en el tambor: tope → resorte → pasador → varilla roscada + tuerca ----------------
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xc9ced5, metalness: 1, roughness: 0.25, envMapIntensity: 0.5 });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 1, 10), cableMat);
  const varilla = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 1, 12), mat.acero);
  const puntos = [];
  for (let i = 0; i <= 240; i++) {
    const k = i / 240, a = k * Math.PI * 2 * 9;
    puntos.push(V(Math.cos(a) * 0.0032, k - 0.5, Math.sin(a) * 0.0032));
  }
  const resorte = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 480, 0.0006, 6), mat.acero);
  const tuerca = new THREE.Group();
  const hexagono = new THREE.Mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.006, 6), mat.cromo);
  const marcaTuerca = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.0062, 0.0016), mat.ledCian);
  marcaTuerca.position.set(0.0046, 0, 0);
  tuerca.add(hexagono, marcaTuerca);
  tambor.add(cable, varilla, resorte, tuerca);

  // Llave fija (boca abierta) para la tuerca
  const llave = new THREE.Group();
  const mango = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.0035, 0.01, 2, 0.0015), mat.aluminio);
  mango.position.x = 0.052;
  const boca = new THREE.Mesh(new RoundedBoxGeometry(0.016, 0.0038, 0.02, 2, 0.002), mat.aluminio);
  boca.position.x = 0.009;
  llave.add(mango, boca);
  const llaveEje = new THREE.Group();
  llaveEje.add(llave);
  tambor.add(llaveEje);

  // ---------------- Funda del cable: maneta izquierda → tambor ----------------
  tambor.updateMatrix();
  const TOPE_S = TOPE.clone().applyMatrix4(tambor.matrix); // en coordenadas del scooter
  const ruta = new THREE.CatmullRomCurve3([
    B.clone(), V(0.37, 1.06, -0.1), V(0.375, 0.82, -0.045), V(0.39, 0.56, -0.04), V(0.4, 0.4, -0.08),
    V(0.41, 0.3, -0.085), V(TOPE_S.x, TOPE_S.y + 0.035, TOPE_S.z - 0.01), V(TOPE_S.x, TOPE_S.y + 0.006, TOPE_S.z),
  ], false, 'catmullrom', 0.3);
  const funda = new THREE.Mesh(new THREE.TubeGeometry(ruta, 400, 0.0028, 10), mat.manguera);
  const brilloCable = new THREE.Mesh(new THREE.TubeGeometry(ruta, 400, 0.0042, 10), mat.ledCian);
  scooter.add(funda, brilloCable);
  const indicesBrillo = brilloCable.geometry.index.count;

  // Caballete bajo la parte delantera de la plataforma
  const ALZA = Math.asin(0.036 / 0.92);
  const base = new THREE.Group();
  const caballete = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.15, 0.14, 3, 0.008), mat.aluOscuro);
  caballete.position.y = 0.075;
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.0915, 0.005, 0.1415), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 1.0, 1.15), toneMapped: false }));
  franja.position.y = 0.12;
  base.add(caballete, franja);
  base.position.set(0.25, 0, 0);
  escena.add(base);

  const roce = kit.halo(new THREE.Color(2.2, 0.3, 0.12), 0.07);
  escena.add(roce);

  // ---------------- Posiciones ----------------
  const enMundo = (obj, local) => () => obj.localToWorld(V(...local));
  const conAlza = (fn) => {
    raiz.rotation.z = ALZA; raiz.updateMatrixWorld(true);
    const r = fn();
    raiz.rotation.z = 0; raiz.updateMatrixWorld(true);
    return r;
  };
  raiz.updateMatrixWorld(true);
  const mundo = (obj, local = [0, 0, 0]) => obj.localToWorld(V(...local)).toArray();
  const mas = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const extremoLocal = V(PIVOTE_BRAZO.x + Math.cos(ANG_BRAZO) * LARGO_BRAZO, PIVOTE_BRAZO.y + Math.sin(ANG_BRAZO) * LARGO_BRAZO, PIVOTE_BRAZO.z);
  const D = mundo(tambor);
  const DA = conAlza(() => mundo(tambor));
  const NA = conAlza(() => mundo(tambor, [extremoLocal.x, extremoLocal.y - 0.006, extremoLocal.z]));
  const PM = mundo(sc.maneta, [0, 0, -0.05]);
  const RD = mundo(delantera.grupo);
  const RDA = conAlza(() => mundo(delantera.grupo));

  // ---------------- Planos (la cámara mira desde el lado izquierdo, -z) ----------------
  const planos = [
    { t: 0, corte: true, de: { pos: mas(D, [-0.15, 0.1, -0.38]), mira: mas(D, [-0.03, 0.04, 0]), fov: 32 }, a: { pos: mas(D, [-0.13, 0.09, -0.34]), mira: mas(D, [-0.03, 0.04, 0]), fov: 32 } },
    { t: T('causa'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.4, radio1: 3.2, altura0: 1.05, altura1: 0.9, ang0: -1.0, ang1: -0.75, fov: 34 } },
    { t: T('prueba'), corte: true, de: { pos: mas(PM, [0.2, 0.34, -0.2]), mira: mas(PM, [-0.02, -0.01, 0.0]), fov: 30 }, a: { pos: mas(PM, [0.18, 0.31, -0.18]), mira: mas(PM, [-0.02, -0.01, 0.0]), fov: 30 } },
    { t: T('prep'), corte: true, orbita: { centro: [0.25, 0, 0], mira: [0.22, 0.24, 0], radio0: 2.1, radio1: 2.0, altura0: 0.55, altura1: 0.45, ang0: -1.05, ang1: -1.3, fov: 34 } },
    { t: T('ubicar'), corte: true, de: { pos: mas(DA, [-0.16, 0.12, -0.33]), mira: mas(DA, [-0.035, 0.05, 0]), fov: 30 }, a: { pos: mas(DA, [-0.14, 0.11, -0.3]), mira: mas(DA, [-0.035, 0.05, 0]), fov: 30 } },
    { t: T('tuerca'), de: { pos: mas(NA, [-0.08, 0.02, -0.15]), mira: mas(NA, [0, -0.012, 0]), fov: 30 }, a: { pos: mas(NA, [-0.07, 0.015, -0.135]), mira: mas(NA, [0, -0.012, 0]), fov: 30 }, transicion: 1.0 },
    { t: T('error'), corte: true, de: { pos: mas(DA, [-0.17, 0.12, -0.4]), mira: mas(DA, [-0.03, 0.04, 0]), fov: 32 }, a: { pos: mas(DA, [-0.15, 0.11, -0.36]), mira: mas(DA, [-0.03, 0.04, 0]), fov: 32 } },
    { t: T('criterio'), corte: true, de: { pos: mas(RDA, [0.36, 0.16, -0.46]), mira: mas(RDA, [0, 0.01, 0]), fov: 32 }, a: { pos: mas(RDA, [0.32, 0.14, -0.44]), mira: mas(RDA, [0, 0.01, 0]), fov: 32 } },
    { t: T('zapatas'), corte: true, de: { pos: mas(RDA, [0.32, 0.14, -0.44]), mira: RDA, fov: 32 } },
    { t: T('verif'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.3, radio1: 3.1, altura0: 0.95, altura1: 0.85, ang0: -0.55, ang1: -0.95, fov: 34 } },
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.4, altura0: 1.0, altura1: 0.85, ang0: -0.6, ang1: -1.0, fov: 34 } },
  ];

  // ---------------- Rótulos ----------------
  const esc = (x, y) => [540 + (x - 540) * 1.25, 1060 + (y - 1060) * 1.25];
  const anclaTambor = enMundo(tambor, [0, 0, -0.012]);
  const anclaBrazo = enMundo(tambor, [extremoLocal.x * 0.5 + PIVOTE_BRAZO.x * 0.5, extremoLocal.y * 0.5 + PIVOTE_BRAZO.y * 0.5, PIVOTE_BRAZO.z]);
  const anclaTuerca = () => tambor.localToWorld(tuerca.position.clone());
  const anclaCable = enMundo(scooter, [0.39, 0.6, -0.04]);
  const anclaCableTambor = () => tambor.localToWorld(V(TOPE.x, TOPE.y - 0.02, TOPE.z));
  const anclaPuño = enMundo(sc.puños[0], [0, 0, -0.018]);
  const anclaManeta = enMundo(sc.maneta, [0, 0, -0.09]);
  const anclaRueda = enMundo(delantera.grupo, [0.04, 0.07, -0.03]);
  const R_ZAP = (L) => 309 - L / 2; // radio medio del material de la zapata en el esquema
  const desgaste = (t) => progreso(t, T('zapatas', 'zapatas'), T('zapatas', 'gastadas', 0.3), cubica);
  const L_ZAP = (t) => 46 - 36 * desgaste(t);
  const rotulos = [
    { desde: 0.35, hasta: T('causa', null, -0.05), texto: 'Frena tarde', color: 'rojo', ancla: anclaTambor, caja: [-120, -330] },
    { desde: T('causa', 'tambor'), hasta: T('causa', 'estira', -0.05), texto: 'Tambor', ancla: anclaTambor, caja: [-60, 260] },
    { desde: T('causa', 'estira'), hasta: T('prueba', null, -0.1), texto: 'Se estira', color: 'rojo', ancla: anclaCable, caja: [-200, 120] },
    { desde: T('prueba', 'maneta'), hasta: T('prueba', 'toca', -0.05), texto: 'Maneta', ancla: anclaManeta, caja: [-200, 260] },
    { desde: T('prueba', 'puno'), hasta: T('prueba', 'fin', 0.25), texto: 'Casi toca el puño', color: 'rojo', ancla: anclaPuño, caja: [-60, -280] },
    { desde: T('ubicar', 'brazo'), hasta: T('ubicar', 'cable', -0.05), texto: 'Brazo del tambor', ancla: anclaBrazo, caja: [-120, -330] },
    { desde: T('ubicar', 'cable'), hasta: T('ubicar', 'fin', 0.25), texto: 'Aquí termina el cable', ancla: anclaCableTambor, caja: [-140, -300] },
    { desde: T('tuerca', 'tuerca'), hasta: T('tuerca', 'sentido', -0.05), texto: 'Tuerca', ancla: anclaTuerca, caja: [-200, -300] },
    { desde: T('tuerca', 'sentido'), hasta: T('tuerca', 'media', -0.05), texto: '↻ Sentido horario', color: 'blanco', ancla: anclaTuerca, caja: [-200, -300] },
    { desde: T('tuerca', 'media'), hasta: T('tuerca', 'fin', 0.25), texto: '½ vuelta a la vez', color: 'blanco', ancla: anclaTuerca, caja: [-200, -300] },
    { desde: T('error', 'rozando'), hasta: T('error', 'calienta', -0.05), texto: 'Roza', color: 'rojo', ancla: anclaTambor, caja: [-150, -320] },
    { desde: T('error', 'calienta'), hasta: T('error', 'fin', 0.2), texto: 'Se calienta', color: 'rojo', ancla: anclaTambor, caja: [-150, -320] },
    { desde: T('criterio', 'libre'), hasta: T('criterio', 'firme', -0.05), texto: 'Gira libre', ancla: anclaRueda, caja: [-80, -330] },
    { desde: T('criterio', 'firme'), hasta: T('criterio', 'fin', 0.25), texto: 'Frena firme', ancla: anclaRueda, caja: [-80, -330] },
    // Esquema del tambor (anclas en pantalla)
    { desde: T('zapatas', 'zapatas'), hasta: T('zapatas', 'gastadas', -0.05), texto: 'Zapata', ancla: { pantalla: (t) => esc(540 + R_ZAP(L_ZAP(t)), 1060) }, caja: [-40, -420] },
    { desde: T('zapatas', 'gastadas'), hasta: T('zapatas', 'cambia', -0.05), texto: 'Gastada', color: 'rojo', ancla: { pantalla: (t) => esc(540 + R_ZAP(L_ZAP(t)), 1060) }, caja: [-40, -420] },
    { desde: T('zapatas', 'cambia'), hasta: T('zapatas', 'fin', 0.2), texto: 'Se cambia en el taller', color: 'rojo', ancla: { pantalla: (t) => esc(540 + R_ZAP(L_ZAP(t)), 1060) }, caja: [-140, -420] },
    { desde: T('zapatas', 'rosca'), hasta: T('zapatas', 'fin', 0.2), texto: 'exagerado para verlo', color: 'blanco', chico: true, linea: false, ancla: { pantalla: [540, 1560] }, caja: [0, 0] },
  ];

  const fichas = [
    { desde: T('prep', 'apagado'), hasta: T('prep', 'fin', 0.2), texto: 'Scooter apagado', fila: 0 },
    { desde: T('prep', 'levantada'), hasta: T('prep', 'fin', 0.2), texto: 'Rueda delantera levantada', fila: 1 },
    { desde: T('prep', 'llave'), hasta: T('prep', 'fin', 0.2), texto: 'Llave a la medida', fila: 2 },
    { desde: T('error', 'bateria'), hasta: T('error', 'fin', 0.2), texto: 'Gasta batería', tipo: 'mal', fila: 0 },
    { desde: T('criterio', 'mitad'), hasta: T('criterio', 'fin', 0.2), texto: 'Maneta a la mitad', y: 960 },
    { desde: T('verif', 'despacio'), hasta: T('verif', 'fin', 0.2), texto: 'Prueba despacio', fila: 0 },
    { desde: T('verif', 'seguro'), hasta: T('verif', 'fin', 0.2), texto: 'Lugar seguro', fila: 1 },
  ];

  // ---------------- Recorrido de la maneta y medidor ----------------
  function recorrido(t) {
    if (t < T('causa')) return 0.92 * Math.sin(Math.PI * limitar((t - 0.3) / 2.1));
    if (t >= T('prueba') && t < T('prep')) return 0.95 * progreso(t, T('prueba', 'aprieta'), T('prueba', 'toca'), cubica) * (1 - progreso(t, T('prueba', 'fin'), T('prueba', 'fin', 0.35)));
    if (t >= T('criterio') && t < T('zapatas')) return 0.5 * progreso(t, T('criterio', 'maneta'), T('criterio', 'mitad', 0.1), cubica);
    return 0;
  }
  const escalones = (t, ps) => {
    let v = ps[0][1];
    for (let i = 1; i < ps.length; i++) v += (ps[i][1] - ps[i - 1][1]) * progreso(t, ps[i][0], ps[i][0] + 0.25);
    return v;
  };
  // Medias vueltas de la tuerca (momentos)
  const vueltasT = [T('tuerca', 'gira', 0.35), T('tuerca', 'cable', 0.1), T('tuerca', 'horario', 0.1), T('tuerca', 'media', 0.1), T('tuerca', 'vez', 0.05)];
  const medidor = { nombre: 'RECORRIDO DE LA MANETA', unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [40, 55], tolerancia: 12 };
  const hud = [
    { ...medidor, desde: T('prueba', 'aprieta'), hasta: T('prueba', 'fin', 0.2), valor: (t) => 100 * recorrido(t) },
    { ...medidor, desde: T('tuerca', 'gira'), hasta: T('tuerca', 'fin', 0.2), valor: (t) => escalones(t, [[0, 95], [vueltasT[0], 86], [vueltasT[1], 77], [vueltasT[2], 68], [vueltasT[3], 59], [vueltasT[4], 50]]) },
    { ...medidor, desde: T('error', 'tensar'), hasta: T('error', 'fin', 0.2), valor: (t) => 50 - 38 * progreso(t, T('error', 'tensar'), T('error', 'mas', 0.2), cubica) },
    { ...medidor, desde: T('criterio', 'maneta', -0.2), hasta: T('criterio', 'fin', 0.2), valor: (t) => 100 * recorrido(t) },
  ];

  // ---------------- Esquema 2D: zapatas dentro del tambor ----------------
  const arco = (r, a0, a1) => {
    const p = (a) => [540 + r * Math.cos(a), 1060 + r * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const rad = (g) => (g * Math.PI) / 180;
  const esquemas = [{
    desde: T('zapatas'), hasta: T('verif'),
    svg: (t) => {
      const L = L_ZAP(t);
      const rojo = desgaste(t);
      const zapata = (a0, a1) => `
        <path d="${arco(R_ZAP(L), rad(a0), rad(a1))}" stroke="${rojo > 0.5 ? `rgba(255,59,47,${0.35 + 0.5 * rojo})` : '#4b4741'}" stroke-width="${L}" fill="none"/>
        <path d="${arco(309 - L - 13, rad(a0), rad(a1))}" stroke="#9aa1a9" stroke-width="26" fill="none"/>`;
      return `
        <rect width="1080" height="1920" fill="#050608"/>
        <g transform="translate(540 1060) scale(1.25) translate(-540 -1060)">
          <circle cx="540" cy="1060" r="330" fill="#0b0c0e" stroke="#8d939b" stroke-width="30"/>
          ${zapata(-62, 62)}
          ${zapata(118, 242)}
          <rect x="515" y="${1060 - 300}" width="50" height="70" rx="12" fill="#c9ced5"/>
          <circle cx="540" cy="${1060 + 268}" r="16" fill="#c9ced5"/>
          <path d="M 470 ${1060 + 250} q 35 -26 70 0 q 35 26 70 0" stroke="#c9ced5" stroke-width="6" fill="none"/>
          <circle cx="540" cy="1060" r="40" fill="#30343a" stroke="#8d939b" stroke-width="4"/>
          <text x="540" y="${1060 - 316}" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="22" text-anchor="middle" letter-spacing="3" dy="-30">TAMBOR</text>
          <text x="540" y="${1060 - 214}" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="20" text-anchor="middle" letter-spacing="2">LEVA</text>
        </g>`;
    },
  }];

  // ---------------- Animación por cuadro ----------------
  const tmp = { pasador: V(), dir: V(), bajoTope: V(), fin: V(), q: new THREE.Quaternion() };
  function actualizar(t) {
    const alza = t >= T('prep') && t < T('verif') ? progreso(t, T('prep', 'levantada', -0.1), T('prep', 'levantada', 0.6), cubica) : 0;
    raiz.rotation.z = ALZA * alza;
    base.visible = t >= T('prep') && t < T('verif');
    sc.pantallaLuz.visible = !(t >= T('prep', 'apagado') && t < T('verif'));
    sc.fijarManeta(recorrido(t));

    // Medias vueltas de la tuerca → tensión del cable → el brazo sube un poco
    const vueltas = t >= T('tuerca') && t < T('verif') ? vueltasT.reduce((acc, v) => acc + progreso(t, v, v + 0.3, cubica), 0) : 0;
    let delta = -0.025 * vueltas;
    if (t >= T('error') && t < T('criterio')) delta = -0.125 - 0.06 * progreso(t, T('error', 'tensar'), T('error', 'mas', 0.2), cubica);
    if (t >= T('criterio') && t < T('zapatas')) delta = -0.125 - 0.07 * progreso(t, T('criterio', 'maneta'), T('criterio', 'mitad', 0.1), cubica);
    brazo.rotation.z = delta;
    const a = ANG_BRAZO + delta;
    tmp.pasador.set(PIVOTE_BRAZO.x + Math.cos(a) * LARGO_BRAZO, PIVOTE_BRAZO.y + Math.sin(a) * LARGO_BRAZO, PIVOTE_BRAZO.z);
    tmp.bajoTope.set(TOPE.x, TOPE.y - 0.005, TOPE.z);
    alinear(cable, tmp.bajoTope, tmp.pasador);
    alinear(resorte, tmp.bajoTope.clone().add(V(0, -0.004, 0)), tmp.pasador.clone().add(V(0, 0.005, 0)));
    tmp.dir.subVectors(tmp.pasador, tmp.bajoTope).normalize();
    const largoVarilla = 0.014 + 0.0012 * vueltas;
    tmp.fin.copy(tmp.pasador).addScaledVector(tmp.dir, largoVarilla);
    alinear(varilla, tmp.pasador, tmp.fin);
    tuerca.position.copy(tmp.pasador).addScaledVector(tmp.dir, 0.0075);
    tmp.q.setFromUnitVectors(V(0, 1, 0), tmp.dir);
    tuerca.quaternion.copy(tmp.q);
    tuerca.rotateY(-vueltas * Math.PI);

    // Llave fija: entra de costado y gira con la tuerca
    const conLlave = t >= T('tuerca', 'gira', -0.3) && t < T('error');
    llaveEje.visible = conLlave;
    if (conLlave) {
      llaveEje.position.copy(tuerca.position);
      llaveEje.quaternion.copy(tmp.q);
      llaveEje.rotateY(-vueltas * Math.PI - 0.6);
      llave.position.x = (1 - progreso(t, T('tuerca', 'gira', -0.3), T('tuerca', 'gira', 0.25), cubica)) * 0.04;
    }

    // Brillo del cable en el plano general
    const brillo = t >= T('causa', 'freno', -0.1) && t < T('prueba');
    brilloCable.visible = brillo;
    if (brillo) brilloCable.geometry.setDrawRange(0, Math.floor(indicesBrillo * progreso(t, T('causa', 'freno', -0.1), T('causa', 'tambor', 0.4), cubica) / 6) * 6);

    // Giro de la rueda delantera
    let giro = 0;
    if (t < T('causa')) giro = -t * 3.0;
    else if (t >= T('error') && t < T('criterio')) giro = -(t - T('error')) * 1.5 * (1 - 0.5 * progreso(t, T('error', 'rozando'), T('error', 'fin')));
    else if (t >= T('criterio') && t < T('zapatas')) {
      const t0 = T('criterio'), parar = T('criterio', 'mitad'), tf = T('criterio', 'firme', 0.2), v0 = 6.0;
      if (t < parar) giro = -v0 * (t - t0);
      else { const d = Math.min(t, tf) - parar, dur = tf - parar; giro = -v0 * (parar - t0) - v0 * (d - (d * d) / (2 * dur)); }
    }
    delantera.giro.rotation.z = giro;
    if (t >= T('cta')) { delantera.giro.rotation.z = -(t - T('cta')) * 1.1; sc.trasera.giro.rotation.z = -(t - T('cta')) * 1.1; }

    // Luz roja en el gancho y en el error
    const enError = t < T('causa') || (t >= T('error') && t < T('criterio'));
    luces.modo(enError ? 'error' : 'normal');
    const roza = t >= T('error') && t < T('criterio') ? progreso(t, T('error', 'rozando', -0.2), T('error', 'rozando', 0.4)) : 0;
    roce.material.opacity = 0.5 * roza * (0.75 + 0.25 * Math.sin(t * 13));
    roce.position.copy(tambor.localToWorld(V(0, 0, -0.02)));
    roce.quaternion.copy(camara.quaternion);

    const general = (t >= T('causa') && t < T('prueba')) || t >= T('verif') || (t >= T('prep') && t < T('ubicar'));
    escena.fog.near = general ? 4.5 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.25) },
  };
}
