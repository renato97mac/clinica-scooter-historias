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
    for (const [u, txt] of [[0.75, 'MAX. INFL.  XX PSI'], [0.25, '8 1/2 x 2  ·  TUBE TYPE']]) g.fillText(txt, u * w, y(0.205));
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

  return { V, mat, lienzo, texSombra, halo, luces, piso, tubo, cilindroZ, crearRueda, crearScooter, R_EXT, RoundedBoxGeometry };
}
