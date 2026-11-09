// Escena 3D del video "¿Tu scooter marca error 14 o 15?".
// Scooter estilo Max: tablero con pantalla, acelerador de pulgar (derecha) y maneta de freno con sensor (izquierda).
// Significados y pasos validados por el taller. Tiempos sincronizados con T('frase', 'palabra').
import { crearKit } from '../motor/kit.js';

export async function crear(ctx) {
  const { THREE, escena, T, utiles } = ctx;
  const { limitar, progreso, cubica } = utiles;
  const kit = crearKit({ THREE, escena, utiles });
  const { V, mat, luces, cilindroZ, RoundedBoxGeometry, lienzo } = kit;

  const sc = kit.crearScooterMax({ pivote: 'trasera' });
  const { scooter, manubrio, maneta, fijarManeta } = sc;
  const M = V(manubrio.x, manubrio.y, 0);

  // ---------------- Pantalla del tablero (textura que cambia según el estado) ----------------
  sc.pantallaLuz.visible = false;
  const lienzoPantalla = document.createElement('canvas');
  lienzoPantalla.width = 680; lienzoPantalla.height = 400;
  const texPantalla = new THREE.CanvasTexture(lienzoPantalla);
  texPantalla.colorSpace = THREE.SRGBColorSpace;
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.05), new THREE.MeshBasicMaterial({ map: texPantalla, toneMapped: false }));
  pantalla.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  pantalla.position.set(M.x + 0.005, M.y + 0.0415, 0);
  scooter.add(pantalla);
  let estadoActual = '';
  function dibujarPantalla(estado, parpadeo) {
    const clave = `${estado}|${parpadeo}`;
    if (clave === estadoActual) return;
    estadoActual = clave;
    const g = lienzoPantalla.getContext('2d');
    const w = lienzoPantalla.width, h = lienzoPantalla.height;
    g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
    if (estado === 'apagada') { texPantalla.needsUpdate = true; return; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (estado === 'ok') {
      g.fillStyle = '#3fd3df'; g.font = '800 210px Poppins'; g.fillText('0', w / 2, h / 2 - 10);
      g.font = '700 46px Poppins'; g.fillText('km/h', w / 2, h - 50);
      g.strokeStyle = '#3fd3df'; g.lineWidth = 8; g.strokeRect(w - 150, 36, 100, 44);
      g.fillStyle = '#3fd3df'; g.fillRect(w - 144, 42, 80, 32);
    } else {
      const codigo = estado === 'e14' ? '14' : '15';
      g.fillStyle = parpadeo ? '#ff3b2f' : '#7a1d18';
      g.font = '800 220px Poppins'; g.fillText(codigo, w / 2 + 40, h / 2 + 6);
      // Llave (símbolo de error)
      g.save(); g.translate(120, h / 2); g.rotate(-0.7);
      g.fillRect(-12, -10, 24, 120);
      g.beginPath(); g.arc(0, -40, 46, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#05070a'; g.fillRect(-16, -96, 32, 56);
      g.restore();
    }
    texPantalla.needsUpdate = true;
  }

  // ---------------- Acelerador de pulgar (lado derecho, +z) ----------------
  const ZA = 0.148;
  // Acelerador de pulgar: paleta en el plano HORIZONTAL que sale hacia el conductor (-x) y baja al presionarla.
  function crearUnidadAcelerador(nuevo) {
    const unidad = new THREE.Group();
    const carcasa = cilindroZ(0.019, 0.022, mat.plastico, 32);
    carcasa.position.set(M.x, M.y, ZA);
    const pivote = new THREE.Group();
    pivote.position.set(M.x - 0.016, M.y - 0.004, ZA + 0.002);
    const paleta = new THREE.Mesh(new RoundedBoxGeometry(0.038, 0.006, 0.024, 2, 0.0025), mat.plastico);
    paleta.position.set(-0.019, 0, 0);
    const marcaPaleta = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.0066, 0.02), nuevo ? mat.ledCian : new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.6 }));
    marcaPaleta.position.set(-0.032, 0, 0);
    pivote.add(paleta, marcaPaleta);
    unidad.add(carcasa, pivote);
    scooter.add(unidad);
    return { unidad, pivote };
  }
  const viejo = crearUnidadAcelerador(false);
  const nuevo = crearUnidadAcelerador(true);
  const acelerador = viejo.pivote;
  const fijarAcelerador = (r) => { viejo.pivote.rotation.z = 0.45 * limitar(r, 0, 1); nuevo.pivote.rotation.z = 0; };
  const halloNuevo = kit.halo(new THREE.Color(0.4, 2.4, 2.8), 0.07);
  escena.add(halloNuevo);
  const zPuño = sc.puños[1].position.z;

  // ---------------- Sensor de la maneta de freno (lado izquierdo, -z) ----------------
  const sensor = new THREE.Group();
  sensor.position.set(M.x + 0.03, M.y + 0.005, -0.126);
  scooter.add(sensor);
  const cajaSensor = new THREE.Mesh(new RoundedBoxGeometry(0.014, 0.01, 0.014, 2, 0.002), mat.plastico);
  const luzSensor = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 10, 8), mat.ledRojo);
  luzSensor.position.set(0.0, 0.0052, 0.0);
  sensor.add(cajaSensor, luzSensor);
  const cableSensor = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    V(M.x + 0.03, M.y + 0.005, -0.12), V(M.x + 0.02, M.y + 0.03, -0.08), V(M.x + 0.01, M.y + 0.035, -0.04),
  ]), 40, 0.0018, 8), mat.manguera);
  scooter.add(cableSensor);

  // ---------------- Bolsa colgada que traba el freno ----------------
  const bolsa = new THREE.Group();
  scooter.add(bolsa);
  const tela = new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.95, envMapIntensity: 0.2 });
  const cuerpoBolsa = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.2, 0.07, 4, 0.03), tela);
  cuerpoBolsa.position.set(M.x + 0.06, M.y - 0.2, -0.2);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.005, 8, 40, Math.PI * 1.3), tela);
  asa.position.set(M.x + 0.06, M.y - 0.075, -0.2);
  asa.rotation.z = Math.PI * 0.85;
  const correa = kit.tubo(V(M.x + 0.05, M.y - 0.1, -0.2), V(M.x + 0.06, M.y - 0.012, -0.205), 0.004, tela);
  bolsa.add(cuerpoBolsa, asa, correa);

  // ---------------- Posiciones y planos ----------------
  scooter.updateMatrixWorld(true);
  const mundo = (obj, local = [0, 0, 0]) => obj.localToWorld(V(...local)).toArray();
  const enMundo = (obj, local) => () => obj.localToWorld(V(...local));
  const mas = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const PA = mundo(pantalla);
  const AC = mundo(acelerador, [-0.02, 0, 0]);
  const LV = mundo(maneta, [0, 0, -0.05]);
  const MM = M.toArray();

  const planos = [
    { t: 0, corte: true, de: { pos: mas(PA, [-0.3, 0.27, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 }, a: { pos: mas(PA, [-0.26, 0.23, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 } },
    { t: T('causa'), corte: true, de: { pos: mas(PA, [-0.42, 0.34, 0.0]), mira: mas(PA, [0.02, -0.02, 0]), fov: 34 }, a: { pos: mas(PA, [-0.4, 0.32, 0.0]), mira: mas(PA, [0.02, -0.02, 0]), fov: 34 } },
    { t: T('causa', 'acelerador', -0.3), de: { pos: mas(AC, [-0.1, 0.09, -0.13]), mira: mas(AC, [0, 0.0, 0]), fov: 30 }, a: { pos: mas(AC, [-0.095, 0.085, -0.125]), mira: mas(AC, [0, 0.0, 0]), fov: 30 }, transicion: 0.6 },
    { t: T('causa', 'freno', -0.3), de: { pos: mas(LV, [0.16, 0.2, -0.16]), mira: mas(LV, [-0.01, 0, 0.03]), fov: 30 }, a: { pos: mas(LV, [0.15, 0.19, -0.15]), mira: mas(LV, [-0.01, 0, 0.03]), fov: 30 }, transicion: 0.6 },
    { t: T('e14'), corte: true, de: { pos: mas(AC, [-0.11, 0.09, -0.14]), mira: mas(AC, [0, 0.0, 0]), fov: 30 }, a: { pos: mas(AC, [-0.095, 0.08, -0.12]), mira: mas(AC, [0, 0.0, 0]), fov: 30 } },
    { t: T('e15'), corte: true, de: { pos: mas(LV, [0.16, 0.2, -0.16]), mira: mas(LV, [-0.01, 0, 0.03]), fov: 30 }, a: { pos: mas(LV, [0.14, 0.18, -0.14]), mira: mas(LV, [-0.01, 0, 0.03]), fov: 30 } },
    { t: T('apaga'), corte: true, de: { pos: mas(PA, [-0.3, 0.27, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 }, a: { pos: mas(PA, [-0.27, 0.24, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 } },
    { t: T('mover'), corte: true, de: { pos: mas(AC, [-0.11, 0.09, -0.14]), mira: mas(AC, [0, 0.0, 0]), fov: 30 }, a: { pos: mas(AC, [-0.1, 0.085, -0.13]), mira: mas(AC, [0, 0.0, 0]), fov: 30 } },
    { t: T('mover', 'manetas', -0.2), de: { pos: mas(LV, [0.16, 0.2, -0.16]), mira: mas(LV, [-0.01, 0, 0.03]), fov: 30 }, a: { pos: mas(LV, [0.15, 0.19, -0.15]), mira: mas(LV, [-0.01, 0, 0.03]), fov: 30 }, transicion: 0.6 },
    { t: T('trabe'), corte: true, de: { pos: mas(LV, [0.42, 0.06, -0.5]), mira: mas(LV, [0.0, -0.12, 0.0]), fov: 34 }, a: { pos: mas(LV, [0.38, 0.05, -0.46]), mira: mas(LV, [0.0, -0.12, 0.0]), fov: 34 } },
    { t: T('trabe', 'puno', -0.45), de: { pos: mas(AC, [-0.33, 0.3, 0.06]), mira: mas(AC, [0.02, 0, 0.045]), fov: 32 }, a: { pos: mas(AC, [-0.31, 0.28, 0.06]), mira: mas(AC, [0.02, 0, 0.045]), fov: 32 }, transicion: 0.7 },
    { t: T('enciende'), corte: true, de: { pos: mas(PA, [-0.3, 0.27, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 }, a: { pos: mas(PA, [-0.27, 0.24, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 } },
    { t: T('cambiar'), corte: true, de: { pos: mas(AC, [-0.2, 0.17, -0.22]), mira: mas(AC, [0.0, 0.03, 0.02]), fov: 32 }, a: { pos: mas(AC, [-0.18, 0.15, -0.2]), mira: mas(AC, [0.0, 0.025, 0.02]), fov: 32 } },
    { t: T('riesgo'), corte: true, de: { pos: mas(PA, [-0.3, 0.27, 0.0]), mira: PA, fov: 30 } },
    { t: T('accidente'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.3, radio1: 3.1, altura0: 0.95, altura1: 0.85, ang0: 0.7, ang1: 1.0, fov: 34 } },
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.4, altura0: 1.0, altura1: 0.85, ang0: 0.6, ang1: 1.0, fov: 34 } },
  ];

  // ---------------- Rótulos ----------------
  const anclaPantalla = enMundo(pantalla, [0, 0, 0]);
  const anclaAcel = enMundo(acelerador, [-0.03, 0.003, 0]);
  const anclaNuevo = enMundo(nuevo.pivote, [-0.03, 0.003, 0]);
  const anclaPuño = () => scooter.localToWorld(V(M.x - 0.004, M.y + 0.018, sc.puños[1].position.z - 0.05));
  const anclaManeta = enMundo(maneta, [0, 0, -0.08]);
  const anclaSensor = enMundo(sensor, [0, 0.004, 0]);
  const anclaBolsa = enMundo(bolsa, [M.x + 0.06, M.y - 0.2, -0.165]);
  const rotulos = [
    { desde: 0.35, hasta: T('causa', null, -0.05), texto: 'Código de error', color: 'rojo', ancla: anclaPantalla, caja: [0, 330] },
    { desde: T('causa', 'acelerador'), hasta: T('causa', 'freno', -0.35), texto: 'Acelerador', ancla: anclaAcel, caja: [-150, 300] },
    { desde: T('causa', 'freno'), hasta: T('e14', null, -0.05), texto: 'Freno', ancla: anclaManeta, caja: [-120, 300] },
    { desde: T('e14', 'acelerador'), hasta: T('e14', 'no', -0.05), texto: 'Acelerador', ancla: anclaAcel, caja: [-150, -300] },
    { desde: T('e14', 'no'), hasta: T('e14', 'fin', 0.25), texto: 'No vuelve a cero', color: 'rojo', ancla: anclaAcel, caja: [-150, -300] },
    { desde: T('e15', 'sensor'), hasta: T('e15', 'no', -0.05), texto: 'Sensor', ancla: anclaSensor, caja: [-120, 300] },
    { desde: T('e15', 'no'), hasta: T('e15', 'fin', 0.25), texto: 'No vuelve a cero', color: 'rojo', ancla: anclaManeta, caja: [-120, 300] },
    { desde: T('mover', 'solos'), hasta: T('mover', 'fin', 0.25), texto: 'Vuelven solos', ancla: anclaManeta, caja: [-120, 300] },
    { desde: T('trabe', 'bolsa'), hasta: T('trabe', 'o', -0.1), texto: 'Bolsa colgada', color: 'rojo', ancla: anclaBolsa, caja: [-150, 260] },
    { desde: T('trabe', 'trabe'), hasta: T('trabe', 'o', -0.1), texto: 'Aprieta el freno', color: 'rojo', ancla: anclaManeta, caja: [220, 160] },
    { desde: T('trabe', 'puno'), hasta: T('trabe', 'fin', 0.25), texto: 'Puño corrido', color: 'rojo', ancla: anclaPuño, caja: [120, -300] },
    { desde: T('trabe', 'aprieta'), hasta: T('trabe', 'fin', 0.25), texto: 'Aprieta el acelerador', color: 'rojo', ancla: anclaAcel, caja: [160, 300] },
    { desde: T('cambiar', 'acelerador', 0.4), hasta: T('cambiar', 'fin', 0.25), texto: 'Acelerador nuevo', ancla: anclaNuevo, caja: [-120, -330] },
    // Esquema de los mandos y el motor (anclas en pantalla)
    { desde: T('peligro', 'acelerando'), hasta: T('peligro', 'o', -0.05), texto: 'Frenas… y sigue acelerando', color: 'rojo', linea: false, ancla: { pantalla: [540, 1480] }, caja: [0, 0] },
    { desde: T('peligro', 'frenarse'), hasta: T('accidente', null, -0.22), texto: 'Aceleras… y se frena de golpe', color: 'rojo', linea: false, ancla: { pantalla: [540, 1480] }, caja: [0, 0] },
    { desde: T('accidente', 'accidente'), hasta: T('accidente', 'fin', 0.25), texto: 'Riesgo de accidente', color: 'rojo', ancla: enMundo(scooter, [0.46, 0.15, 0.06]), caja: [-160, -330] },
    { desde: T('taller', 'taller'), hasta: T('taller', 'fin', 0.3), texto: 'Taller en Lima', ancla: enMundo(scooter, [-0.02, 0.19, 0.06]), caja: [-60, 260] },
  ];

  const fichas = [
    { desde: T('apaga', 'apaga'), hasta: T('apaga', 'fin', 0.25), texto: 'Scooter apagado', fila: 0 },
    { desde: T('enciende', 'fue'), hasta: T('enciende', 'fin', 0.25), texto: 'Código borrado', fila: 0 },
    { desde: T('cambiar', 'cientos'), hasta: T('cambiar', 'fin', 0.2), texto: 'Cientos de usos por semana', tipo: 'mal', fila: 0, y: 960 },
    { desde: T('cambiar', 'caida'), hasta: T('cambiar', 'fin', 0.2), texto: 'Golpe por una caída', tipo: 'mal', fila: 0, y: 1044 },
    { desde: T('accidente', 'avenida'), hasta: T('accidente', 'fin', 0.2), texto: 'Avenida', tipo: 'mal', fila: 0 },
    { desde: T('accidente', 'ciclovia'), hasta: T('accidente', 'fin', 0.2), texto: 'Ciclovía', tipo: 'mal', fila: 1 },
    { desde: T('accidente', 'cruce'), hasta: T('accidente', 'fin', 0.2), texto: 'Cruce', tipo: 'mal', fila: 2 },
  ];

  // ---------------- Posición de los mandos (0–1) ----------------
  const pulsos = (t, t0, t1, n, alto) => {
    if (t < t0 || t > t1) return 0;
    const k = (t - t0) / (t1 - t0) * n;
    return alto * Math.max(0, Math.sin(Math.PI * (k % 1)));
  };
  function posAcelerador(t) {
    if (t >= T('e14') && t < T('e15')) return 0.12 + 0.05 * pulsos(t, T('e14', 'acelerador'), T('e14', 'no'), 1, 1);
    if (t >= T('causa') && t < T('e14')) return 0.12;
    if (t < T('causa')) return 0.12;
    if (t >= T('trabe') && t < T('enciende')) return 0.28 * progreso(t, T('trabe', 'puno', 0.1), T('trabe', 'aprieta', 0.1), cubica);
    if (t >= T('mover') && t < T('trabe')) {
      const atascado = 0.12 * (1 - progreso(t, T('mover', 'suelta'), T('mover', 'acelerador', 0.3)));
      return Math.max(atascado, pulsos(t, T('mover', 'acelerador', 0.2), T('mover', 'manetas', -0.3), 2, 0.9));
    }
    return 0;
  }
  function posManeta(t) {
    if (t >= T('e15') && t < T('apaga')) return 0.09;
    if (t >= T('mover') && t < T('trabe')) return pulsos(t, T('mover', 'muevelos'), T('mover', 'solos', -0.1), 3, 0.85);
    if (t >= T('trabe') && t < T('enciende')) return 0.4 * (1 - progreso(t, T('trabe', 'manubrio', 0.1), T('trabe', 'o', 0.1), cubica));
    return 0;
  }
  const medidor = { unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [0, 3], tolerancia: 4 };
  const hud = [
    { ...medidor, nombre: 'POSICIÓN DEL ACELERADOR', desde: T('e14', 'acelerador'), hasta: T('e14', 'fin', 0.2), valor: (t) => 100 * posAcelerador(t) },
    { ...medidor, nombre: 'POSICIÓN DE LA MANETA', desde: T('e15', 'maneta'), hasta: T('e15', 'fin', 0.2), valor: (t) => 100 * posManeta(t) },
    { ...medidor, nombre: 'POSICIÓN DEL ACELERADOR', desde: T('mover', 'suelta'), hasta: T('mover', 'manetas', -0.3), valor: (t) => 100 * posAcelerador(t) },
    { ...medidor, nombre: 'POSICIÓN DE LA MANETA', desde: T('mover', 'manetas'), hasta: T('mover', 'fin', 0.2), valor: (t) => 100 * posManeta(t) },
  ];

  // ---------------- Esquema 2D: los mandos controlan el motor; qué pasa si fallan ----------------
  const esquemas = [{
    desde: T('riesgo'), hasta: T('accidente'),
    svg: (t) => {
      const caja = (x, y, w, h, txt, borde) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#14171b" stroke="${borde}" stroke-width="5"/>
        <text x="${x + w / 2}" y="${y + h / 2}" fill="#e9edf1" font-family="Poppins" font-weight="700" font-size="34" text-anchor="middle" dominant-baseline="middle">${txt}</text>`;
      const verAcel = progreso(t, T('riesgo', 'aceleracion', -0.1), T('riesgo', 'aceleracion', 0.3));
      const verFreno = progreso(t, T('riesgo', 'freno', -0.1), T('riesgo', 'freno', 0.3));
      const falla1 = t >= T('peligro', 'acelerando', -0.1) && t < T('peligro', 'frenarse', -0.1);
      const falla2 = t >= T('peligro', 'frenarse', -0.1);
      const mover = (t * 120) % 40;
      const flecha = (d, estado, vis) => {
        // estado: 'ok' (cian), 'atascada' (roja que sigue mandando), 'cortada' (roja con X)
        const color = estado === 'ok' ? '#3fd3df' : '#ff3b2f';
        const opacidad = estado === 'cortada' ? 0.55 : 1;
        return `<path d="${d}" stroke="${color}" stroke-width="12" fill="none" stroke-dasharray="26 14" stroke-dashoffset="${-mover}" opacity="${vis * opacidad}"/>`;
      };
      const x = (cx, cy, vis) => `<g opacity="${vis}" stroke="#ff3b2f" stroke-width="14" stroke-linecap="round"><line x1="${cx - 30}" y1="${cy - 30}" x2="${cx + 30}" y2="${cy + 30}"/><line x1="${cx + 30}" y1="${cy - 30}" x2="${cx - 30}" y2="${cy + 30}"/></g>`;
      const estAcel = falla1 ? 'atascada' : falla2 ? 'cortada' : 'ok';
      const estFreno = falla1 ? 'cortada' : falla2 ? 'atascada' : 'ok';
      return `
        <rect width="1080" height="1920" fill="#050608"/>
        <text x="540" y="760" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="26" text-anchor="middle" letter-spacing="4">LOS MANDOS CONTROLAN EL MOTOR</text>
        ${caja(90, 860, 320, 120, 'ACELERADOR', estAcel === 'ok' ? '#3fd3df' : '#ff3b2f')}
        ${caja(90, 1200, 320, 120, 'FRENO', estFreno === 'ok' ? '#3fd3df' : '#ff3b2f')}
        ${caja(660, 1030, 330, 130, 'MOTOR', falla1 || falla2 ? '#ff3b2f' : '#8d939b')}
        ${flecha('M 410 920 C 540 920, 540 1080, 660 1080', estAcel, verAcel)}
        ${flecha('M 410 1260 C 540 1260, 540 1110, 660 1110', estFreno, verFreno)}
        <text x="540" y="${930 - 40}" fill="#3fd3df" font-family="Poppins" font-weight="600" font-size="26" text-anchor="middle" opacity="${verAcel * (falla1 || falla2 ? 0 : 1)}">acelera</text>
        <text x="540" y="${1300 + 40}" fill="#3fd3df" font-family="Poppins" font-weight="600" font-size="26" text-anchor="middle" opacity="${verFreno * (falla1 || falla2 ? 0 : 1)}">frena</text>
        ${x(540, 1190, estFreno === 'cortada' ? 1 : 0)}
        ${x(540, 990, estAcel === 'cortada' ? 1 : 0)}`;
    },
  }];

  // ---------------- Animación por cuadro ----------------
  function actualizar(t) {
    fijarAcelerador(posAcelerador(t));
    fijarManeta(posManeta(t));
    // Pantalla
    let estado = 'ok';
    if (t < T('e15')) estado = 'e14';
    else if (t < T('apaga', 'apaga')) estado = 'e15';
    else if (t < T('enciende', 'encender')) estado = 'apagada';
    const parpadeo = Math.floor(t * 2.5) % 2 === 0;
    dibujarPantalla(estado, parpadeo);
    luzSensor.visible = t >= T('e15') && t < T('apaga') && parpadeo;
    bolsa.visible = t >= T('trabe') && t < T('trabe', 'o', 0.2);
    if (bolsa.visible) bolsa.position.y = -0.12 * progreso(t, T('trabe', 'manubrio', 0.1), T('trabe', 'o', 0.1), cubica);
    // Puño corrido que aprieta el acelerador
    const corrido = t >= T('trabe') && t < T('enciende') ? progreso(t, T('trabe', 'puno', -0.1), T('trabe', 'aprieta', 0.1), cubica) : 0;
    sc.puños[1].position.z = zPuño - 0.012 * corrido;
    // Cambio del acelerador: el viejo sale, el nuevo entra
    const sale = progreso(t, T('cambiar', 'cambiar', -0.1), T('cambiar', 'cambiar', 0.5), cubica);
    const entra = progreso(t, T('cambiar', 'acelerador', -0.1), T('cambiar', 'acelerador', 0.5), cubica);
    const enCambio = t >= T('cambiar') && t < T('riesgo');
    viejo.unidad.visible = !(t >= T('cambiar', 'cambiar', 0.5));
    viejo.unidad.position.set(-0.05 * (enCambio ? sale : 0), 0.12 * (enCambio ? sale : 0), 0);
    nuevo.unidad.visible = t >= T('cambiar', 'acelerador', -0.1);
    nuevo.unidad.position.set(0, 0.12 * (1 - entra), 0);
    halloNuevo.material.opacity = enCambio && nuevo.unidad.visible ? 0.55 * entra * (1 - progreso(t, T('cambiar', 'fin'), T('cambiar', 'fin', 0.3))) : 0;
    halloNuevo.position.copy(nuevo.pivote.localToWorld(V(-0.02, 0, 0)));
    halloNuevo.quaternion.copy(ctx.camara.quaternion);
    // Luz roja en el gancho, la traba y el accidente
    const enError = t < T('causa') || (t >= T('trabe') && t < T('enciende')) || (t >= T('accidente') && t < T('taller'));
    luces.modo(enError ? 'error' : 'normal');
    const general = t >= T('accidente');
    escena.fog.near = general ? 4.5 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.2) },
  };
}
