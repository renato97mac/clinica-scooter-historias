// Kit de piezas reutilizables para las escenas: materiales, luces, piso, ruedas y scooter.
// Uso en <video>/escena.js:
//   import { crearKit } from '../motor/kit.js';
//   const kit = crearKit({ THREE, escena, utiles });
//   const sc = kit.crearScooter({ valvula: false });
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function crearKit({ THREE, escena, utiles }) {
  const { limitar } = utiles;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------------- Materiales ----------------
  const env = 0.3;
  const mat = {
    plastico: new THREE.MeshPhysicalMaterial({ color: 0x0d0e10, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: env }),
    aluOscuro: new THREE.MeshStandardMaterial({ color: 0x30343a, metalness: 0.9, roughness: 0.34, envMapIntensity: env }),
    aluminio: new THREE.MeshStandardMaterial({ color: 0x8a919a, metalness: 1, roughness: 0.34, envMapIntensity: env }),
    acero: new THREE.MeshStandardMaterial({ color: 0xb4bac2, metalness: 1, roughness: 0.3, envMapIntensity: 0.4 }),
    cromo: new THREE.MeshStandardMaterial({ color: 0xd6dae0, metalness: 1, roughness: 0.16, envMapIntensity: 0.45 }),
    laton: new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.28, envMapIntensity: 0.8 }),
    pavonado: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 0.8, roughness: 0.4, envMapIntensity: 0.4 }),
    lija: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.95, envMapIntensity: 0.2 }),
    manguera: new THREE.MeshPhysicalMaterial({ color: 0x111215, roughness: 0.45, clearcoat: 0.6, envMapIntensity: env }),
    ledRojo: new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 0.45, 0.25), toneMapped: false }),
    ledCian: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 3.2, 3.6), toneMapped: false }),
    ledBlanco: new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3), toneMapped: false }),
    piso: new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.42, metalness: 0.3, envMapIntensity: 0.25 }),
  };

  // ---------------- Texturas ----------------
  function lienzo(w, h, dibujar) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    dibujar(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }
  // Llanta: u = vuelta de la rueda, v = vuelta del tubo; v=0 es la banda de rodadura.
  function dibujarLlanta(g, w, h, relieve) {
    dibujarLlantaTextos(g, w, h, relieve, [[0.75, 'MAX. INFL.  XX PSI'], [0.25, '8 1/2 x 2  ·  TUBE TYPE']]);
  }
  function dibujarLlantaTextos(g, w, h, relieve, textos) {
    g.fillStyle = relieve ? '#808080' : '#0f1012';
    g.fillRect(0, 0, w, h);
    const y = (v) => (1 - v) * h;
    g.strokeStyle = relieve ? '#000' : '#0a0a0b';
    g.lineCap = 'round';
    g.lineWidth = relieve ? 16 : 12;
    const TACOS = 56;
    for (let i = 0; i < TACOS; i++) {
      const x = (i + 0.5) * (w / TACOS);
      g.beginPath(); g.moveTo(x - 10, y(0.025)); g.lineTo(x + 26, y(0.13)); g.stroke();
      g.beginPath(); g.moveTo(x - 10, y(0.975)); g.lineTo(x + 26, y(0.87)); g.stroke();
    }
    g.lineWidth = relieve ? 10 : 6;
    g.beginPath(); g.moveTo(0, y(0.0) - 2); g.lineTo(w, y(0.0) - 2); g.stroke();
    g.beginPath(); g.moveTo(0, y(1.0) + 2); g.lineTo(w, y(1.0) + 2); g.stroke();
    g.fillStyle = relieve ? '#c8c8c8' : '#3c4046';
    g.font = `700 ${Math.round(h * 0.062)}px Poppins`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const [u, txt] of textos) g.fillText(txt, u * w, y(0.205));
  }
  const texLlanta = lienzo(4096, 512, (g, w, h) => dibujarLlanta(g, w, h, false));
  texLlanta.colorSpace = THREE.SRGBColorSpace;
  const texRelieve = lienzo(4096, 512, (g, w, h) => dibujarLlanta(g, w, h, true));
  mat.goma = new THREE.MeshStandardMaterial({ map: texLlanta, bumpMap: texRelieve, bumpScale: 2.2, roughness: 0.74, metalness: 0, envMapIntensity: 0.3 });
  const texSombra = lienzo(256, 256, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(0,0,0,0.85)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  // Halo aditivo (brillos, calor, roce)
  const halo = (color, tamaño) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(tamaño, tamaño), new THREE.MeshBasicMaterial({
      map: texSombra, color, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    }));
    return m;
  };

  // ---------------- Luces y piso ----------------
  escena.fog = new THREE.Fog(0x050608, 2.2, 5.5);
  const luces = {
    clave: new THREE.DirectionalLight(0xfff2e8, 2.0),
    bordeCian: new THREE.DirectionalLight(0x3fd3df, 1.5),
    bordeRojo: new THREE.DirectionalLight(0xff3a1a, 1.9),
    relleno: new THREE.HemisphereLight(0x8fa6b8, 0x050505, 0.08),
    puntoRojo: new THREE.PointLight(0xff3a1a, 0, 0, 2),
  };
  luces.clave.position.set(1.2, 2.2, 1.8);
  luces.bordeCian.position.set(-1.6, 0.7, -0.6);
  luces.bordeRojo.position.set(1.4, 0.4, -1.6);
  escena.add(...Object.values(luces));
  /** Modo de luz: 'normal' (cian/blanco) o 'error' (rojo dominante). */
  luces.modo = (modo) => {
    const e = modo === 'error';
    luces.clave.intensity = e ? 0.8 : 2.0;
    luces.bordeCian.intensity = e ? 0.5 : 1.5;
    luces.bordeRojo.intensity = e ? 6 : 1.9;
  };
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat.piso);
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);

  // ---------------- Geometría auxiliar ----------------
  const tubo = (a, b, radio, material, lados = 24) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, d.length(), lados), material);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    return m;
  };
  const cilindroZ = (radio, largo, material, lados = 32) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, largo, lados), material);
    m.rotation.x = Math.PI / 2;
    return m;
  };

  // ---------------- Rueda ----------------
  const R_TUBO = 0.082, r_TUBO = 0.028, R_EXT = R_TUBO + r_TUBO;
  const geoLlanta = (() => {
    const geo = new THREE.TorusGeometry(R_TUBO, r_TUBO, 48, 200);
    const pos = geo.attributes.position;
    const aplastada = new Float32Array(pos.array.length);
    const suelo = -(R_EXT - 0.016);
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const abajo = limitar((-y - 0.06) / 0.05);
      z *= 1 + 0.22 * abajo * abajo;
      if (y < suelo) y = suelo;
      x *= 1 + 0.06 * abajo;
      aplastada.set([x, y, z], i * 3);
    }
    geo.morphAttributes.position = [new THREE.Float32BufferAttribute(aplastada, 3)];
    return geo;
  })();

  function crearRueda() {
    const grupo = new THREE.Group();
    const giro = new THREE.Group();
    grupo.add(giro);
    const llanta = new THREE.Mesh(geoLlanta, mat.goma);
    llanta.morphTargetInfluences = [0];
    giro.add(llanta);
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.046, 64, 1, true), mat.aluOscuro);
    aro.rotation.x = Math.PI / 2;
    giro.add(aro);
    for (const z of [-0.022, 0.022]) {
      const pestaña = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0035, 10, 80), mat.aluminio);
      pestaña.position.z = z;
      giro.add(pestaña);
    }
    giro.add(cilindroZ(0.03, 0.05, mat.plastico, 48));
    giro.add(cilindroZ(0.008, 0.056, mat.aluOscuro, 6));
    for (let k = 0; k < 5; k++) {
      const a = k * (Math.PI * 2 / 5);
      const rayo = new THREE.Mesh(new RoundedBoxGeometry(0.032, 0.012, 0.012, 2, 0.004), mat.aluminio);
      rayo.position.set(Math.cos(a) * 0.043, Math.sin(a) * 0.043, 0.012);
      rayo.rotation.z = a;
      giro.add(rayo);
    }
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = -R_EXT + 0.0015;
    grupo.add(sombra);
    return { grupo, giro, llanta, sombra };
  }

  // ---------------- Scooter ----------------
  // `raiz` pivota sobre el contacto de la rueda delantera: raiz.rotation.z < 0 levanta la rueda trasera.
  function crearScooter() {
    const raiz = new THREE.Group();
    raiz.position.set(0.42, 0, 0);
    escena.add(raiz);
    const scooter = new THREE.Group();
    scooter.position.set(-0.42, 0, 0);
    raiz.add(scooter);
    const delantera = crearRueda();
    delantera.grupo.position.set(0.42, R_EXT, 0);
    const trasera = crearRueda();
    trasera.grupo.position.set(-0.42, R_EXT, 0);
    scooter.add(delantera.grupo, trasera.grupo);

    const plataforma = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.05, 0.165, 4, 0.02), mat.plastico);
    plataforma.position.set(-0.02, 0.13, 0);
    const lija = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.004, 0.13, 2, 0.002), mat.lija);
    lija.position.set(-0.03, 0.156, 0);
    const tiraLed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.006, 0.003), mat.ledRojo);
    tiraLed.position.set(-0.03, 0.12, 0.0835);
    scooter.add(plataforma, lija, tiraLed);
    const guarda = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.006, 8, 48, Math.PI * 0.62), mat.plastico);
    guarda.scale.set(1, 1, 7);
    guarda.rotation.z = Math.PI * 0.18;
    guarda.position.copy(trasera.grupo.position);
    const luzTrasera = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.05), mat.ledRojo);
    luzTrasera.position.set(-0.56, 0.17, 0);
    scooter.add(guarda, luzTrasera);
    // Horquilla de un solo lado (-z), poste y manubrio
    const cuello = V(0.36, 0.3, 0), cima = V(0.27, 1.05, 0);
    scooter.add(tubo(V(0.42, R_EXT, -0.045), V(0.37, 0.3, -0.045), 0.012, mat.aluOscuro));
    scooter.add(tubo(V(0.42, R_EXT, -0.045), V(0.42, R_EXT, 0), 0.008, mat.aluOscuro));
    scooter.add(tubo(cuello, cima, 0.02, mat.aluOscuro));
    const bisagra = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.05, 0.05, 2, 0.01), mat.plastico);
    bisagra.position.copy(cuello);
    const faro = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 24), mat.ledBlanco);
    faro.rotation.z = Math.PI / 2; faro.position.set(0.352, 0.55, 0);
    scooter.add(bisagra, faro);
    const manubrio = { x: 0.27, y: 1.05 };
    scooter.add(tubo(V(manubrio.x, manubrio.y, -0.23), V(manubrio.x, manubrio.y, 0.23), 0.012, mat.aluOscuro));
    const puños = [];
    for (const z of [-0.2, 0.2]) {
      const p = tubo(V(manubrio.x, manubrio.y, z - 0.05), V(manubrio.x, manubrio.y, z + 0.05), 0.017, mat.plastico);
      puños.push(p);
      scooter.add(p);
    }
    const pantalla = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.02, 0.07, 2, 0.006), mat.plastico);
    pantalla.position.set(manubrio.x, manubrio.y + 0.02, 0);
    const pantallaLuz = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.05), mat.ledCian);
    pantallaLuz.rotation.x = -Math.PI / 2; pantallaLuz.rotation.z = Math.PI / 2;
    pantallaLuz.position.set(manubrio.x, manubrio.y + 0.031, 0);
    scooter.add(pantalla, pantallaLuz);
    const pata = tubo(V(-0.1, 0.11, 0.08), V(-0.2, 0.006, 0.14), 0.006, mat.aluOscuro);
    scooter.add(pata);
    return { raiz, scooter, delantera, trasera, manubrio, puños, plataforma, pantallaLuz };
  }


  // ================= Estilo «Max» (scooter de ruedas de 10", freno de tambor delantero) =================
  // Inspirado en los scooters urbanos grandes (plataforma ancha de goma gris, aros con franja amarilla,
  // guardabarros trasero grueso con reflector redondo). Sin logos de ninguna marca.
  const AMARILLO = 0xe8b21c;
  mat.amarillo = new THREE.MeshStandardMaterial({ color: AMARILLO, roughness: 0.4, metalness: 0.1, emissive: AMARILLO, emissiveIntensity: 0.12, envMapIntensity: 0.4 });
  mat.grisCuerpo = new THREE.MeshPhysicalMaterial({ color: 0x1b1d20, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: env });
  const texAlfombra = lienzo(1024, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d0d0d0';
    for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { g.beginPath(); g.arc(x, y, 4.2, 0, Math.PI * 2); g.fill(); }
  });
  mat.alfombra = new THREE.MeshStandardMaterial({ color: 0x3e4247, roughness: 0.9, bumpMap: texAlfombra, bumpScale: 3, envMapIntensity: 0.25 });
  const texLlantaMax = lienzo(4096, 512, (g, w, h) => dibujarLlantaTextos(g, w, h, false, [[0.75, '10 x 2.5  ·  TUBELESS'], [0.25, 'MAX. INFL.  XX PSI']]));
  texLlantaMax.colorSpace = THREE.SRGBColorSpace;
  const texRelieveMax = lienzo(4096, 512, (g, w, h) => dibujarLlantaTextos(g, w, h, true, [[0.75, '10 x 2.5  ·  TUBELESS'], [0.25, 'MAX. INFL.  XX PSI']]));
  mat.gomaMax = new THREE.MeshStandardMaterial({ map: texLlantaMax, bumpMap: texRelieveMax, bumpScale: 2.2, roughness: 0.74, metalness: 0, envMapIntensity: 0.3 });

  const R_EXT_MAX = 0.127;
  function crearRuedaMax({ motor = false } = {}) {
    const grupo = new THREE.Group();
    const giro = new THREE.Group();
    grupo.add(giro);
    const llanta = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.034, 48, 220), mat.gomaMax);
    giro.add(llanta);
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.056, 64, 1, true), mat.aluOscuro);
    aro.rotation.x = Math.PI / 2;
    giro.add(aro);
    for (const z of [-0.027, 0.027]) {
      const cara = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.0625, 64), mat.grisCuerpo);
      cara.position.z = z;
      if (z < 0) cara.rotation.y = Math.PI;
      const franja = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.0022, 8, 96), mat.amarillo);
      franja.position.z = z + Math.sign(z) * 0.0012;
      giro.add(cara, franja);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const tornillo = cilindroZ(0.0028, 0.003, mat.acero, 6);
        tornillo.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, z + Math.sign(z) * 0.0015);
        giro.add(tornillo);
      }
    }
    const cubo = cilindroZ(motor ? 0.03 : 0.022, motor ? 0.07 : 0.064, mat.aluOscuro, 40);
    grupo.add(cubo);
    const eje = cilindroZ(0.006, 0.13, mat.acero, 6);
    grupo.add(eje);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.18), new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.y = -R_EXT_MAX + 0.0015;
    grupo.add(sombra);
    return { grupo, giro, llanta, sombra };
  }

  /**
   * Scooter estilo Max. `pivote`: 'trasera' (raiz.rotation.z > 0 levanta la rueda delantera)
   * o 'delantera' (raiz.rotation.z < 0 levanta la trasera).
   * Freno de tambor en la rueda delantera, lado izquierdo del conductor (-z), con maneta a la izquierda.
   */
  function crearScooterMax({ pivote = 'trasera' } = {}) {
    const XD = 0.46, XT = -0.46;
    const raiz = new THREE.Group();
    const px = pivote === 'trasera' ? XT : XD;
    raiz.position.set(px, 0, 0);
    escena.add(raiz);
    const scooter = new THREE.Group();
    scooter.position.set(-px, 0, 0);
    raiz.add(scooter);
    const delantera = crearRuedaMax();
    delantera.grupo.position.set(XD, R_EXT_MAX, 0);
    const trasera = crearRuedaMax({ motor: true });
    trasera.grupo.position.set(XT, R_EXT_MAX, 0);
    scooter.add(delantera.grupo, trasera.grupo);

    // Plataforma: cuerpo oscuro + alfombra de goma gris con puntos + detalles amarillos
    const plataforma = new THREE.Mesh(new RoundedBoxGeometry(0.76, 0.06, 0.18, 4, 0.022), mat.grisCuerpo);
    plataforma.position.set(-0.02, 0.152, 0);
    const alfombra = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.006, 0.152, 2, 0.003), mat.alfombra);
    alfombra.position.set(-0.03, 0.183, 0);
    scooter.add(plataforma, alfombra);
    for (const z of [-0.0905, 0.0905]) {
      const tira = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.007, 0.002), mat.amarillo);
      tira.position.set(-0.08, 0.13, z);
      scooter.add(tira);
    }
    // Guardabarros trasero grueso, con reflector redondo y tirantes al eje
    const guarda = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.011, 10, 56, Math.PI * 0.6), mat.grisCuerpo);
    guarda.scale.set(1, 1, 5.2);
    guarda.rotation.z = Math.PI * 0.22;
    guarda.position.set(XT, R_EXT_MAX, 0);
    const reflector = cilindroZ(0.013, 0.006, mat.ledRojo, 28);
    reflector.rotation.set(0, Math.PI / 2, 0);
    const angRef = Math.PI * 0.82;
    reflector.position.set(XT + Math.cos(angRef) * 0.158, R_EXT_MAX + Math.sin(angRef) * 0.158, 0);
    const perilla = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.016, 20), mat.grisCuerpo);
    perilla.position.set(XT + Math.cos(Math.PI * 0.42) * 0.168, R_EXT_MAX + Math.sin(Math.PI * 0.42) * 0.168, 0);
    scooter.add(guarda, reflector, perilla);
    for (const z of [-0.042, 0.042]) scooter.add(tubo(V(XT, R_EXT_MAX, z), V(XT + Math.cos(angRef) * 0.15, R_EXT_MAX + Math.sin(angRef) * 0.15, z), 0.004, mat.grisCuerpo));
    for (const z of [-0.042, 0.042]) scooter.add(tubo(V(XT, R_EXT_MAX, z), V(-0.36, 0.14, z * 1.3), 0.007, mat.grisCuerpo));
    // Cuello, abrazadera de plegado, poste y horquilla doble
    const cabeza = V(0.42, 0.34, 0);
    scooter.add(tubo(V(0.33, 0.16, 0), V(0.4, 0.31, 0), 0.03, mat.grisCuerpo));
    const abrazaderaPlegado = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.06, 32), mat.grisCuerpo);
    abrazaderaPlegado.position.copy(cabeza);
    abrazaderaPlegado.rotation.z = 0.09;
    scooter.add(abrazaderaPlegado);
    const cima = V(0.33, 1.16, 0);
    scooter.add(tubo(cabeza, cima, 0.024, mat.grisCuerpo));
    for (const z of [-0.064, 0.064]) {
      const pierna = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.24, 0.014, 2, 0.006), mat.grisCuerpo);
      const a = V(0.425, 0.3, z), b = V(XD, R_EXT_MAX, z);
      pierna.position.copy(a).lerp(b, 0.5);
      pierna.rotation.z = Math.atan2(b.x - a.x, a.y - b.y);
      scooter.add(pierna);
    }
    scooter.add(tubo(V(0.425, 0.31, -0.07), V(0.425, 0.31, 0.07), 0.016, mat.grisCuerpo));
    const faro = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 24), mat.ledBlanco);
    faro.rotation.z = Math.PI / 2; faro.position.set(0.41, 1.0, 0);
    scooter.add(faro);
    // Manubrio, puños y tablero central
    const manubrio = { x: cima.x, y: cima.y };
    scooter.add(tubo(V(manubrio.x, manubrio.y, -0.25), V(manubrio.x, manubrio.y, 0.25), 0.013, mat.aluOscuro));
    const puños = [];
    for (const z of [-0.21, 0.21]) {
      const p = tubo(V(manubrio.x, manubrio.y, z - 0.055), V(manubrio.x, manubrio.y, z + 0.055), 0.018, mat.plastico);
      puños.push(p);
      scooter.add(p);
    }
    const tablero = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.034, 0.12, 3, 0.01), mat.plastico);
    tablero.position.set(manubrio.x + 0.005, manubrio.y + 0.024, 0);
    const pantallaLuz = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.045), mat.ledCian);
    pantallaLuz.rotation.x = -Math.PI / 2; pantallaLuz.rotation.z = Math.PI / 2;
    pantallaLuz.position.set(manubrio.x + 0.008, manubrio.y + 0.0415, 0);
    scooter.add(tablero, pantallaLuz);
    // Pata lateral (lado izquierdo)
    scooter.add(tubo(V(-0.06, 0.13, -0.09), V(-0.17, 0.006, -0.16), 0.006, mat.aluOscuro));

    // ---- Freno de tambor delantero (lado -z, no gira) ----
    const tambor = new THREE.Group();
    tambor.position.set(XD, R_EXT_MAX, -0.036);
    scooter.add(tambor);
    const carcasa = cilindroZ(0.045, 0.02, mat.aluOscuro, 48);
    const tapaTambor = cilindroZ(0.043, 0.003, mat.grisCuerpo, 48);
    tapaTambor.position.z = -0.011;
    tambor.add(carcasa, tapaTambor);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const nervio = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012, 0.018), mat.aluOscuro);
      nervio.position.set(Math.cos(a) * 0.047, Math.sin(a) * 0.047, 0);
      nervio.rotation.z = a;
      tambor.add(nervio);
    }
    // Brazo del tambor: pivota en el eje de la leva y sube hacia atrás
    const PIVOTE_BRAZO = V(0.014, 0.03, -0.016);
    const brazo = new THREE.Group();
    brazo.position.copy(PIVOTE_BRAZO);
    tambor.add(brazo);
    const ANG_BRAZO = (165 * Math.PI) / 180, LARGO = 0.06;
    const placa = new THREE.Mesh(new RoundedBoxGeometry(LARGO + 0.012, 0.012, 0.005, 2, 0.002), mat.aluminio);
    placa.position.set(Math.cos(ANG_BRAZO) * LARGO / 2, Math.sin(ANG_BRAZO) * LARGO / 2, 0);
    placa.rotation.z = ANG_BRAZO;
    const ejeLeva = cilindroZ(0.006, 0.01, mat.acero, 6);
    const pasador = cilindroZ(0.0035, 0.008, mat.laton, 16);
    pasador.position.set(Math.cos(ANG_BRAZO) * LARGO, Math.sin(ANG_BRAZO) * LARGO, 0);
    brazo.add(placa, ejeLeva, pasador);
    // Tope de la funda (fijo al tambor), arriba del pasador
    const extremoBrazo = V(PIVOTE_BRAZO.x + Math.cos(ANG_BRAZO) * LARGO, PIVOTE_BRAZO.y + Math.sin(ANG_BRAZO) * LARGO, PIVOTE_BRAZO.z);
    const TOPE = extremoBrazo.clone().add(V(0.004, 0.05, 0));
    const tope = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.01, 20), mat.acero);
    tope.position.copy(TOPE);
    const soporteTope = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.05, 0.004, 2, 0.0015), mat.aluOscuro);
    soporteTope.position.set(TOPE.x + 0.016, TOPE.y - 0.02, TOPE.z + 0.003);
    soporteTope.rotation.z = -0.5;
    tambor.add(tope, soporteTope);

    // ---- Maneta izquierda (-z) con regulador ----
    const BARRA = V(manubrio.x, manubrio.y, 0);
    const abrazadera = cilindroZ(0.017, 0.022, mat.plastico, 32);
    abrazadera.position.set(BARRA.x, BARRA.y, -0.137);
    const cuerpoManeta = new THREE.Mesh(new RoundedBoxGeometry(0.046, 0.015, 0.02, 2, 0.004), mat.plastico);
    cuerpoManeta.position.set(BARRA.x + 0.024, BARRA.y - 0.004, -0.139);
    scooter.add(abrazadera, cuerpoManeta);
    const maneta = new THREE.Group();
    maneta.position.set(BARRA.x + 0.044, BARRA.y - 0.005, -0.144);
    scooter.add(maneta);
    const hoja = new THREE.Mesh(new RoundedBoxGeometry(0.009, 0.007, 0.108, 2, 0.003), mat.aluOscuro);
    hoja.position.z = -0.054;
    const punta = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 16, 12), mat.aluOscuro);
    punta.position.z = -0.107;
    maneta.add(hoja, punta);
    const fijarManeta = (r) => { maneta.rotation.y = 0.2 * limitar(r, 0, 1.05); };
    const B = V(BARRA.x + 0.03, BARRA.y - 0.012, -0.132);

    return { raiz, scooter, delantera, trasera, manubrio, puños, pantallaLuz, tambor, brazo, extremoBrazo, TOPE, PIVOTE_BRAZO, ANG_BRAZO, LARGO_BRAZO: LARGO, maneta, fijarManeta, B, XD, XT, R: R_EXT_MAX };
  }

  return { V, mat, lienzo, texSombra, halo, luces, piso, tubo, cilindroZ, crearRueda, crearScooter, crearRuedaMax, crearScooterMax, R_EXT, R_EXT_MAX, RoundedBoxGeometry };
}
