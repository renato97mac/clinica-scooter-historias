// Escena 3D del video "¿Tu freno roza a golpes? Cómo rectificar el disco doblado".
// Scooter clásico (freno de disco trasero con pinza mecánica). Tiempos sincronizados con T('frase', 'palabra').
import { crearKit } from '../motor/kit.js';

export async function crear(ctx) {
  const { THREE, escena, camara, T, utiles } = ctx;
  const { limitar, progreso, cubica, suave } = utiles;
  const kit = crearKit({ THREE, escena, utiles });
  const { V, mat, luces, tubo, cilindroZ, RoundedBoxGeometry, R_EXT } = kit;

  const sc = kit.crearScooter();
  const { raiz, scooter, trasera } = sc;
  const RUEDA = V(-0.42, R_EXT, 0);

  // ---------------- Disco perforado (gira con la rueda; su inclinación simula el alabeo) ----------------
  const forma = new THREE.Shape();
  forma.absarc(0, 0, 0.06, 0, Math.PI * 2, false);
  const hueco = (cx, cy, r) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); forma.holes.push(p); };
  hueco(0, 0, 0.017);
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    hueco(Math.cos(a) * 0.047, Math.sin(a) * 0.047, 0.0021);
    hueco(Math.cos(a + Math.PI / 20) * 0.0535, Math.sin(a + Math.PI / 20) * 0.0535, 0.0019);
  }
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + 0.3;
    const p = new THREE.Path();
    p.absellipse(Math.cos(a) * 0.031, Math.sin(a) * 0.031, 0.0085, 0.0045, 0, Math.PI * 2, true, a + Math.PI / 2);
    forma.holes.push(p);
  }
  const portaDisco = new THREE.Group();
  portaDisco.position.z = 0.037;
  trasera.giro.add(portaDisco);
  const disco = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.0022, bevelEnabled: false, curveSegments: 40 }), mat.acero);
  disco.position.z = -0.0011;
  portaDisco.add(disco);
  const soporte = cilindroZ(0.019, 0.012, mat.aluOscuro, 40);
  soporte.position.z = 0.031;
  trasera.giro.add(soporte);
  // Marca del punto de roce (naranja), en el borde del disco
  const marca = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.0008, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.1, 0.2), toneMapped: false }));
  marca.rotation.x = Math.PI / 2;
  portaDisco.add(marca);

  // ---------------- Pinza mecánica (fija) ----------------
  const ANG_PINZA = (150 * Math.PI) / 180;
  const C = V(RUEDA.x + Math.cos(ANG_PINZA) * 0.05, RUEDA.y + Math.sin(ANG_PINZA) * 0.05, 0.039);
  const pinza = new THREE.Group();
  pinza.position.copy(C);
  scooter.add(pinza);
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.03, 0.026, 3, 0.006), mat.plastico);
  cuerpo.rotation.z = ANG_PINZA - Math.PI / 2;
  const tapa = cilindroZ(0.011, 0.004, mat.aluOscuro, 40);
  tapa.position.z = 0.014;
  pinza.add(cuerpo, tapa);
  const brazo = new THREE.Mesh(new RoundedBoxGeometry(0.042, 0.011, 0.004, 2, 0.002), mat.aluOscuro);
  brazo.position.set(0.0075, 0.013, 0.017);
  brazo.rotation.z = Math.PI / 3;
  pinza.add(brazo);
  const ruta = new THREE.CatmullRomCurve3([V(C.x + 0.045, C.y + 0.026, C.z + 0.017), V(-0.385, 0.155, 0.068), V(-0.34, 0.12, 0.09), V(-0.2, 0.106, 0.093), V(0.2, 0.106, 0.093)]);
  scooter.add(new THREE.Mesh(new THREE.TubeGeometry(ruta, 120, 0.0028, 10), mat.manguera));

  // ---------------- Enderezadora de discos (barra con ranura) ----------------
  const herramienta = new THREE.Group();
  trasera.grupo.add(herramienta);
  const barra = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.016, 0.008, 2, 0.003), mat.aluminio);
  barra.position.x = 0.075;
  const cabezal = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.022, 0.014, 2, 0.003), mat.aluOscuro);
  cabezal.position.x = 0.008;
  const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.024, 0.0028), new THREE.MeshBasicMaterial({ color: 0x050608 }));
  ranura.position.x = 0.0;
  const franja = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.0165, 0.0085), mat.ledCian);
  franja.position.x = 0.11;
  herramienta.add(barra, cabezal, ranura, franja);
  const ANG_TRABAJO = -1.05; // donde se trabaja: abajo-adelante, lejos de la pinza

  // ---------------- Caballete ----------------
  const ALZA = -Math.atan(0.034 / 0.84);
  const base = new THREE.Group();
  const caballete = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.128, 0.13, 3, 0.008), mat.aluOscuro);
  caballete.position.y = 0.064;
  base.add(caballete);
  base.position.set(-0.28, 0, 0);
  escena.add(base);
  const roce = kit.halo(new THREE.Color(2.2, 0.3, 0.12), 0.04);
  escena.add(roce);

  // ---------------- Posiciones y planos ----------------
  const conAlza = (fn) => { raiz.rotation.z = ALZA; raiz.updateMatrixWorld(true); const r = fn(); raiz.rotation.z = 0; raiz.updateMatrixWorld(true); return r; };
  raiz.updateMatrixWorld(true);
  const mundo = (obj, local = [0, 0, 0]) => obj.localToWorld(V(...local)).toArray();
  const enMundo = (obj, local) => () => obj.localToWorld(V(...local));
  const mas = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const RU = mundo(trasera.grupo);
  const RA = conAlza(() => mundo(trasera.grupo));
  const TRAB = conAlza(() => mundo(trasera.grupo, [Math.cos(ANG_TRABAJO) * 0.058, Math.sin(ANG_TRABAJO) * 0.058, 0.04]));

  const planos = [
    { t: 0, corte: true, de: { pos: mas(RU, [0.15, 0.08, 0.3]), mira: mas(RU, [-0.02, 0.02, 0.03]), fov: 32 }, a: { pos: mas(RU, [0.12, 0.07, 0.27]), mira: mas(RU, [-0.02, 0.02, 0.03]), fov: 32 } },
    { t: T('causa'), corte: true, de: { pos: mas(RU, [0.22, 0.05, 0.36]), mira: mas(RU, [-0.01, 0.0, 0.03]), fov: 32 }, a: { pos: mas(RU, [0.2, 0.045, 0.33]), mira: mas(RU, [-0.01, 0.0, 0.03]), fov: 32 } },
    { t: T('prueba'), corte: true, de: { pos: mas(RA, [0.34, 0.14, 0.44]), mira: mas(RA, [0, 0.0, 0.02]), fov: 32 }, a: { pos: mas(RA, [0.3, 0.12, 0.4]), mira: mas(RA, [0, 0.0, 0.02]), fov: 32 } },
    { t: T('seguridad'), corte: true, de: { pos: mas(RA, [0.3, 0.12, 0.4]), mira: RA, fov: 32 } },
    { t: T('prep'), corte: true, de: { pos: mas(RA, [0.2, 0.1, 0.36]), mira: mas(RA, [-0.01, 0.01, 0.03]), fov: 32 }, a: { pos: mas(RA, [0.17, 0.09, 0.33]), mira: mas(RA, [-0.01, 0.01, 0.03]), fov: 32 } },
    { t: T('marcar'), corte: true, de: { pos: mas(RA, [0.06, 0.1, 0.22]), mira: mas(RA, [-0.03, 0.02, 0.03]), fov: 30 }, a: { pos: mas(RA, [0.05, 0.09, 0.2]), mira: mas(RA, [-0.035, 0.025, 0.03]), fov: 30 } },
    { t: T('herramienta', 'fuera', -0.2), de: { pos: mas(TRAB, [0.13, 0.06, 0.2]), mira: mas(TRAB, [0.02, 0.0, 0]), fov: 30 }, a: { pos: mas(TRAB, [0.12, 0.05, 0.18]), mira: mas(TRAB, [0.02, 0.0, 0]), fov: 30 }, transicion: 0.9 },
    { t: T('repite'), corte: true, de: { pos: mas(RA, [0.2, 0.1, 0.36]), mira: mas(RA, [-0.01, 0.01, 0.03]), fov: 32 }, a: { pos: mas(RA, [0.18, 0.09, 0.34]), mira: mas(RA, [-0.01, 0.01, 0.03]), fov: 32 } },
    { t: T('criterio'), corte: true, de: { pos: mas(RA, [0.2, 0.1, 0.36]), mira: RA, fov: 32 } },
    { t: T('verif'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.5, 0], radio0: 3.2, radio1: 3.0, altura0: 0.95, altura1: 0.85, ang0: 0.55, ang1: 0.95, fov: 34 } },
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.52, 0], radio0: 3.3, altura0: 1.0, altura1: 0.85, ang0: 0.6, ang1: 1.0, fov: 34 } },
  ];

  // ---------------- Giro de la rueda (ángulo acumulado) ----------------
  // La marca se pone en el ángulo del disco que coincide con la pinza cuando la rueda se detiene en "roza".
  const giroLibre = (t) => {
    if (t < T('causa')) return -t * 3.2;
    if (t < T('prueba')) return -T('causa') * 3.2 - (t - T('causa')) * 1.6;
    return 0;
  };
  const tMarca = T('marcar', 'roza', 0.2);
  const GIRO_MARCA = -6.2;          // ángulo de la rueda cuando se marca
  const GIRO_TRABAJO = GIRO_MARCA + (ANG_TRABAJO - ANG_PINZA); // lleva la marca a la zona de trabajo
  function giroRueda(t) {
    if (t < T('prueba')) return giroLibre(t);
    if (t < T('prep')) return -(t - T('prueba')) * 2.6;
    if (t < T('marcar')) return 0;
    if (t < T('herramienta')) return GIRO_MARCA * progreso(t, T('marcar'), tMarca, (x) => 1 - Math.pow(1 - x, 2));
    if (t < T('repite')) return GIRO_MARCA + (GIRO_TRABAJO - GIRO_MARCA) * progreso(t, T('herramienta', 'fuera', -0.2), T('herramienta', 'pinza', 0.3), cubica);
    if (t < T('verif')) return GIRO_TRABAJO - (t - T('repite')) * 2.4;
    return 0;
  }
  // Alabeo del disco (exagerado para verlo): se corrige con la herramienta y al repetir
  function alabeo(t) {
    let a = 0.075;
    a -= 0.03 * progreso(t, T('error', 'dobla'), T('error', 'poquito', 0.3), cubica);
    a -= 0.03 * progreso(t, T('repite', 'repite'), T('repite', 'fin', 0.3), cubica);
    a -= 0.01 * progreso(t, T('criterio', 'menos'), T('criterio', 'tarjeta'), cubica);
    return t >= T('verif') ? 0 : a;
  }
  // Nivel de roce: pulso una vez por vuelta (disco) o parejo (pinza)
  function nivelRoce(t) {
    const g = giroRueda(t);
    const fase = Math.cos(g - (ANG_PINZA - (GIRO_MARCA - ANG_PINZA) * 0) + 0);
    const golpe = Math.pow(Math.max(0, Math.cos(-g + GIRO_MARCA)), 10);
    if (t >= T('pinza') && t < T('seguridad')) return 55 + 5 * Math.sin(t * 30);
    return 4 + 85 * golpe * (alabeo(t) / 0.075) + 0 * fase;
  }

  // ---------------- Rótulos ----------------
  const anclaPinza = enMundo(pinza, [0, 0, 0.014]);
  const anclaDisco = enMundo(trasera.grupo, [0.035, 0.03, 0.04]);
  const anclaMarca = () => marca.localToWorld(V(0, 0, 0));
  const anclaHerr = () => herramienta.localToWorld(V(0.018, 0, 0.008));
  const rotulos = [
    { desde: 0.3, hasta: T('causa', null, -0.05), texto: 'Roce a golpes', color: 'rojo', ancla: anclaPinza, caja: [140, -280] },
    { desde: T('causa', 'doblado'), hasta: T('prueba', null, -0.05), texto: 'Disco doblado', color: 'rojo', ancla: anclaDisco, caja: [-60, 420] },
    { desde: T('causa', 'doblado'), hasta: T('prueba', null, -0.05), texto: 'exagerado para verlo', color: 'blanco', chico: true, linea: false, ancla: { pantalla: [540, 1560] }, caja: [0, 0] },
    { desde: T('prueba', 'punto'), hasta: T('prueba', 'fin', 0.25), texto: 'En un solo punto', color: 'rojo', ancla: anclaPinza, caja: [140, -280] },
    { desde: T('pinza', 'pinza'), hasta: T('pinza', 'fin', 0.25), texto: 'Parejo: es la pinza', color: 'blanco', ancla: anclaPinza, caja: [140, -280] },
    { desde: T('seguridad', 'rajado'), hasta: T('seguridad', 'no', -0.05), texto: 'Rajado', color: 'rojo', ancla: { pantalla: [610, 1000] }, caja: [120, -330] },
    { desde: T('seguridad', 'no'), hasta: T('seguridad', 'fin', 0.25), texto: 'Se cambia', color: 'rojo', ancla: { pantalla: [610, 1000] }, caja: [120, -330] },
    { desde: T('marcar', 'roza'), hasta: T('herramienta', 'fuera', -0.1), texto: 'Aquí roza', color: 'rojo', ancla: anclaMarca, caja: [220, -260] },
    { desde: T('herramienta', 'pinza'), hasta: T('herramienta', 'encaja', -0.05), texto: 'Fuera de la pinza', color: 'blanco', ancla: anclaMarca, caja: [200, -260] },
    { desde: T('herramienta', 'enderezadora'), hasta: T('error', 'fuerza', -0.05), texto: 'Enderezadora', ancla: anclaHerr, caja: [220, 230] },
    { desde: T('error', 'fuerza'), hasta: T('error', 'dobla', -0.05), texto: 'Sin fuerza', color: 'rojo', ancla: anclaHerr, caja: [220, 230] },
    { desde: T('error', 'dobla'), hasta: T('error', 'fin', 0.25), texto: 'Muy poco · contrario al roce', color: 'blanco', ancla: anclaHerr, caja: [120, 230] },
    // Esquema de la tarjeta (pantalla)
    { desde: T('criterio', 'tarjeta'), hasta: T('criterio', 'fin', 0.25), texto: 'Tarjeta', color: 'blanco', ancla: { pantalla: [610, 1060] }, caja: [210, 160] },
    { desde: T('taller', 'taller'), hasta: T('taller', 'fin', 0.3), texto: 'Taller en Lima', ancla: enMundo(scooter, [-0.02, 0.16, 0.06]), caja: [-60, 260] },
  ];

  const fichas = [
    { desde: T('prep', 'apagado'), hasta: T('prep', 'fin', 0.2), texto: 'Scooter apagado', fila: 0 },
    { desde: T('prep', 'frio'), hasta: T('prep', 'fin', 0.2), texto: 'Disco frío', fila: 1 },
    { desde: T('prep', 'dedos'), hasta: T('prep', 'fin', 0.2), texto: 'Dedos sin grasa', fila: 2 },
    { desde: T('repite', 'revisa'), hasta: T('repite', 'fin', 0.2), texto: 'Gira y revisa', fila: 0, y: 960 },
    { desde: T('verif', 'despacio'), hasta: T('verif', 'fin', 0.2), texto: 'Prueba despacio', fila: 0 },
  ];

  const medidor = { nombre: 'ROCE', unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [0, 8], tolerancia: 12 };
  const hud = [
    { ...medidor, desde: 0.2, hasta: T('causa', null, -0.1), valor: nivelRoce },
    { ...medidor, desde: T('prueba', 'gira'), hasta: T('pinza', 'fin', 0.2), valor: nivelRoce },
    { ...medidor, desde: T('repite'), hasta: T('repite', 'fin', 0.2), valor: nivelRoce },
  ];

  // ---------------- Esquemas 2D: disco rajado y criterio de la tarjeta ----------------
  const discoFrente = (cx, cy, r) => {
    let agujeros = '';
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; agujeros += `<circle cx="${cx + Math.cos(a) * r * 0.8}" cy="${cy + Math.sin(a) * r * 0.8}" r="${r * 0.04}" fill="#050608"/>`; }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#b4bac2" stroke="#e6e9ee" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="#050608"/>${agujeros}`;
  };
  const esquemas = [
    {
      desde: T('seguridad'), hasta: T('prep'),
      svg: (t) => {
        const k = progreso(t, T('seguridad', 'rajado', -0.1), T('seguridad', 'rajado', 0.5), cubica);
        const largo = 260 * k;
        return `<rect width="1080" height="1920" fill="#050608"/>${discoFrente(540, 1060, 300)}
          <path d="M 560 ${1060 - 300} l 18 40 l -26 38 l 30 44 l -22 40 l 26 50 l -16 48" stroke="#ff3b2f" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${largo} 999"/>`;
      },
    },
    {
      desde: T('criterio'), hasta: T('verif'),
      svg: (t) => {
        const amp = 26 * (1 - 0.75 * progreso(t, T('criterio', 'menos'), T('criterio', 'tarjeta'), cubica));
        const x = 540 + amp * Math.sin(t * 9);
        const tarjeta = progreso(t, T('criterio', 'grosor', -0.1), T('criterio', 'tarjeta'), cubica);
        return `<rect width="1080" height="1920" fill="#050608"/>
          <rect x="300" y="820" width="40" height="480" rx="6" fill="#9aa1a9"/><rect x="340" y="840" width="90" height="440" rx="4" fill="#4b4741"/>
          <rect x="650" y="840" width="90" height="440" rx="4" fill="#4b4741"/><rect x="740" y="820" width="40" height="480" rx="6" fill="#9aa1a9"/>
          <rect x="${x - 22}" y="700" width="44" height="720" fill="#c3c9d1" stroke="#e6e9ee" stroke-width="3"/>
          <line x1="${x}" y1="690" x2="${x}" y2="1430" stroke="#ff3b2f" stroke-width="4"/>
          <rect x="${540 + 30}" y="760" width="${10}" height="600" fill="#ffffff" opacity="${tarjeta}"/>
          <text x="540" y="670" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="24" text-anchor="middle" letter-spacing="3">VISTA DESDE ARRIBA</text>`;
      },
    },
  ];

  // ---------------- Animación por cuadro ----------------
  function actualizar(t) {
    const alza = t >= T('prueba') && t < T('verif') ? progreso(t, T('prueba', 'levanta', -0.1), T('prueba', 'rueda', 0.2), cubica) : 0;
    raiz.rotation.z = ALZA * alza;
    base.visible = t >= T('prueba') && t < T('verif');
    sc.pantallaLuz.visible = !(t >= T('prep', 'apagado') && t < T('verif'));

    trasera.giro.rotation.z = t >= T('cta') ? -(t - T('cta')) * 1.2 : giroRueda(t);
    portaDisco.rotation.x = alabeo(t);
    // La marca: en el borde del disco, en el ángulo que queda frente a la pinza cuando se marca
    const angMarca = ANG_PINZA - GIRO_MARCA;
    marca.position.set(Math.cos(angMarca) * 0.052, Math.sin(angMarca) * 0.052, 0.0014);
    marca.visible = t >= tMarca && t < T('verif');
    marca.scale.setScalar(Math.max(0.01, progreso(t, tMarca, tMarca + 0.25, cubica)));

    // Herramienta: entra radialmente hacia la marca y empuja muy poco
    const conHerr = t >= T('herramienta', 'encaja', -0.3) && t < T('repite');
    herramienta.visible = conHerr;
    if (conHerr) {
      const entra = progreso(t, T('herramienta', 'encaja', -0.3), T('herramienta', 'enderezadora', 0.2), cubica);
      const r = 0.058 + (1 - entra) * 0.06;
      herramienta.position.set(Math.cos(ANG_TRABAJO) * r, Math.sin(ANG_TRABAJO) * r, 0.037);
      herramienta.rotation.set(0, 0, ANG_TRABAJO);
      const empuje = Math.sin(Math.PI * progreso(t, T('error', 'dobla'), T('error', 'poquito', 0.4), (x) => x));
      herramienta.rotateY(-0.12 * empuje);
    }

    // Luz roja: gancho y "error"
    const enError = t < T('causa') || (t >= T('error') && t < T('error', 'dobla'));
    luces.modo(enError ? 'error' : 'normal');
    const golpe = nivelRoce(t) / 100;
    const conRoce = t < T('causa') || (t >= T('prueba') && t < T('seguridad'));
    roce.material.opacity = conRoce ? 0.6 * golpe : 0;
    roce.position.copy(pinza.localToWorld(V(0.004, -0.008, 0.02)));
    roce.quaternion.copy(camara.quaternion);
    const general = t >= T('verif');
    escena.fog.near = general ? 4.5 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.2) },
  };
}
