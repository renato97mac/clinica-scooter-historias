// Escena 3D del video "¿Por qué tu scooter frena tarde? Cómo ajustar el freno de disco".
// Tiempos sincronizados con la locución mediante T('frase', 'palabra').
import { crearKit } from '../motor/kit.js';

export async function crear(ctx) {
  const { THREE, escena, camara, T, tiempos, utiles } = ctx;
  const { limitar, suave, progreso, cubica } = utiles;
  const kit = crearKit({ THREE, escena, utiles });
  const { V, mat, luces, tubo, cilindroZ, RoundedBoxGeometry, R_EXT } = kit;

  const sc = kit.crearScooter();
  const { raiz, scooter, trasera, manubrio } = sc;
  const RUEDA = V(-0.42, R_EXT, 0); // centro de la rueda trasera (coordenadas del scooter)

  // Alinea un cilindro unitario (alto 1, eje Y) entre dos puntos
  const alinear = (malla, a, b) => {
    const d = new THREE.Vector3().subVectors(b, a);
    malla.position.copy(a).addScaledVector(d, 0.5);
    malla.scale.set(1, d.length(), 1);
    malla.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
  };

  // ---------------- Disco de freno (gira con la rueda trasera) ----------------
  const forma = new THREE.Shape();
  forma.absarc(0, 0, 0.06, 0, Math.PI * 2, false);
  const hueco = (cx, cy, r) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); forma.holes.push(p); };
  hueco(0, 0, 0.017);
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    hueco(Math.cos(a) * 0.047, Math.sin(a) * 0.047, 0.0021);
    const b = a + Math.PI / 20;
    hueco(Math.cos(b) * 0.0535, Math.sin(b) * 0.0535, 0.0019);
  }
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    const p = new THREE.Path();
    p.absellipse(Math.cos(a) * 0.031, Math.sin(a) * 0.031, 0.0085, 0.0045, 0, Math.PI * 2, true, a + Math.PI / 2);
    forma.holes.push(p);
  }
  const disco = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.0022, bevelEnabled: false, curveSegments: 40 }), mat.acero);
  disco.position.z = 0.036;
  const soporteDisco = cilindroZ(0.019, 0.012, mat.aluOscuro, 40);
  soporteDisco.position.z = 0.031;
  trasera.giro.add(disco, soporteDisco);

  // ---------------- Pinza mecánica ----------------
  const ANG_PINZA = (150 * Math.PI) / 180;
  const C = V(RUEDA.x + Math.cos(ANG_PINZA) * 0.05, RUEDA.y + Math.sin(ANG_PINZA) * 0.05, 0.039);
  const pinza = new THREE.Group();
  pinza.position.copy(C);
  scooter.add(pinza);
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.03, 0.026, 3, 0.006), mat.plastico);
  cuerpo.rotation.z = ANG_PINZA - Math.PI / 2;
  const tapaPinza = cilindroZ(0.011, 0.004, mat.aluOscuro, 40);
  tapaPinza.position.z = 0.014;
  pinza.add(cuerpo, tapaPinza);
  // Brazo actuador (gira sobre el eje de la pinza) con el perno que sujeta el cable
  const ANG_BRAZO = (60 * Math.PI) / 180, LARGO_BRAZO = 0.03;
  const brazo = new THREE.Group();
  brazo.position.z = 0.017;
  pinza.add(brazo);
  const placaBrazo = new THREE.Mesh(new RoundedBoxGeometry(LARGO_BRAZO + 0.012, 0.011, 0.004, 2, 0.002), mat.aluOscuro);
  placaBrazo.position.set(Math.cos(ANG_BRAZO) * LARGO_BRAZO / 2, Math.sin(ANG_BRAZO) * LARGO_BRAZO / 2, 0);
  placaBrazo.rotation.z = ANG_BRAZO;
  const perno = new THREE.Group();
  perno.position.set(Math.cos(ANG_BRAZO) * LARGO_BRAZO, Math.sin(ANG_BRAZO) * LARGO_BRAZO, 0.004);
  const cabezaPerno = cilindroZ(0.0042, 0.004, mat.cromo, 6);
  const huecoAllen = cilindroZ(0.0019, 0.0042, new THREE.MeshBasicMaterial({ color: 0x050505 }), 6);
  huecoAllen.position.z = 0.0003;
  const arandela = cilindroZ(0.0052, 0.001, mat.acero, 24);
  arandela.position.z = -0.0024;
  perno.add(cabezaPerno, huecoAllen, arandela);
  brazo.add(placaBrazo, perno);
  // Tope de la funda y soporte
  const S = V(C.x + 0.045, C.y + 0.026, C.z + 0.017); // tope de la funda (coordenadas del scooter)
  const tope = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0038, 0.009, 20), mat.acero);
  tope.rotation.z = Math.PI / 2;
  tope.position.copy(S).add(V(0.004, 0, 0));
  scooter.add(tope);
  scooter.add(tubo(V(C.x + 0.012, C.y + 0.008, C.z + 0.012), V(S.x + 0.002, S.y - 0.002, S.z - 0.004), 0.0035, mat.aluOscuro));
  // Cable interior (tope → perno) y cola con terminal
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xc9ced5, metalness: 1, roughness: 0.25, envMapIntensity: 0.5 });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 1, 10), cableMat);
  const cola = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 1, 10), cableMat);
  const terminal = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.005, 12), mat.laton);
  scooter.add(cable, cola, terminal);

  // ---------------- Maneta y regulador (lado derecho, +z) ----------------
  const BARRA = V(manubrio.x, manubrio.y, 0);
  const abrazadera = cilindroZ(0.0165, 0.022, mat.plastico, 32);
  abrazadera.position.set(BARRA.x, BARRA.y, 0.135);
  const cuerpoManeta = new THREE.Mesh(new RoundedBoxGeometry(0.046, 0.015, 0.02, 2, 0.004), mat.plastico);
  cuerpoManeta.position.set(BARRA.x + 0.024, BARRA.y - 0.004, 0.137);
  scooter.add(abrazadera, cuerpoManeta);
  const P = V(BARRA.x + 0.043, BARRA.y - 0.005, 0.142);
  const maneta = new THREE.Group();
  maneta.position.copy(P);
  scooter.add(maneta);
  const hoja = new THREE.Mesh(new RoundedBoxGeometry(0.009, 0.007, 0.106, 2, 0.003), mat.aluOscuro);
  hoja.position.z = 0.053;
  const puntaManeta = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 16, 12), mat.aluOscuro);
  puntaManeta.position.z = 0.105;
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.016, 16), mat.cromo);
  maneta.add(hoja, puntaManeta, eje);
  const fijarManeta = (recorrido) => { maneta.rotation.y = -0.2 * limitar(recorrido, 0, 1.05); };
  // Regulador: cilindro moleteado con una marca para ver el giro
  const B = V(BARRA.x + 0.03, BARRA.y - 0.012, 0.13);
  const ejeRegulador = V(0.25, -0.95, -0.12).normalize();
  const regulador = new THREE.Group();
  regulador.position.copy(B);
  regulador.quaternion.setFromUnitVectors(V(0, 1, 0), ejeRegulador);
  scooter.add(regulador);
  const moleteado = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.014, 14), mat.aluminio);
  moleteado.position.y = 0.007;
  const marca = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.012, 0.0016), mat.ledCian);
  marca.position.set(0.0048, 0.007, 0);
  const contratuerca = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.003, 6), mat.cromo);
  contratuerca.position.y = 0.0015;
  const giroRegulador = new THREE.Group();
  giroRegulador.add(moleteado, marca);
  regulador.add(giroRegulador, contratuerca);

  // ---------------- Funda del cable: de la maneta a la pinza ----------------
  const ruta = new THREE.CatmullRomCurve3([
    B.clone().addScaledVector(ejeRegulador, 0.016),
    V(0.312, 0.98, 0.1), V(0.315, 0.86, 0.06), V(0.338, 0.6, 0.03), V(0.375, 0.34, 0.035),
    V(0.33, 0.17, 0.07), V(0.2, 0.106, 0.093), V(-0.2, 0.106, 0.093), V(-0.34, 0.12, 0.09),
    V(-0.385, 0.155, 0.068), V(S.x + 0.008, S.y, S.z),
  ], false, 'catmullrom', 0.3);
  const funda = new THREE.Mesh(new THREE.TubeGeometry(ruta, 400, 0.0028, 10), mat.manguera);
  const brilloCable = new THREE.Mesh(new THREE.TubeGeometry(ruta.clone(), 400, 0.0042, 10), mat.ledCian);
  scooter.add(funda, brilloCable);
  const indicesBrillo = brilloCable.geometry.index.count;

  // ---------------- Llave Allen ----------------
  const llave = new THREE.Group();
  const hexMat = mat.pavonado;
  const corto = cilindroZ(0.0021, 0.02, hexMat, 6);
  corto.position.z = 0.01;
  const largo = new THREE.Mesh(new THREE.CylinderGeometry(0.0021, 0.0021, 0.075, 6), hexMat);
  largo.position.set(0, -0.0375, 0.0205);
  const codo = new THREE.Mesh(new THREE.SphereGeometry(0.0021, 8, 8), hexMat);
  codo.position.z = 0.0205;
  llave.add(corto, largo, codo);
  scooter.add(llave);

  // ---------------- Base para levantar la rueda ----------------
  const ALZA = -Math.atan(0.034 / 0.84);
  const base = new THREE.Group();
  const caballete = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.128, 0.13, 3, 0.008), mat.aluOscuro);
  caballete.position.y = 0.064;
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.0915, 0.005, 0.1315), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 1.0, 1.15), toneMapped: false }));
  franja.position.y = 0.1;
  base.add(caballete, franja);
  base.position.set(-0.28, 0, 0);
  escena.add(base);

  // Brillo de roce (aditivo, mira a cámara)
  const roce = kit.halo(new THREE.Color(2.2, 0.3, 0.12), 0.04);
  escena.add(roce);

  // ---------------- Utilidades de posición ----------------
  const enMundo = (obj, local) => () => obj.localToWorld(V(...local));
  /** Calcula algo con el scooter levantado (para encuadrar planos de la rueda en el aire). */
  const conAlza = (fn) => {
    raiz.rotation.z = ALZA; raiz.updateMatrixWorld(true);
    const r = fn();
    raiz.rotation.z = 0; raiz.updateMatrixWorld(true);
    return r;
  };
  raiz.updateMatrixWorld(true);
  const mundo = (obj, local = [0, 0, 0]) => obj.localToWorld(V(...local)).toArray();
  const mas = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const PM = mundo(maneta, [0, 0, 0.05]); // centro de la maneta
  const RB = conAlza(() => mundo(regulador, [0, 0.008, 0]));
  const RU = mundo(trasera.grupo);
  const CA = conAlza(() => mundo(pinza, [0, 0, 0.014]));
  const RA = conAlza(() => mundo(trasera.grupo));

  // ---------------- Planos de cámara ----------------
  const planos = [
    // 1 · Gancho: macro del disco y la pinza, luz roja
    { t: 0, corte: true, de: { pos: mas(RU, [0.16, 0.08, 0.32]), mira: mas(RU, [-0.02, 0.02, 0.03]), fov: 32 }, a: { pos: mas(RU, [0.12, 0.07, 0.28]), mira: mas(RU, [-0.025, 0.02, 0.03]), fov: 32 } },
    // 2 · Plano general: el cable de la maneta a la pinza
    { t: T('causa'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.52, 0], radio0: 3.25, radio1: 3.05, altura0: 1.05, altura1: 0.9, ang0: 1.05, ang1: 0.8, fov: 34 } },
    // 3 · La prueba: apretar la maneta
    { t: T('prueba'), corte: true, de: { pos: mas(PM, [0.2, 0.34, 0.2]), mira: mas(PM, [-0.02, -0.01, 0.0]), fov: 30 }, a: { pos: mas(PM, [0.18, 0.31, 0.18]), mira: mas(PM, [-0.02, -0.01, 0.0]), fov: 30 } },
    // 4 · Esquema 2D de pastillas (la cámara no se ve)
    { t: T('seguridad'), corte: true, de: { pos: mas(PM, [0.19, 0.15, 0.18]), mira: PM, fov: 30 } },
    // 5 · Preparación: parte trasera, la rueda se levanta
    { t: T('prep'), corte: true, orbita: { centro: [-0.2, 0.0, 0], mira: [-0.25, 0.16, 0], radio0: 1.55, radio1: 1.45, altura0: 0.4, altura1: 0.32, ang0: 1.05, ang1: 1.3, fov: 34 } },
    // 6 · Regulador de la maneta
    { t: T('regulador'), corte: true, de: { pos: mas(RB, [0.12, 0.05, 0.13]), mira: mas(RB, [0, -0.002, 0.0]), fov: 30 }, a: { pos: mas(RB, [0.1, 0.045, 0.11]), mira: mas(RB, [0, -0.002, 0.0]), fov: 30 } },
    // 7 · La pinza: perno, cable, llave
    { t: T('pinza'), corte: true, de: { pos: mas(CA, [0.1, 0.09, 0.2]), mira: mas(CA, [0.008, 0.012, 0]), fov: 30 }, a: { pos: mas(CA, [0.08, 0.075, 0.17]), mira: mas(CA, [0.008, 0.014, 0]), fov: 30 } },
    // 8 · El error: tensar de más (rojo)
    { t: T('error'), corte: true, de: { pos: mas(RA, [0.2, 0.12, 0.36]), mira: mas(RA, [-0.02, 0.02, 0.03]), fov: 32 }, a: { pos: mas(RA, [0.17, 0.1, 0.32]), mira: mas(RA, [-0.025, 0.02, 0.03]), fov: 32 } },
    // 9 · Criterio: gira libre y frena firme
    { t: T('criterio'), corte: true, de: { pos: mas(RA, [0.34, 0.14, 0.42]), mira: mas(RA, [0, 0.0, 0.02]), fov: 32 }, a: { pos: mas(RA, [0.3, 0.12, 0.4]), mira: mas(RA, [0, 0.0, 0.02]), fov: 32 } },
    // 10 · Probar antes de salir + taller
    { t: T('verif'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.5, 0], radio0: 3.2, radio1: 3.0, altura0: 0.95, altura1: 0.85, ang0: 0.55, ang1: 0.95, fov: 34 } },
    // 11 · Cierre en el teléfono
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.52, 0], radio0: 3.3, altura0: 1.0, altura1: 0.85, ang0: 0.6, ang1: 1.0, fov: 34 } },
  ];

  // ---------------- Rótulos ----------------
  const esc = (x, y) => [540 + (x - 540) * 1.5, 1060 + (y - 1060) * 1.5]; // coordenadas del esquema escalado
  const anclaPinza = enMundo(pinza, [0, 0, 0.014]);
  const anclaPerno = enMundo(perno, [0, 0, 0.003]);
  const anclaCola = () => scooter.localToWorld(colaFin.clone());
  const anclaCable = enMundo(scooter, [0.0, 0.106, 0.095]);
  const anclaPuño = enMundo(sc.puños[1], [0.0, 0.0, 0.017]);
  const anclaManeta = enMundo(maneta, [0, 0, 0.09]);
  const anclaRegulador = enMundo(regulador, [0, 0.008, 0.005]);
  const anclaDisco = enMundo(trasera.grupo, [0.035, 0.03, 0.04]);
  const rotulos = [
    { desde: 0.35, hasta: T('causa', null, -0.05), texto: 'Frena tarde', color: 'rojo', ancla: anclaPinza, caja: [140, -260] },
    { desde: T('causa', 'cable'), hasta: T('causa', 'estira', -0.05), texto: 'Cable', ancla: anclaCable, caja: [-120, 230] },
    { desde: T('causa', 'estira'), hasta: T('prueba', null, -0.1), texto: 'Se estira', color: 'rojo', ancla: anclaCable, caja: [-120, 230] },
    { desde: T('prueba', 'maneta'), hasta: T('prueba', 'toca', -0.05), texto: 'Maneta', ancla: anclaManeta, caja: [-200, 260] },
    { desde: T('prueba', 'puno'), hasta: T('prueba', 'fin', 0.25), texto: 'Casi toca el puño', color: 'rojo', ancla: anclaPuño, caja: [-60, -280] },
    // Esquema de pastillas (anclas en pantalla)
    { desde: T('seguridad', 'pastilla'), hasta: T('seguridad', 'fin', 0.2), texto: 'Pastilla', ancla: { pantalla: esc(376, 900) }, caja: [-40, -170] },
    { desde: T('seguridad', 'pastilla'), hasta: T('seguridad', 'fin', 0.2), texto: 'nueva', color: 'blanco', chico: true, linea: false, ancla: { pantalla: esc(450, 1310) }, caja: [0, 0] },
    { desde: T('seguridad', 'material'), hasta: T('seguridad', 'cambia', -0.05), texto: 'Casi sin material', color: 'rojo', ancla: { pantalla: [600, 1050] }, caja: [150, -320] },
    { desde: T('seguridad', 'cambia'), hasta: T('seguridad', 'fin', 0.2), texto: 'Se cambia', color: 'rojo', ancla: { pantalla: [600, 1050] }, caja: [150, -320] },
    { desde: T('seguridad', 'pastilla'), hasta: T('seguridad', 'fin', 0.2), texto: 'exagerado para verlo', color: 'blanco', chico: true, linea: false, ancla: { pantalla: [540, 1720] }, caja: [0, 0] },
    // Regulador
    { desde: T('regulador', 'regulador'), hasta: T('regulador', 'hacia', -0.05), texto: 'Regulador', ancla: anclaRegulador, caja: [-200, -330] },
    { desde: T('regulador', 'hacia'), hasta: T('regulador', 'media', -0.05), texto: 'Hacia afuera', color: 'blanco', ancla: anclaRegulador, caja: [-200, -330] },
    { desde: T('regulador', 'media'), hasta: T('regulador', 'fin', 0.25), texto: '½ vuelta a la vez', color: 'blanco', ancla: anclaRegulador, caja: [-160, -330] },
    // Pinza
    { desde: T('pinza', 'pinza'), hasta: T('pinza', 'afloja', -0.05), texto: 'Pinza', ancla: anclaPinza, caja: [-180, 300] },
    { desde: T('pinza', 'perno'), hasta: T('pinza', 'jalalo', -0.05), texto: 'Perno del cable', ancla: anclaPerno, caja: [-160, -300] },
    { desde: T('pinza', 'milimetros'), hasta: T('pinza', 'fin', 0.2), texto: 'Unos mm', color: 'blanco', ancla: anclaCola, caja: [-200, -260] },
    // Error
    { desde: T('error', 'rozando'), hasta: T('error', 'calienta', -0.05), texto: 'Roza', color: 'rojo', ancla: anclaPinza, caja: [-150, -300] },
    { desde: T('error', 'calienta'), hasta: T('error', 'fin', 0.2), texto: 'Se calienta', color: 'rojo', ancla: anclaPinza, caja: [-150, -300] },
    // Criterio
    { desde: T('criterio', 'libre'), hasta: T('criterio', 'firme', -0.05), texto: 'Gira libre', ancla: anclaDisco, caja: [60, -330] },
    { desde: T('criterio', 'firme'), hasta: T('criterio', 'fin', 0.25), texto: 'Frena firme', ancla: anclaDisco, caja: [60, -330] },
    { desde: T('taller', 'taller'), hasta: T('taller', 'fin', 0.3), texto: 'Taller en Lima', ancla: enMundo(scooter, [-0.02, 0.16, 0.06]), caja: [-60, 260] },
  ];

  const fichas = [
    { desde: T('prep', 'apagado'), hasta: T('prep', 'fin', 0.2), texto: 'Scooter apagado', fila: 0 },
    { desde: T('prep', 'rueda'), hasta: T('prep', 'fin', 0.2), texto: 'Rueda levantada', fila: 1 },
    { desde: T('prep', 'llave'), hasta: T('prep', 'fin', 0.2), texto: 'Llave Allen', fila: 2 },
    { desde: T('error', 'bateria'), hasta: T('error', 'fin', 0.2), texto: 'Gasta batería', tipo: 'mal', fila: 0 },
    { desde: T('criterio', 'mitad'), hasta: T('criterio', 'fin', 0.2), texto: 'Maneta a la mitad', fila: 0, y: 960 },
    { desde: T('verif', 'despacio'), hasta: T('verif', 'fin', 0.2), texto: 'Prueba despacio', fila: 0 },
    { desde: T('verif', 'seguro'), hasta: T('verif', 'fin', 0.2), texto: 'Lugar seguro', fila: 1 },
  ];

  // ---------------- Recorrido de la maneta (0–1) ----------------
  const pulsos = (t, t0, t1, alto) => {
    // aprieta y suelta suavemente entre t0 y t1
    const k = progreso(t, t0, t1, (x) => x);
    return alto * Math.sin(Math.PI * limitar(k));
  };
  function recorrido(t) {
    if (t < T('causa')) return pulsos(t, 0.3, 2.7, 0.92);
    if (t >= T('prueba') && t < T('seguridad')) {
      return 0.95 * progreso(t, T('prueba', 'aprieta'), T('prueba', 'toca'), cubica) * (1 - progreso(t, T('prueba', 'fin'), T('prueba', 'fin', 0.35)));
    }
    if (t >= T('criterio') && t < T('verif')) return 0.5 * progreso(t, T('criterio', 'maneta'), T('criterio', 'mitad', 0.1), cubica);
    return 0;
  }
  // Valor del medidor: recorrido que queda tras cada ajuste
  const escalones = (t, puntos) => {
    let v = puntos[0][1];
    for (let i = 1; i < puntos.length; i++) v += (puntos[i][1] - puntos[i - 1][1]) * progreso(t, puntos[i][0], puntos[i][0] + 0.25);
    return v;
  };
  const medidor = { nombre: 'RECORRIDO DE LA MANETA', unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [40, 55], tolerancia: 12 };
  const hud = [
    { ...medidor, desde: T('prueba', 'aprieta'), hasta: T('prueba', 'fin', 0.2), valor: (t) => 100 * recorrido(t) },
    { ...medidor, desde: T('regulador', 'gira'), hasta: T('regulador', 'fin', 0.2), valor: (t) => escalones(t, [[0, 95], [T('regulador', 'gira', 0.3), 89], [T('regulador', 'media', 0.2), 82], [T('regulador', 'vez', 0.1), 76]]) },
    { ...medidor, desde: T('pinza', 'jalalo'), hasta: T('pinza', 'fin', 0.2), valor: (t) => escalones(t, [[0, 76], [T('pinza', 'apretar', 0.1), 50]]) },
    { ...medidor, desde: T('error', 'tensar'), hasta: T('error', 'fin', 0.2), valor: (t) => 50 - 38 * progreso(t, T('error', 'tensar'), T('error', 'mas', 0.2), cubica) },
    { ...medidor, desde: T('criterio', 'maneta', -0.2), hasta: T('criterio', 'fin', 0.2), valor: (t) => 100 * recorrido(t) },
  ];

  // ---------------- Esquema 2D: pastilla nueva vs. gastada ----------------
  const esquemas = [{
    desde: T('seguridad'), hasta: T('prep'),
    svg: (t) => {
      const gasto = progreso(t, T('seguridad', 'casi'), T('seguridad', 'material', 0.3), cubica);
      const izq = 110;                 // material de la pastilla nueva (px)
      const der = 110 - 92 * gasto;    // material de la pastilla gastada
      const y0 = 860, y1 = 1260;
      const rojo = gasto > 0.6 ? (gasto - 0.6) / 0.4 : 0;
      const pastilla = (xMaterial, ancho, lado, alerta) => {
        const xPlaca = lado < 0 ? xMaterial - 38 : xMaterial + ancho;
        const xMat = lado < 0 ? xMaterial : xMaterial;
        return `<rect x="${xPlaca}" y="${y0 - 30}" width="38" height="${y1 - y0 + 60}" rx="6" fill="#9aa1a9" stroke="#c9ced5" stroke-width="3"/>
          <rect x="${xMat}" y="${y0}" width="${ancho}" height="${y1 - y0}" rx="4" fill="${alerta ? `rgba(255,59,47,${0.25 + 0.5 * rojo})` : '#4b4741'}" stroke="${alerta && rojo > 0 ? '#ff3b2f' : '#6d675f'}" stroke-width="3"/>
          <rect x="${xMat}" y="${y0}" width="${ancho}" height="${y1 - y0}" rx="4" fill="url(#grano)" opacity="0.5"/>`;
      };
      const g0 = '<g transform="translate(540 1060) scale(1.5) translate(-540 -1060)">';
      return `
        <defs><pattern id="grano" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r="1.6" fill="#2c2925"/><circle cx="10" cy="10" r="1.3" fill="#615a52"/></pattern></defs>
        <rect width="1080" height="1920" fill="#050608"/>
        ${g0}
        <rect x="518" y="720" width="44" height="680" fill="#c3c9d1" stroke="#e6e9ee" stroke-width="3"/>
        <line x1="540" y1="710" x2="540" y2="1410" stroke="#ff3b2f" stroke-width="4"/>
        ${pastilla(505 - izq, izq, -1, false)}
        ${pastilla(575, der, 1, true)}
        <text x="540" y="700" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="22" text-anchor="middle" letter-spacing="3">DISCO</text></g>`;
    },
  }];
  // Para que el rótulo "Casi sin material" apunte a la pastilla que se gasta
  rotulos.find((r) => r.texto === 'Casi sin material').ancla = { pantalla: (t) => esc(575 + (110 - 92 * progreso(t, T('seguridad', 'casi'), T('seguridad', 'material', 0.3), cubica)) / 2, 1000) };
  rotulos.find((r) => r.texto === 'Se cambia').ancla = { pantalla: esc(584, 1000) };

  // ---------------- Animación por cuadro ----------------
  const colaFin = V();
  const ANCLA_LOCAL = V();
  function actualizar(t) {
    // Alzar la rueda trasera desde "rueda levantada" hasta "Antes de salir"
    const alza = t >= T('prep') && t < T('verif') ? progreso(t, T('prep', 'levantada', -0.1), T('prep', 'levantada', 0.6), cubica) : 0;
    raiz.rotation.z = ALZA * alza;
    base.visible = t >= T('prep') && t < T('verif');

    // Pantalla del scooter apagada durante el ajuste
    sc.pantallaLuz.visible = !(t >= T('prep', 'apagado') && t < T('verif'));

    // Maneta
    fijarManeta(recorrido(t));

    // Regulador: medias vueltas hacia afuera
    const vueltas = ['gira', 'media', 'vez'].reduce((acc, p, i) => acc + progreso(t, T('regulador', p, i === 0 ? 0.3 : 0.1), T('regulador', p, i === 0 ? 0.6 : 0.4), cubica), 0);
    const enRegulador = t >= T('regulador');
    giroRegulador.rotation.y = enRegulador ? vueltas * Math.PI : 0;
    giroRegulador.position.y = enRegulador ? vueltas * 0.0006 : 0;

    // Brazo de la pinza: al tensar el cable el brazo gira un poco hacia el tope
    let angBrazo = 0;
    if (t >= T('pinza', 'jalalo')) angBrazo = -0.12 * progreso(t, T('pinza', 'jalalo'), T('pinza', 'milimetros', 0.2), cubica);
    if (t >= T('error')) angBrazo = -0.12 - 0.1 * progreso(t, T('error', 'tensar'), T('error', 'mas', 0.2), cubica);
    if (t >= T('criterio')) angBrazo = -0.12 - 0.12 * progreso(t, T('criterio', 'maneta'), T('criterio', 'mitad', 0.1), cubica);
    if (t >= T('verif')) angBrazo = -0.12;
    brazo.rotation.z = angBrazo;
    brazo.updateMatrixWorld(true);
    // Cable: tope → perno → cola (la cola crece al "jalarlo unos milímetros")
    pinza.updateMatrix();
    ANCLA_LOCAL.copy(perno.position).applyMatrix4(brazo.matrix).applyMatrix4(pinza.matrix);
    ANCLA_LOCAL.z = S.z;
    alinear(cable, S, ANCLA_LOCAL);
    const dirCola = new THREE.Vector3().subVectors(ANCLA_LOCAL, S).normalize();
    const extra = t >= T('pinza', 'jalalo') ? 0.006 * progreso(t, T('pinza', 'jalalo'), T('pinza', 'milimetros', 0.2), cubica) : 0;
    colaFin.copy(ANCLA_LOCAL).addScaledVector(dirCola, 0.012 + extra);
    alinear(cola, ANCLA_LOCAL, colaFin);
    terminal.position.copy(colaFin);
    terminal.quaternion.copy(cola.quaternion);

    // Llave Allen en el perno: entra, afloja, y vuelve a apretar
    const conLlave = t >= T('pinza', 'afloja', -0.45) && t < T('error');
    llave.visible = conLlave;
    if (conLlave) {
      const entra = progreso(t, T('pinza', 'afloja', -0.45), T('pinza', 'afloja', 0.05), cubica);
      llave.position.copy(ANCLA_LOCAL).add(V(0, 0, 0.004 + (1 - entra) * 0.05));
      const afloja = progreso(t, T('pinza', 'afloja', 0.1), T('pinza', 'perno', 0.3), cubica);
      const aprieta = progreso(t, T('pinza', 'apretar'), T('pinza', 'apretar', 0.45), cubica);
      llave.rotation.z = 0.5 + 1.3 * afloja - 1.3 * aprieta;
    }

    // Brillo del cable (se dibuja de la maneta a la pinza)
    const brillo = t >= T('causa', 'cable', -0.1) && t < T('prueba');
    brilloCable.visible = brillo;
    if (brillo) brilloCable.geometry.setDrawRange(0, Math.floor(indicesBrillo * progreso(t, T('causa', 'cable', -0.1), T('causa', 'freno', 0.3), cubica) / 6) * 6);

    // Giro de la rueda trasera
    let giro = 0;
    if (t < T('causa')) giro = -t * 3.2;
    else if (t >= T('error') && t < T('criterio')) giro = -(t - T('error')) * 1.6 * (1 - 0.5 * progreso(t, T('error', 'rozando'), T('error', 'fin')));
    else if (t >= T('criterio') && t < T('verif')) {
      // gira libre y se detiene al frenar "firme"
      const t0 = T('criterio'), tf = T('criterio', 'firme', 0.2);
      const v0 = 6.5;
      const parar = T('criterio', 'mitad');
      if (t < parar) giro = -v0 * (t - t0);
      else {
        const d = Math.min(t, tf) - parar, dur = tf - parar;
        giro = -v0 * (parar - t0) - v0 * (d - (d * d) / (2 * dur));
      }
    }
    trasera.giro.rotation.z = giro;
    if (t >= T('cta')) { trasera.giro.rotation.z = -(t - T('cta')) * 1.2; sc.delantera.giro.rotation.z = -(t - T('cta')) * 1.2; }

    // Luz: rojo en el gancho y en el error
    const enError = t < T('causa') || (t >= T('error') && t < T('criterio'));
    luces.modo(enError ? 'error' : 'normal');
    const roza = t >= T('error') && t < T('criterio') ? progreso(t, T('error', 'rozando', -0.2), T('error', 'rozando', 0.4)) : 0;
    roce.material.opacity = 0.5 * roza * (0.75 + 0.25 * Math.sin(t * 13));
    roce.position.copy(pinza.localToWorld(V(0.004, -0.008, 0.02)));
    roce.quaternion.copy(camara.quaternion);
    luces.puntoRojo.intensity = 0.05 * roza;
    luces.puntoRojo.position.copy(pinza.localToWorld(V(0.02, 0.0, 0.06)));

    const general = (t >= T('causa') && t < T('prueba')) || t >= T('verif') || (t >= T('prep') && t < T('regulador'));
    escena.fog.near = general ? 4.5 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.25) },
  };
}
