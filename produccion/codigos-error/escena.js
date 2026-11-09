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
  const carcasaAcel = cilindroZ(0.019, 0.022, mat.plastico, 32);
  carcasaAcel.position.set(M.x, M.y, ZA);
  scooter.add(carcasaAcel);
  const acelerador = new THREE.Group();
  acelerador.position.set(M.x + 0.008, M.y - 0.012, ZA + 0.004);
  scooter.add(acelerador);
  const paleta = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.042, 0.028, 2, 0.003), mat.plastico);
  paleta.position.set(0.004, -0.021, 0);
  const marcaAcel = new THREE.Mesh(new THREE.BoxGeometry(0.0085, 0.01, 0.004), mat.ledCian);
  marcaAcel.position.set(0.004, -0.034, 0);
  acelerador.add(paleta, marcaAcel);
  const fijarAcelerador = (r) => { acelerador.rotation.z = 0.55 * limitar(r, 0, 1); };

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
  const AC = mundo(acelerador, [0.004, -0.02, 0]);
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
    { t: T('enciende'), corte: true, de: { pos: mas(PA, [-0.3, 0.27, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 }, a: { pos: mas(PA, [-0.27, 0.24, 0.0]), mira: mas(PA, [0.01, -0.01, 0]), fov: 30 } },
    { t: T('taller'), corte: true, de: { pos: mas(PA, [-0.16, 0.14, 0.0]), mira: PA, fov: 30 } },
    { t: T('calle'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.3, radio1: 3.1, altura0: 0.95, altura1: 0.85, ang0: 0.7, ang1: 1.0, fov: 34 } },
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.4, altura0: 1.0, altura1: 0.85, ang0: 0.6, ang1: 1.0, fov: 34 } },
  ];

  // ---------------- Rótulos ----------------
  const anclaPantalla = enMundo(pantalla, [0, 0, 0]);
  const anclaAcel = enMundo(acelerador, [0.006, -0.03, 0.01]);
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
    { desde: T('trabe', 'bolsa'), hasta: T('trabe', 'fin', 0.25), texto: 'Bolsa colgada', color: 'rojo', ancla: anclaBolsa, caja: [-150, 260] },
    { desde: T('trabe', 'trabe'), hasta: T('trabe', 'fin', 0.25), texto: 'Aprieta el freno', color: 'rojo', ancla: anclaManeta, caja: [-120, -300] },
    // Esquema del cableado (anclas en pantalla)
    { desde: T('taller', 'cable'), hasta: T('taller', 'fin', 0.2), texto: 'Cable', color: 'rojo', ancla: { pantalla: [525, 1020] }, caja: [160, -150] },
    { desde: T('taller', 'sensor'), hasta: T('taller', 'fin', 0.2), texto: 'Sensor', color: 'rojo', ancla: { pantalla: [410, 1310] }, caja: [60, 220] },
    { desde: T('taller', 'taller'), hasta: T('taller', 'fin', 0.25), texto: 'Se revisa en el taller', color: 'rojo', ancla: { pantalla: [760, 1170] }, caja: [-120, 320] },
  ];

  const fichas = [
    { desde: T('apaga', 'apaga'), hasta: T('apaga', 'fin', 0.25), texto: 'Scooter apagado', fila: 0 },
    { desde: T('enciende', 'fue'), hasta: T('enciende', 'fin', 0.25), texto: 'Código borrado', fila: 0 },
    { desde: T('calle', 'asi'), hasta: T('calle', 'fin', 0.2), texto: 'No salgas así', tipo: 'mal', fila: 0 },
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
    if (t >= T('mover') && t < T('trabe')) {
      const atascado = 0.12 * (1 - progreso(t, T('mover', 'suelta'), T('mover', 'acelerador', 0.3)));
      return Math.max(atascado, pulsos(t, T('mover', 'acelerador', 0.2), T('mover', 'manetas', -0.3), 2, 0.9));
    }
    return 0;
  }
  function posManeta(t) {
    if (t >= T('e15') && t < T('apaga')) return 0.09;
    if (t >= T('mover') && t < T('trabe')) return pulsos(t, T('mover', 'muevelos'), T('mover', 'solos', -0.1), 3, 0.85);
    if (t >= T('trabe') && t < T('enciende')) return 0.4 * (1 - progreso(t, T('trabe', 'manubrio', 0.2), T('trabe', 'fin', 0.3), cubica));
    return 0;
  }
  const medidor = { unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [0, 3], tolerancia: 4 };
  const hud = [
    { ...medidor, nombre: 'POSICIÓN DEL ACELERADOR', desde: T('e14', 'acelerador'), hasta: T('e14', 'fin', 0.2), valor: (t) => 100 * posAcelerador(t) },
    { ...medidor, nombre: 'POSICIÓN DE LA MANETA', desde: T('e15', 'maneta'), hasta: T('e15', 'fin', 0.2), valor: (t) => 100 * posManeta(t) },
    { ...medidor, nombre: 'POSICIÓN DEL ACELERADOR', desde: T('mover', 'suelta'), hasta: T('mover', 'manetas', -0.3), valor: (t) => 100 * posAcelerador(t) },
    { ...medidor, nombre: 'POSICIÓN DE LA MANETA', desde: T('mover', 'manetas'), hasta: T('mover', 'fin', 0.2), valor: (t) => 100 * posManeta(t) },
  ];

  // ---------------- Esquema 2D: mandos → cables → controlador ----------------
  const esquemas = [{
    desde: T('taller'), hasta: T('calle'),
    svg: (t) => {
      const dañoCable = progreso(t, T('taller', 'cable'), T('taller', 'cable', 0.3));
      const dañoSensor = progreso(t, T('taller', 'sensor'), T('taller', 'sensor', 0.3));
      const pulso = 0.75 + 0.25 * Math.sin(t * 14);
      const caja = (x, y, w, h, txt, sub) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#14171b" stroke="#8d939b" stroke-width="4"/>
        <text x="${x + w / 2}" y="${y + h / 2 - (sub ? 14 : 0)}" fill="#e9edf1" font-family="Poppins" font-weight="700" font-size="32" text-anchor="middle" dominant-baseline="middle">${txt}</text>
        ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 26}" fill="#8d939b" font-family="Poppins" font-weight="600" font-size="22" text-anchor="middle" dominant-baseline="middle">${sub}</text>` : ''}`;
      return `
        <rect width="1080" height="1920" fill="#050608"/>
        ${caja(110, 870, 300, 120, 'ACELERADOR', 'error 14')}
        ${caja(110, 1250, 300, 120, 'MANETA', 'error 15')}
        ${caja(640, 1060, 320, 130, 'CONTROLADOR')}
        <path d="M 410 930 C 520 930, 520 1110, 640 1110" stroke="${dañoCable > 0 ? '#ff3b2f' : '#8d939b'}" stroke-width="10" fill="none" stroke-dasharray="${dañoCable > 0 ? '26 14' : 'none'}"/>
        <path d="M 410 1310 C 520 1310, 520 1150, 640 1150" stroke="#8d939b" stroke-width="10" fill="none"/>
        <circle cx="525" cy="1020" r="${22 + 14 * dañoCable * pulso}" fill="#ff3b2f" opacity="${0.75 * dañoCable}"/>
        <circle cx="410" cy="1310" r="${16 + 14 * dañoSensor * pulso}" fill="#ff3b2f" opacity="${0.85 * dañoSensor}"/>
        <circle cx="410" cy="1310" r="10" fill="#e9edf1"/>
        <text x="540" y="740" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="26" text-anchor="middle" letter-spacing="4">MANDOS DEL MANUBRIO</text>`;
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
    bolsa.visible = t >= T('trabe') && t < T('enciende');
    if (bolsa.visible) bolsa.position.y = -0.12 * progreso(t, T('trabe', 'manubrio', 0.2), T('trabe', 'fin', 0.3), cubica);
    // Luz roja en el gancho, la traba y "no salgas así"
    const enError = t < T('causa') || (t >= T('trabe') && t < T('enciende')) || (t >= T('calle') && t < T('cta'));
    luces.modo(enError ? 'error' : 'normal');
    const general = t >= T('calle');
    escena.fog.near = general ? 4.5 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.2) },
  };
}
