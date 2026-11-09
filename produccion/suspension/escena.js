// Escena 3D del video "¿Tu suspensión chirría?".
// Scooter estilo Max con suspensión delantera de basculante (pasador con perno, bujes y amortiguador de resorte).
// Procedimiento dictado por el taller. Tiempos sincronizados con T('frase', 'palabra').
import { crearKit } from '../motor/kit.js';

export async function crear(ctx) {
  const { THREE, escena, camara, T, utiles } = ctx;
  const { limitar, progreso, cubica, suave } = utiles;
  const kit = crearKit({ THREE, escena, utiles });
  const { V, mat, luces, cilindroZ, RoundedBoxGeometry } = kit;

  const sc = kit.crearScooterMax({ pivote: 'trasera', suspension: true });
  const { scooter, pasador, perno, tuerca, bujes, fijarSuspension, PIV, basculante } = sc;

  // ---------------- Detalles del pasador ----------------
  // Óxido sobre el vástago (desaparece al limpiar) y capa de grasa (aparece al engrasar)
  const vastago = perno.children[0];
  const acero = vastago.material;
  const oxido = new THREE.MeshStandardMaterial({ color: 0x7a4a2a, metalness: 0.5, roughness: 0.85, envMapIntensity: 0.3 });
  const vastagoSucio = cilindroZ(0.0057, 0.17, oxido, 24);
  perno.add(vastagoSucio);
  const grasa = cilindroZ(0.0068, 0.15, new THREE.MeshPhysicalMaterial({ color: 0xd99a1e, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.85, envMapIntensity: 0.8 }), 24);
  perno.add(grasa);
  // Fijador de roscas (azul) en la punta del perno
  const fijador = cilindroZ(0.0062, 0.014, new THREE.MeshPhysicalMaterial({ color: 0x1f5bff, roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.9, emissive: 0x0a2a90, emissiveIntensity: 0.4 }), 24);
  fijador.position.z = -0.078;
  perno.add(fijador);
  // Bujes gastados: aro rojo de alerta
  const alertasBuje = bujes.map((b) => {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.0105, 0.0012, 8, 40), mat.ledRojo);
    aro.position.copy(b.position);
    pasador.add(aro);
    return aro;
  });
  // Arandelas que compensan el desgaste
  const arandelas = [-0.0765, 0.0765].map((z) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.0028, 10, 40), mat.cromo);
    a.position.z = z;
    pasador.add(a);
    return { malla: a, z };
  });
  // Brillo del chirrido en el pasador
  const chirrido = kit.halo(new THREE.Color(2.4, 0.35, 0.15), 0.09);
  escena.add(chirrido);

  // ---------------- Posiciones ----------------
  scooter.updateMatrixWorld(true);
  const mundo = (obj, local = [0, 0, 0]) => obj.localToWorld(V(...local)).toArray();
  const enMundo = (obj, local) => () => obj.localToWorld(V(...local));
  const mas = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const P = mundo(pasador);
  const FUERA = V(0.0, 0.045, 0.17); // dónde queda el perno al sacarlo (coordenadas del pasador)
  const PF = mas(P, FUERA.toArray());

  const planos = [
    { t: 0, corte: true, de: { pos: mas(P, [0.16, 0.1, 0.48]), mira: mas(P, [0.0, -0.015, 0.03]), fov: 32 }, a: { pos: mas(P, [0.13, 0.09, 0.43]), mira: mas(P, [0.0, -0.015, 0.03]), fov: 32 } },
    { t: T('causa'), corte: true, de: { pos: mas(P, [0.09, 0.06, 0.26]), mira: mas(P, [0, 0, 0.05]), fov: 30 }, a: { pos: mas(P, [0.07, 0.05, 0.22]), mira: mas(P, [0, 0, 0.05]), fov: 30 } },
    { t: T('porque'), corte: true, de: { pos: mas(P, [0.07, 0.05, 0.22]), mira: P, fov: 30 } },
    { t: T('desgaste'), corte: true, de: { pos: mas(P, [0.05, 0.045, 0.19]), mira: mas(P, [0, 0, 0.065]), fov: 30 }, a: { pos: mas(P, [0.04, 0.04, 0.17]), mira: mas(P, [0, 0, 0.068]), fov: 30 } },
    { t: T('mucho'), de: { pos: mas(P, [0.14, 0.07, 0.32]), mira: mas(P, [0.01, 0, 0.02]), fov: 30 }, a: { pos: mas(P, [0.13, 0.065, 0.3]), mira: mas(P, [0.01, 0, 0.02]), fov: 30 }, transicion: 0.8 },
    { t: T('desmonta'), corte: true, de: { pos: mas(P, [0.24, 0.11, 0.34]), mira: mas(P, [0, 0.02, 0.1]), fov: 30 }, a: { pos: mas(P, [0.22, 0.1, 0.32]), mira: mas(P, [0, 0.025, 0.11]), fov: 30 } },
    { t: T('engrasa'), corte: true, de: { pos: mas(PF, [0.05, 0.05, 0.2]), mira: PF, fov: 30 }, a: { pos: mas(PF, [0.04, 0.045, 0.18]), mira: PF, fov: 30 } },
    { t: T('arandela'), corte: true, de: { pos: mas(P, [0.2, 0.09, 0.3]), mira: mas(P, [0, 0.01, 0.06]), fov: 30 }, a: { pos: mas(P, [0.16, 0.075, 0.25]), mira: mas(P, [0, 0.005, 0.07]), fov: 30 } },
    { t: T('fijador'), corte: true, de: { pos: mas(P, [0.13, 0.07, -0.27]), mira: mas(P, [0, 0, -0.08]), fov: 30 }, a: { pos: mas(P, [0.11, 0.06, -0.24]), mira: mas(P, [0, 0, -0.08]), fov: 30 } },
    { t: T('listo'), corte: true, de: { pos: mas(P, [0.16, 0.1, 0.48]), mira: mas(P, [0.0, -0.015, 0.03]), fov: 32 }, a: { pos: mas(P, [0.14, 0.09, 0.44]), mira: mas(P, [0.0, -0.015, 0.03]), fov: 32 } },
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.55, 0], radio0: 3.4, altura0: 1.0, altura1: 0.85, ang0: 0.6, ang1: 1.0, fov: 34 } },
  ];

  // ---------------- Rótulos ----------------
  const anclaPasador = enMundo(pasador, [0, 0, 0.083]);
  const anclaBuje = enMundo(pasador, [0, 0.009, 0.0715]);
  const anclaBasculante = enMundo(basculante, [0.03, -0.02, 0.07]);
  const anclaPerno = () => perno.localToWorld(V(0, 0, 0.0));
  const anclaFijador = () => perno.localToWorld(V(0, 0.006, -0.078));
  const anclaArandela = enMundo(pasador, [0, 0.011, 0.0765]);
  const anclaGrasa = () => perno.localToWorld(V(0, 0.007, 0.02));
  const rotulos = [
    { desde: 0.3, hasta: T('causa', null, -0.05), texto: 'Chirrido', color: 'rojo', ancla: anclaPasador, caja: [-150, -330] },
    { desde: T('causa', 'pasadores'), hasta: T('causa', 'bascula', -0.05), texto: 'Pasador', ancla: anclaPasador, caja: [-170, 300] },
    { desde: T('causa', 'bascula'), hasta: T('causa', 'fin', 0.25), texto: 'Aquí bascula', color: 'blanco', ancla: anclaPasador, caja: [-170, 300] },
    // Esquema (anclas en pantalla)
    { desde: T('porque', 'roza'), hasta: T('porque', 'fin', 0.2), texto: 'Pasador', ancla: { pantalla: [540, 1060] }, caja: [-260, -380] },
    { desde: T('porque', 'roza'), hasta: T('porque', 'fin', 0.2), texto: 'Buje', ancla: { pantalla: [700, 1130] }, caja: [150, 330] },
    { desde: T('porque', 'metal'), hasta: T('porque', 'fin', 0.2), texto: 'Metal con metal', color: 'rojo', ancla: { pantalla: [655, 940] }, caja: [80, -330] },
    { desde: T('desgaste', 'desgaste'), hasta: T('desgaste', 'fin', 0.25), texto: 'Desgaste', color: 'rojo', ancla: anclaBuje, caja: [-180, 300] },
    { desde: T('mucho', 'juego'), hasta: T('mucho', 'traelo', -0.05), texto: 'Juego', color: 'rojo', ancla: anclaBasculante, caja: [-150, 300] },
    { desde: T('mucho', 'traelo'), hasta: T('mucho', 'fin', 0.25), texto: 'Al taller', color: 'rojo', ancla: anclaBasculante, caja: [-150, 300] },
    { desde: T('desmonta', 'pasadores'), hasta: T('desmonta', 'fin', 0.25), texto: 'Perno del pasador', ancla: anclaPerno, caja: [-170, -320] },
    { desde: T('engrasa', 'engrasalos'), hasta: T('engrasa', 'fin', 0.25), texto: 'Grasa espesa', ancla: anclaGrasa, caja: [-150, 320] },
    { desde: T('arandela', 'arandela'), hasta: T('arandela', 'compensa', -0.05), texto: 'Arandela', ancla: anclaArandela, caja: [-160, 300] },
    { desde: T('arandela', 'compensa'), hasta: T('arandela', 'fin', 0.25), texto: 'Compensa el desgaste', color: 'blanco', ancla: anclaArandela, caja: [-140, 300] },
    { desde: T('fijador', 'fijador'), hasta: T('fijador', 'aprieta', -0.05), texto: 'Fijador', ancla: anclaFijador, caja: [140, 300] },
    { desde: T('fijador', 'aprieta'), hasta: T('fijador', 'fin', 0.3), texto: 'Aprieta', color: 'blanco', ancla: anclaFijador, caja: [140, 300] },
    { desde: T('listo', 'ruido'), hasta: T('listo', 'fin', 0.3), texto: 'Sin ruido', ancla: anclaPasador, caja: [-150, -330] },
  ];

  const fichas = [
    { desde: T('engrasa', 'limpialos'), hasta: T('engrasa', 'fin', 0.2), texto: 'Limpio', fila: 0 },
    { desde: T('engrasa', 'espesa'), hasta: T('engrasa', 'fin', 0.2), texto: 'Grasa espesa', fila: 1 },
    { desde: T('engrasa', 'alto'), hasta: T('engrasa', 'fin', 0.2), texto: 'Alto rendimiento', fila: 2 },
    { desde: T('listo', 'juego'), hasta: T('listo', 'fin', 0.2), texto: 'Sin juego', fila: 0 },
  ];

  // ---------------- Baches y nivel de chirrido ----------------
  const baches = (t, t0, t1, n) => {
    if (t < t0 || t > t1) return 0;
    const k = ((t - t0) / (t1 - t0)) * n;
    const f = k % 1;
    return f < 0.35 ? Math.sin((f / 0.35) * Math.PI) : -0.15 * Math.sin(((f - 0.35) / 0.65) * Math.PI);
  };
  function compresion(t) {
    if (t < T('causa')) return baches(t, 0.1, T('causa'), 3);
    if (t >= T('causa', 'bascula', -0.1) && t < T('porque')) return 0.5 * Math.sin((t - T('causa', 'bascula')) * 6) * progreso(t, T('causa', 'bascula', -0.1), T('causa', 'bascula', 0.2));
    if (t >= T('listo') && t < T('cta')) return baches(t, T('listo'), T('listo', 'fin', 0.2), 3);
    return 0;
  }
  const hud = [
    { nombre: 'CHIRRIDO', unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [0, 8], tolerancia: 10, desde: 0.2, hasta: T('causa', null, -0.1), valor: (t) => 15 + 80 * Math.max(0, compresion(t)) },
    { nombre: 'CHIRRIDO', unidad: '%', max: 100, marcas: [0, 25, 50, 75, 100], banda: [0, 8], tolerancia: 10, desde: T('listo'), hasta: T('listo', 'fin', 0.2), valor: (t) => 2 + 2 * Math.max(0, compresion(t)) },
  ];

  // ---------------- Esquema 2D: corte del pasador dentro del buje ----------------
  const esquemas = [{
    desde: T('porque'), hasta: T('desgaste'),
    svg: (t) => {
      const giro = Math.sin(t * 7) * 18;
      const roce = progreso(t, T('porque', 'metal'), T('porque', 'metal', 0.3));
      const pulso = 0.7 + 0.3 * Math.sin(t * 16);
      const chispas = [0, 1, 2, 3, 4].map((i) => {
        const a = (-60 + i * 12 + giro) * Math.PI / 180;
        const r1 = 128, r2 = 128 + 30 + 20 * Math.sin(t * 20 + i);
        return `<line x1="${540 + r1 * Math.cos(a)}" y1="${1060 + r1 * Math.sin(a)}" x2="${540 + r2 * Math.cos(a)}" y2="${1060 + r2 * Math.sin(a)}" stroke="#ff3b2f" stroke-width="6" stroke-linecap="round" opacity="${roce * pulso}"/>`;
      }).join('');
      return `
        <rect width="1080" height="1920" fill="#050608"/>
        <circle cx="540" cy="1060" r="260" fill="#2a2d32" stroke="#8d939b" stroke-width="5"/>
        <circle cx="540" cy="1060" r="175" fill="#b08a3e" stroke="#e0c27a" stroke-width="5"/>
        <circle cx="540" cy="1060" r="132" fill="#0b0c0e"/>
        <g transform="rotate(${giro} 540 1060)">
          <circle cx="540" cy="1060" r="122" fill="#9aa1a9" stroke="#e6e9ee" stroke-width="5"/>
          <rect x="525" y="950" width="30" height="220" rx="6" fill="#6d737b"/>
        </g>
        <path d="M ${540 + 132 * Math.cos(-1.05)} ${1060 + 132 * Math.sin(-1.05)} A 132 132 0 0 1 ${540 + 132 * Math.cos(-0.35)} ${1060 + 132 * Math.sin(-0.35)}" stroke="#ff3b2f" stroke-width="${8 + 6 * roce}" fill="none" opacity="${roce}"/>
        ${chispas}
        <text x="540" y="740" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="26" text-anchor="middle" letter-spacing="4">CORTE DEL PASADOR</text>`;
    },
  }];

  // ---------------- Animación del perno ----------------
  function estadoPerno(t) {
    // 0 = dentro; 1 = fuera y en horizontal frente a la cámara
    if (t < T('desmonta', 'desmonta')) return 0;
    if (t < T('arandela')) return progreso(t, T('desmonta', 'desmonta', 0.1), T('desmonta', 'pasadores', 0.3), suave);
    return 1 - progreso(t, T('arandela', 'cerrar', -0.2), T('arandela', 'pon', 0.1), suave);
  }
  function actualizar(t) {
    fijarSuspension(compresion(t));
    // Juego lateral del basculante (bujes gastados)
    basculante.position.z = t >= T('mucho') && t < T('desmonta') ? 0.0025 * Math.sin(t * 22) * progreso(t, T('mucho', 'juego', -0.1), T('mucho', 'juego', 0.2)) : 0;

    // Perno: sale en línea recta y luego gira a horizontal; vuelve al cerrar
    const e = estadoPerno(t);
    const salir = limitar(e / 0.55), girar = limitar((e - 0.55) / 0.45);
    perno.position.set(FUERA.x * girar, FUERA.y * girar, FUERA.z * salir);
    perno.rotation.set(0, (Math.PI / 2) * girar, 0);
    // Óxido → limpio → grasa
    const limpio = progreso(t, T('engrasa', 'limpialos'), T('engrasa', 'limpialos', 0.5));
    vastagoSucio.visible = limpio < 1;
    vastagoSucio.material.opacity = 1 - limpio;
    vastagoSucio.material.transparent = limpio > 0;
    const engrasado = progreso(t, T('engrasa', 'engrasalos'), T('engrasa', 'grasa', 0.4), cubica);
    grasa.visible = engrasado > 0.01;
    grasa.scale.set(1, engrasado, 1);
    // Fijador en la punta y tuerca que entra al apretar
    fijador.visible = t >= T('fijador', 'fijador');
    fijador.scale.setScalar(Math.max(0.01, progreso(t, T('fijador', 'fijador'), T('fijador', 'fijador', 0.3), cubica)));
    const tuercaVisible = t < T('desmonta', 'desmonta', 0.2) || t >= T('fijador', 'aprieta', -0.5);
    tuerca.visible = tuercaVisible;
    const entra = progreso(t, T('fijador', 'aprieta', -0.5), T('fijador', 'aprieta', 0.4), cubica);
    tuerca.position.z = t >= T('fijador') ? -0.083 - (1 - entra) * 0.04 : -0.083;
    tuerca.rotation.z = t >= T('fijador') ? (1 - entra) * Math.PI * 6 : 0;
    // Bujes gastados y arandelas
    const verDesgaste = t >= T('desgaste', 'desgaste') && t < T('desmonta');
    alertasBuje.forEach((a) => { a.visible = verDesgaste && Math.floor(t * 3) % 2 === 0; });
    arandelas.forEach(({ malla, z }) => {
      const k = progreso(t, T('arandela', 'arandela', -0.2), T('arandela', 'arandela', 0.4), cubica);
      malla.visible = t >= T('arandela', 'arandela', -0.2);
      malla.position.z = z + Math.sign(z) * (1 - k) * 0.06;
    });
    // Brillo del chirrido
    const ruido = t < T('causa') ? Math.max(0, compresion(t)) : 0;
    chirrido.material.opacity = 0.6 * ruido;
    chirrido.position.copy(pasador.localToWorld(V(0, 0, 0.09)));
    chirrido.quaternion.copy(camara.quaternion);

    luces.modo(t < T('causa') ? 'error' : 'normal');
    const general = t >= T('cta');
    escena.fog.near = general ? 4.5 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.2) },
  };
}
