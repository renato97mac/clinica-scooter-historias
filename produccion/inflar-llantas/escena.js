// Escena 3D del video "Cómo inflar bien las llantas de tu scooter".
// Todos los tiempos salen de la locución con T('frase', 'palabra'), así el video
// se re-sincroniza solo si cambia el guion o la voz.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export async function crear({ THREE, escena, T, tiempos, utiles }) {
  const { limitar, suave, progreso, cubica } = utiles;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------------- Materiales ----------------
  const env = 0.3;
  const mat = {
    plastico: new THREE.MeshPhysicalMaterial({ color: 0x0d0e10, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: env }),
    aluOscuro: new THREE.MeshStandardMaterial({ color: 0x30343a, metalness: 0.9, roughness: 0.34, envMapIntensity: env }),
    aluminio: new THREE.MeshStandardMaterial({ color: 0x8a919a, metalness: 1, roughness: 0.34, envMapIntensity: env }),
    cromo: new THREE.MeshStandardMaterial({ color: 0xd6dae0, metalness: 1, roughness: 0.16, envMapIntensity: 0.45 }),
    laton: new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.28, envMapIntensity: 0.8 }),
    lija: new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.95, envMapIntensity: 0.2 }),
    manguera: new THREE.MeshPhysicalMaterial({ color: 0x111215, roughness: 0.45, clearcoat: 0.6, envMapIntensity: env }),
    mangueraNaranja: new THREE.MeshPhysicalMaterial({ color: 0xd84a1b, roughness: 0.4, clearcoat: 0.6, envMapIntensity: env }),
    ledRojo: new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 0.45, 0.25), toneMapped: false }),
    ledCian: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 3.2, 3.6), toneMapped: false }),
    ledBlanco: new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 3), toneMapped: false }),
    piso: new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.42, metalness: 0.3, envMapIntensity: 0.25 }),
  };

  // ---------------- Texturas por canvas ----------------
  function lienzo(w, h, dibujar) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    dibujar(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }
  // Llanta: u = vuelta de la rueda (ancho), v = vuelta del tubo (alto). v=0 es la banda de rodadura.
  const TACOS = 56;
  function dibujarLlanta(g, w, h, relieve) {
    g.fillStyle = relieve ? '#808080' : '#0f1012';
    g.fillRect(0, 0, w, h);
    const y = (v) => (1 - v) * h; // flipY
    g.strokeStyle = relieve ? '#000' : '#0a0a0b';
    g.lineCap = 'round';
    g.lineWidth = relieve ? 16 : 12;
    for (let i = 0; i < TACOS; i++) {
      const x = (i + 0.5) * (w / TACOS);
      // Ranuras en V a ambos lados del centro de la banda
      g.beginPath(); g.moveTo(x - 10, y(0.025)); g.lineTo(x + 26, y(0.13)); g.stroke();
      g.beginPath(); g.moveTo(x - 10, y(0.975)); g.lineTo(x + 26, y(0.87)); g.stroke();
    }
    // Ranura central
    g.lineWidth = relieve ? 10 : 6;
    g.beginPath(); g.moveTo(0, y(0.0) - 2); g.lineTo(w, y(0.0) - 2); g.stroke();
    g.beginPath(); g.moveTo(0, y(1.0) + 2); g.lineTo(w, y(1.0) + 2); g.stroke();
    // Texto del costado (lado +z, v≈0.16–0.26), centrado en u = 270° (abajo)
    g.save();
    g.fillStyle = relieve ? '#c8c8c8' : '#3c4046';
    g.font = `700 ${Math.round(h * 0.062)}px Poppins`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const textos = [[0.75, 'MAX. INFL.  XX PSI'], [0.25, '8 1/2 x 2  ·  TUBE TYPE']];
    for (const [u, txt] of textos) g.fillText(txt, u * w, y(0.205));
    g.restore();
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

  // Esfera del manómetro: 0–100 PSI en 270°, banda 45–50 cian, zona roja 80–100.
  const PSI_MAX = 100;
  const anguloPsi = (p) => (-135 + 270 * (p / PSI_MAX)) * Math.PI / 180; // desde arriba, horario
  const texEsfera = lienzo(1024, 1024, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#0c0e11'; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
    const arco = (p0, p1, r, ancho, color) => {
      g.strokeStyle = color; g.lineWidth = ancho; g.beginPath();
      g.arc(c, c, r, anguloPsi(p0) - Math.PI / 2, anguloPsi(p1) - Math.PI / 2); g.stroke();
    };
    arco(80, 100, 400, 34, '#ff3b2f');
    arco(45, 50, 400, 46, '#3fd3df');
    for (let p = 0; p <= PSI_MAX; p += 2) {
      const a = anguloPsi(p) - Math.PI / 2;
      const largo = p % 10 === 0 ? 70 : 34;
      g.strokeStyle = '#e9edf1'; g.lineWidth = p % 10 === 0 ? 9 : 4;
      g.beginPath(); g.moveTo(c + Math.cos(a) * 440, c + Math.sin(a) * 440);
      g.lineTo(c + Math.cos(a) * (440 - largo), c + Math.sin(a) * (440 - largo)); g.stroke();
      if (p % 20 === 0) {
        g.fillStyle = '#ffffff'; g.font = '700 64px Poppins'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(p), c + Math.cos(a) * 300, c + Math.sin(a) * 300);
      }
    }
    g.fillStyle = '#ffffff'; g.font = '800 84px Poppins'; g.textAlign = 'center'; g.fillText('PSI', c, c + 190);
    g.fillStyle = '#ff6a1f'; g.font = '700 34px Poppins'; g.fillText('LA CLÍNICA DEL SCOOTER', c, c + 280);
  });
  texEsfera.colorSpace = THREE.SRGBColorSpace;

  // ---------------- Iluminación y piso ----------------
  escena.fog = new THREE.Fog(0x050608, 2.2, 5.5);
  const clave = new THREE.DirectionalLight(0xfff2e8, 2.0); clave.position.set(1.2, 2.2, 1.8);
  const bordeCian = new THREE.DirectionalLight(0x3fd3df, 1.5); bordeCian.position.set(-1.6, 0.7, -0.6);
  const bordeRojo = new THREE.DirectionalLight(0xff3a1a, 1.9); bordeRojo.position.set(1.4, 0.4, -1.6);
  const relleno = new THREE.HemisphereLight(0x8fa6b8, 0x050505, 0.08);
  const puntoCian = new THREE.PointLight(0x3fd3df, 0.12, 0, 2);
  const puntoCalor = new THREE.PointLight(0xff5a1a, 0, 0, 2);
  escena.add(clave, bordeCian, bordeRojo, relleno, puntoCian, puntoCalor);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat.piso);
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);

  // ---------------- Rueda ----------------
  const R_TUBO = 0.082, r_TUBO = 0.028, R_EXT = R_TUBO + r_TUBO;
  function geometriaLlanta() {
    const geo = new THREE.TorusGeometry(R_TUBO, r_TUBO, 48, 200);
    const pos = geo.attributes.position;
    const aplastada = new Float32Array(pos.array.length);
    const piso = -(R_EXT - 0.016); // 16 mm de aplastamiento
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const abajo = limitar((-y - 0.06) / 0.05);
      z *= 1 + 0.22 * abajo * abajo;
      if (y < piso) y = piso;
      x *= 1 + 0.06 * abajo;
      aplastada[i * 3] = x; aplastada[i * 3 + 1] = y; aplastada[i * 3 + 2] = z;
    }
    geo.morphAttributes.position = [new THREE.Float32BufferAttribute(aplastada, 3)];
    return geo;
  }
  const geoLlanta = geometriaLlanta();

  function crearRueda(conValvula) {
    const grupo = new THREE.Group();
    const giro = new THREE.Group();
    grupo.add(giro);
    const llanta = new THREE.Mesh(geoLlanta, mat.goma);
    llanta.morphTargetInfluences = [0];
    llanta.rotation.z = 0;
    giro.add(llanta);
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.046, 64, 1, true), mat.aluOscuro);
    aro.rotation.x = Math.PI / 2;
    giro.add(aro);
    for (const z of [-0.022, 0.022]) {
      const pestaña = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.0035, 10, 80), mat.aluminio);
      pestaña.position.z = z;
      giro.add(pestaña);
    }
    const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 48), mat.plastico);
    cubo.rotation.x = Math.PI / 2;
    giro.add(cubo);
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.056, 6), mat.aluOscuro);
    tapa.rotation.x = Math.PI / 2;
    giro.add(tapa);
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
    const rueda = { grupo, giro, llanta };
    if (conValvula) {
      // Válvula acodada que sale hacia el lado +z entre dos rayos
      const ANG = -0.75;
      const valvula = new THREE.Group();
      valvula.position.set(Math.cos(ANG) * 0.05, Math.sin(ANG) * 0.05, 0);
      giro.add(valvula);
      const vastago = new THREE.Mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.034, 20), mat.laton);
      vastago.rotation.x = Math.PI / 2; vastago.position.z = 0.025;
      valvula.add(vastago);
      const tuerca = new THREE.Mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.004, 6), mat.cromo);
      tuerca.rotation.x = Math.PI / 2; tuerca.position.z = 0.0255;
      valvula.add(tuerca);
      const tapon = new THREE.Group();
      const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.012, 16), mat.plastico);
      cuerpo.rotation.x = Math.PI / 2; tapon.add(cuerpo);
      for (let k = 0; k < 10; k++) {
        const estria = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0012, 0.011), mat.plastico);
        const a = k * Math.PI / 5;
        estria.position.set(Math.cos(a) * 0.0057, Math.sin(a) * 0.0057, 0);
        tapon.add(estria);
      }
      tapon.position.z = 0.048;
      valvula.add(tapon);
      const extension = new THREE.Group();
      const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.05, 20), mat.aluminio);
      tubo.rotation.x = Math.PI / 2; tubo.position.z = 0.025;
      const punta = new THREE.Mesh(new THREE.CylinderGeometry(0.0046, 0.0046, 0.008, 20), mat.laton);
      punta.rotation.x = Math.PI / 2; punta.position.z = 0.05;
      extension.add(tubo, punta);
      extension.position.z = 0.042;
      extension.scale.set(1, 1, 0.0001);
      extension.visible = false;
      valvula.add(extension);
      Object.assign(rueda, { valvula, tapon, extension, ANG });
    }
    return rueda;
  }

  // ---------------- Scooter ----------------
  const scooter = new THREE.Group();
  escena.add(scooter);
  const delantera = crearRueda(true);
  delantera.grupo.position.set(0.42, R_EXT, 0);
  const trasera = crearRueda(false);
  trasera.grupo.position.set(-0.42, R_EXT, 0);
  scooter.add(delantera.grupo, trasera.grupo);

  const plataforma = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.05, 0.165, 4, 0.02), mat.plastico);
  plataforma.position.set(-0.02, 0.13, 0);
  const lija = new THREE.Mesh(new RoundedBoxGeometry(0.56, 0.004, 0.13, 2, 0.002), mat.lija);
  lija.position.set(-0.03, 0.156, 0);
  const tiraLed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.006, 0.003), mat.ledRojo);
  tiraLed.position.set(-0.03, 0.12, 0.0835);
  scooter.add(plataforma, lija, tiraLed);
  // Guardabarros trasero
  const guarda = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.006, 8, 48, Math.PI * 0.62), mat.plastico);
  guarda.scale.set(1, 1, 7);
  guarda.rotation.z = Math.PI * 0.18;
  guarda.position.copy(trasera.grupo.position);
  const luzTrasera = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.05), mat.ledRojo);
  luzTrasera.position.set(-0.56, 0.17, 0);
  scooter.add(guarda, luzTrasera);
  // Horquilla, poste y manubrio
  const tubo = (a, b, radio, material) => {
    const d = new THREE.Vector3().subVectors(b, a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, d.length(), 24), material);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    return m;
  };
  const pie = V(0.42, R_EXT, 0), cuello = V(0.36, 0.3, 0), cima = V(0.27, 1.05, 0);
  scooter.add(tubo(V(0.42, R_EXT, -0.045), V(0.37, 0.3, -0.045), 0.012, mat.aluOscuro));
  scooter.add(tubo(V(0.42, R_EXT, -0.045), V(0.42, R_EXT, 0), 0.008, mat.aluOscuro));
  scooter.add(tubo(cuello, cima, 0.02, mat.aluOscuro));
  const bisagra = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.05, 0.05, 2, 0.01), mat.plastico);
  bisagra.position.set(0.36, 0.3, 0);
  scooter.add(bisagra);
  const faro = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 24), mat.ledBlanco);
  faro.rotation.z = Math.PI / 2; faro.position.set(0.352, 0.55, 0);
  scooter.add(faro);
  scooter.add(tubo(V(0.27, 1.05, -0.23), V(0.27, 1.05, 0.23), 0.012, mat.aluOscuro));
  for (const z of [-0.2, 0.2]) scooter.add(tubo(V(0.27, 1.05, z - 0.05), V(0.27, 1.05, z + 0.05), 0.017, mat.plastico));
  const pantalla = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.02, 0.07, 2, 0.006), mat.plastico);
  pantalla.position.set(0.27, 1.07, 0);
  const pantallaLuz = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.05), mat.ledCian);
  pantallaLuz.rotation.x = -Math.PI / 2; pantallaLuz.rotation.z = Math.PI / 2; pantallaLuz.position.set(0.27, 1.081, 0);
  scooter.add(pantalla, pantallaLuz);
  const pata = tubo(V(-0.1, 0.11, 0.08), V(-0.2, 0.006, 0.14), 0.006, mat.aluOscuro);
  scooter.add(pata);

  // Mancha de roce bajo la llanta delantera (se enciende con "roza")
  const roce = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.07), new THREE.MeshBasicMaterial({ map: texSombra, color: new THREE.Color(4, 0.4, 0.2), transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  roce.rotation.x = -Math.PI / 2;
  roce.position.set(0.42, 0.003, 0);
  escena.add(roce);

  // ---------------- Cabezal del inflador ----------------
  function crearCabezal(material, mangueraMat, metalico) {
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0115, 0.045, 32), material);
    cuerpo.rotation.x = Math.PI / 2; cuerpo.position.z = 0.0225;
    const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.0112, 0.0112, 0.006, 32), metalico);
    boca.rotation.x = Math.PI / 2; boca.position.z = 0.003;
    g.add(cuerpo, boca);
    const palanca = new THREE.Group();
    palanca.position.set(0, 0.012, 0.04);
    const brazo = new THREE.Mesh(new RoundedBoxGeometry(0.009, 0.006, 0.045, 2, 0.002), material);
    brazo.position.z = -0.022;
    palanca.add(brazo);
    g.add(palanca);
    const curva = new THREE.CatmullRomCurve3([V(0, 0, 0.045), V(0, 0, 0.09), V(0.05, 0.03, 0.2), V(0.2, 0.0, 0.33), V(0.5, -0.1, 0.4)]);
    const manguera = new THREE.Mesh(new THREE.TubeGeometry(curva, 80, 0.0055, 12), mangueraMat);
    g.add(manguera);
    return { grupo: g, palanca };
  }
  const cabezal = crearCabezal(mat.plastico, mat.manguera, mat.cromo);
  const pistola = crearCabezal(mat.cromo, mat.mangueraNaranja, mat.laton);
  delantera.valvula.add(cabezal.grupo, pistola.grupo);
  // Eje de alineación (línea cian) para "recto"
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.22, 6), mat.ledCian);
  eje.rotation.x = Math.PI / 2; eje.position.z = 0.15;
  delantera.valvula.add(eje);

  // ---------------- Inflador de pie con manómetro ----------------
  const inflador = new THREE.Group();
  inflador.position.set(0.95, 0, 0.55);
  inflador.rotation.y = -0.5;
  escena.add(inflador);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.026, 0.08, 3, 0.01), mat.plastico);
  base.position.y = 0.013;
  const cilindro = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.62, 40), mat.aluOscuro);
  cilindro.position.y = 0.34;
  const franja = new THREE.Mesh(new THREE.CylinderGeometry(0.0275, 0.0275, 0.012, 40), mat.ledCian);
  franja.position.y = 0.6;
  const vastagoInf = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 16), mat.cromo);
  vastagoInf.position.y = 0.7;
  const manija = new THREE.Group();
  manija.position.y = 0.76;
  manija.add(tubo(V(0, 0, -0.13), V(0, 0, 0.13), 0.012, mat.plastico));
  inflador.add(base, cilindro, franja, vastagoInf, manija);
  const reloj = new THREE.Group();
  reloj.position.set(0, 0.13, 0.03);
  inflador.add(reloj);
  const caja = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.032, 64), mat.plastico);
  caja.rotation.x = Math.PI / 2;
  const bisel = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.0045, 16, 80), mat.cromo);
  bisel.position.z = 0.016;
  const esfera = new THREE.Mesh(new THREE.CircleGeometry(0.052, 80), new THREE.MeshStandardMaterial({ map: texEsfera, roughness: 0.85, envMapIntensity: 0.1, emissive: 0xffffff, emissiveMap: texEsfera, emissiveIntensity: 0.08 }));
  esfera.position.z = 0.0165;
  const aguja = new THREE.Group();
  aguja.position.z = 0.019;
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.044, 0.0012), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, 0.6, 0.2), toneMapped: false }));
  hoja.position.y = 0.017;
  const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, 24), mat.cromo);
  centro.rotation.x = Math.PI / 2;
  aguja.add(hoja, centro);
  const vidrio = new THREE.Mesh(new THREE.CircleGeometry(0.053, 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.035, roughness: 0.05, envMapIntensity: 0.3, depthWrite: false }));
  vidrio.position.z = 0.0215;
  reloj.add(caja, bisel, esfera, aguja, vidrio);
  const mangueraInf = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-0.1, 0.02, 0.0), V(-0.2, 0.01, 0.05), V(-0.35, 0.02, 0.0), V(-0.6, 0.03, -0.1)]), 60, 0.0055, 12), mat.manguera);
  inflador.add(mangueraInf);
  const fijarAguja = (psi) => { aguja.rotation.z = -anguloPsi(psi); };

  // ---------------- Puntos de anclaje (mundo) ----------------
  const enMundo = (obj, local) => () => obj.localToWorld(V(...local));
  const anclaContacto = () => V(0.42, 0.004, 0.035);
  const anclaValvula = enMundo(delantera.valvula, [0, 0, 0.03]);
  const anclaExtension = enMundo(delantera.valvula, [0, 0, 0.075]);
  const anclaPalanca = enMundo(cabezal.palanca, [0, 0.004, -0.03]);
  const anclaPistola = enMundo(pistola.grupo, [0, 0.0, 0.03]);
  const anclaCostado = enMundo(delantera.giro, [0, -0.09, 0.024]);
  const anclaReloj = enMundo(reloj, [0, 0, 0.02]);
  const anclaBanda = () => { const a = anguloPsi(47.5); return reloj.localToWorld(V(Math.sin(a) * 0.04, Math.cos(a) * 0.04, 0.02)); };

  // ---------------- Tiempos clave ----------------
  const fin = tiempos.duracion;
  const F = delantera.grupo.position; // centro de la rueda delantera
  const vp = (dx, dy, dz) => [F.x + dx, F.y + dy, F.z + dz];
  const valvulaMundo = () => delantera.valvula.localToWorld(V(0, 0, 0.04)).toArray();

  // ---------------- Planos de cámara ----------------
  delantera.valvula.updateWorldMatrix(true, true);
  const VLV = valvulaMundo();
  const vv = (dx, dy, dz) => [VLV[0] + dx, VLV[1] + dy, VLV[2] + dz];
  const relojMundo = () => { reloj.updateWorldMatrix(true, false); return reloj.localToWorld(V(0, 0, 0)).toArray(); };
  const RJ = relojMundo();
  const rj = (dx, dy, dz) => [RJ[0] + dx, RJ[1] + dy, RJ[2] + dz];
  // Posición frente a la esfera del manómetro: distancia, altura y desplazamiento lateral
  const normalReloj = V(0, 0, 1).applyQuaternion(inflador.quaternion);
  const lateralReloj = V(1, 0, 0).applyQuaternion(inflador.quaternion);
  const rn = (d, dy, dl) => [RJ[0] + normalReloj.x * d + lateralReloj.x * dl, RJ[1] + dy, RJ[2] + normalReloj.z * d + lateralReloj.z * dl];

  const planos = [
    // 1 · Gancho: macro de la llanta aplastada contra el piso
    { t: 0, corte: true, de: { pos: vp(0.5, -0.04, 0.5), mira: vp(0.0, -0.05, 0.0), fov: 30 }, a: { pos: vp(0.42, -0.05, 0.44), mira: vp(0.0, -0.06, 0.0), fov: 30 } },
    { t: T('causa'), de: { pos: vp(0.02, 0.03, 0.42), mira: vp(0, -0.02, 0), fov: 32 }, a: { pos: vp(-0.04, 0.04, 0.38), mira: vp(0, -0.02, 0), fov: 32 } },
    // 2 · Plano general del scooter con llantas bajas
    { t: T('aplasta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.5, 0], radio0: 3.3, radio1: 3.1, altura0: 1.1, altura1: 0.9, ang0: 0.85, ang1: 0.6, fov: 34 } },
    // 4 · ¿Cuánto aire? Rueda de costado
    { t: T('cuanto'), corte: true, de: { pos: vp(0.05, 0.05, 0.55), mira: vp(0, 0.0, 0), fov: 34 }, a: { pos: vp(0.02, 0.03, 0.47), mira: vp(0, -0.01, 0), fov: 34 } },
    // 5 · Macro del texto del costado
    { t: T('maximo'), de: { pos: vp(0.03, -0.075, 0.2), mira: vp(0, -0.088, 0.02), fov: 30 }, a: { pos: vp(-0.03, -0.075, 0.19), mira: vp(-0.005, -0.088, 0.02), fov: 30 } },
    // 6 · Medir en frío
    { t: T('frio'), corte: true, orbita: { centro: [F.x, F.y, F.z], mira: [F.x, F.y - 0.01, 0], radio0: 0.46, radio1: 0.42, altura0: 0.08, altura1: 0.05, ang0: 1.05, ang1: 1.35, fov: 32 } },
    // 7 · Válvula: tapón y extensión
    { t: T('tapon'), corte: true, de: { pos: vv(0.12, 0.05, 0.2), mira: vv(-0.005, 0.006, 0.0), fov: 30 }, a: { pos: vv(0.11, 0.045, 0.22), mira: vv(-0.005, 0.006, 0.02), fov: 30 } },
    { t: T('cabezal'), de: { pos: vv(0.26, 0.09, 0.3), mira: vv(0, 0, 0.08), fov: 30 }, a: { pos: vv(0.24, 0.1, 0.28), mira: vv(0, 0, 0.08), fov: 30 } },
    // 8 · El error: compresor del grifo
    { t: T('error'), corte: true, de: { pos: vv(0.2, 0.08, 0.22), mira: vv(0, 0, 0.03), fov: 32 }, a: { pos: vv(0.17, 0.06, 0.19), mira: vv(0, 0, 0.03), fov: 32 } },
    // 9 · Inflador con manómetro
    { t: T('inflador'), corte: true, de: { pos: rn(1.45, 0.45, 0.25), mira: rj(0, 0.27, 0), fov: 34 }, a: { pos: rn(1.3, 0.38, 0.18), mira: rj(0, 0.24, 0), fov: 34 } },
    { t: T('reloj'), de: { pos: rn(0.42, 0.03, 0.03), mira: rj(0, 0.005, 0), fov: 30 }, a: { pos: rn(0.36, 0.02, 0.015), mira: rj(0, 0.005, 0), fov: 30 }, transicion: 1.0 },
    // 10 · Tapón de vuelta y rueda girando
    { t: T('semana'), corte: true, de: { pos: vv(0.12, 0.05, 0.2), mira: vv(-0.005, 0.006, 0.0), fov: 30 }, a: { pos: vv(0.11, 0.045, 0.19), mira: vv(-0.005, 0.006, 0.0), fov: 30 } },
    { t: T('semana', 'revisala'), de: { pos: vp(0.32, 0.07, 0.42), mira: vp(0, 0.0, 0), fov: 32 }, a: { pos: vp(0.24, 0.06, 0.46), mira: vp(0, 0.0, 0), fov: 32 }, transicion: 1.1 },
    // 11 · Cierre: plano general dentro del teléfono
    { t: T('cta'), corte: true, orbita: { centro: [0, 0, 0], mira: [0.0, 0.52, 0], radio0: 3.3, altura0: 1.0, altura1: 0.85, ang0: 0.6, ang1: 1.0, fov: 34 } },
  ];

  // ---------------- Rótulos ----------------
  const rotulos = [
    { desde: 0.35, hasta: T('causa', null, -0.05), texto: 'Poco aire', color: 'rojo', ancla: anclaContacto, caja: [-170, 190] },
    { desde: T('causa', 'llanta'), hasta: T('aplasta', null, -0.2), texto: 'Llanta', ancla: enMundo(delantera.giro, [0.09, -0.04, 0.026]), caja: [-80, 300] },
    { desde: T('aplasta', 'aplasta'), hasta: T('aplasta', 'roza', -0.1), texto: 'Llanta aplastada', color: 'rojo', ancla: () => V(0.42, 0.01, 0.06), caja: [-60, -260] },
    { desde: T('aplasta', 'roza'), hasta: T('aplasta', 'fin'), texto: 'Más roce', color: 'rojo', ancla: () => V(0.42, 0.01, 0.06), caja: [-60, -260] },
    { desde: T('aplasta', 'bateria'), hasta: T('aplasta', 'fin'), texto: '− Autonomía', color: 'rojo', ancla: () => V(-0.1, 0.155, 0.06), caja: [-120, -230] },
    // Esquema del pellizco (anclas en pantalla)
    { desde: T('pellizco', 'una'), hasta: T('pellizco', 'fin', 0.2), texto: 'exagerado para verlo', color: 'blanco', chico: true, linea: false, ancla: { pantalla: [540, 1500] }, caja: [0, 0] },
    { desde: T('pellizco', 'camara'), hasta: T('pellizco', 'fin', 0.2), texto: 'Cámara', ancla: { pantalla: (t) => [ruedaX(t) - 150, 990 - 160] }, caja: [-60, -190] },
    { desde: T('pellizco', 'pellizca'), hasta: T('pellizco', 'fin', 0.2), texto: 'Pellizco', color: 'rojo', ancla: { pantalla: [640, 1062] }, caja: [150, -230] },
    { desde: T('pellizco', 'aro'), hasta: T('pellizco', 'fin', 0.2), texto: 'Aro', ancla: { pantalla: (t) => [ruedaX(t) - 90, 990 + 120] }, caja: [-150, 230] },
    // Máximo del costado
    { desde: T('maximo', 'maximo'), hasta: T('maximo', 'fin', 0.2), texto: 'Máximo', color: 'rojo', ancla: anclaCostado, caja: [120, -260] },
    { desde: T('maximo', 'escrito'), hasta: T('maximo', 'fin', 0.2), texto: 'no es la presión ideal', color: 'blanco', chico: true, linea: false, ancla: anclaCostado, caja: [120, -180] },
    // Válvula
    { desde: T('tapon', 'valvula'), hasta: T('tapon', 'si', 0.1), texto: 'Válvula', ancla: anclaValvula, caja: [-200, -230] },
    { desde: T('tapon', 'extension'), hasta: T('cabezal', 'encaja', 0.2), texto: 'Extensión', ancla: anclaExtension, caja: [-210, -220] },
    { desde: T('cabezal', 'recto'), hasta: T('cabezal', 'y', -0.1), texto: 'Recto', color: 'blanco', ancla: enMundo(cabezal.grupo, [0, -0.011, 0.025]), caja: [-40, 260] },
    { desde: T('cabezal', 'palanca'), hasta: T('cabezal', 'fin', 0.3), texto: 'Palanca', ancla: anclaPalanca, caja: [-160, -220] },
    // Error del grifo
    { desde: T('error', 'compresor'), hasta: T('error', 'llena', 0.6), texto: 'Compresor del grifo', color: 'rojo', ancla: anclaPistola, caja: [-120, -260] },
    { desde: T('error', 'pasas'), hasta: T('error', 'fin', 0.25), texto: 'Te pasas', color: 'rojo', ancla: { pantalla: [110 + 860 * (78 / 80), 1180] }, caja: [-140, -110] },
    // Inflador y reloj
    { desde: T('inflador', 'manometro'), hasta: T('reloj', null, 0.6), texto: 'Manómetro', ancla: anclaReloj, caja: [-170, -300] },
    { desde: T('reloj', 'numero'), hasta: T('reloj', 'fin', 0.25), texto: 'Tu número', ancla: anclaBanda, caja: [250, 150] },
    // Pierde aire
    { desde: T('semana', 'va'), hasta: T('semana', 'fin', 0.25), texto: 'Se va solo', color: 'rojo', ancla: { pantalla: [110 + 860 * (40 / 80), 1180] }, caja: [0, -110] },
  ];

  const fichas = [
    { desde: T('cuanto', 'manual'), hasta: T('cuanto', 'fin', 0.25), texto: 'Mira tu manual', fila: 0 },
    { desde: T('frio', 'frio'), hasta: T('frio', 'fin', 0.2), texto: 'Llanta fría', fila: 0 },
    { desde: T('frio', 'antes'), hasta: T('frio', 'fin', 0.2), texto: 'Antes de salir', fila: 1 },
    { desde: T('frio', 'caliente'), hasta: T('frio', 'fin', 0.2), texto: 'Caliente marca de más', tipo: 'mal', fila: 2 },
    { desde: T('reloj', 'ya'), hasta: T('reloj', 'fin', 0.25), texto: 'Listo', fila: 3 },
    { desde: T('semana', 'semana'), hasta: T('semana', 'fin', 0.2), texto: 'Cada semana', y: 960 },
  ];

  // ---------------- Medidor de presión ----------------
  const escalones = (t, t0, puntos) => {
    // puntos: [[tiempo, valor], ...] con rampas cortas entre escalones
    let v = puntos[0][1];
    for (let i = 1; i < puntos.length; i++) v += (puntos[i][1] - puntos[i - 1][1]) * progreso(t, puntos[i][0], puntos[i][0] + 0.22);
    return v;
  };
  const hud = [
    { desde: T('causa', 'presion', -0.05), hasta: T('aplasta', null, -0.2), valor: () => 22 },
    { desde: T('rango', 'entre', -0.2), hasta: T('rango', 'fin', 0.2), valor: (t) => 47.5 * progreso(t, T('rango', 'entre'), T('rango', 'psi'), cubica) },
    { desde: T('error', 'llena'), hasta: T('error', 'fin', 0.2), valor: (t) => 20 + 58 * progreso(t, T('error', 'en'), T('error', 'segundo', 0.25), cubica) },
    { desde: T('semana', 'el'), hasta: T('semana', 'fin', 0.2), valor: (t) => 48 - 9 * progreso(t, T('semana', 'aire'), T('semana', 'fin'), suave) },
  ];

  // ---------------- Esquema 2D: pellizco contra la vereda ----------------
  const ruedaX = (t) => 250 + 140 * progreso(t, T('pellizco'), T('pellizco', 'la'), suave) + 78 * progreso(t, T('pellizco', 'se'), T('pellizco', 'pellizca', 0.1), cubica);
  const esquemas = [{
    desde: T('pellizco'), hasta: T('cuanto'),
    svg: (t) => {
      const x = ruedaX(t), y = 990;
      const golpe = progreso(t, T('pellizco', 'pellizca'), T('pellizco', 'pellizca', 0.15));
      const brillo = golpe * (0.75 + 0.25 * Math.sin(t * 18));
      const rayos = [0, 72, 144, 216, 288].map((a) => {
        const r = (a + (x - 250) * 0.5) * Math.PI / 180;
        return `<line x1="${x}" y1="${y}" x2="${x + Math.cos(r) * 165}" y2="${y + Math.sin(r) * 165}" stroke="#c9ced5" stroke-width="16" stroke-linecap="round"/>`;
      }).join('');
      return `
        <defs>
          <radialGradient id="g"><stop offset="0" stop-color="#ff3b2f" stop-opacity="0.9"/><stop offset="1" stop-color="#ff3b2f" stop-opacity="0"/></radialGradient>
          <pattern id="rayado" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="18" height="18" fill="#2a2d32"/><line x1="0" y1="0" x2="0" y2="18" stroke="#3a3e44" stroke-width="6"/></pattern>
        </defs>
        <rect width="1080" height="1920" fill="#050608"/>
        <line x1="0" y1="1250" x2="1080" y2="1250" stroke="#5b6068" stroke-width="4"/>
        <circle cx="${x}" cy="${y}" r="260" fill="#3c4046" stroke="#8d939b" stroke-width="4"/>
        <circle cx="${x}" cy="${y}" r="222" fill="none" stroke="#7d838c" stroke-width="58" stroke-dasharray="14 10" opacity="0.9"/>
        <circle cx="${x}" cy="${y}" r="182" fill="#1a1c20" stroke="#c9ced5" stroke-width="10"/>
        ${rayos}
        <circle cx="${x}" cy="${y}" r="38" fill="#9aa1a9"/>
        <rect x="640" y="1060" width="440" height="190" fill="url(#rayado)" stroke="#8d939b" stroke-width="4"/>
        <text x="860" y="1170" fill="#8d939b" font-family="Poppins" font-weight="700" font-size="34" text-anchor="middle" letter-spacing="3">VEREDA</text>
        <circle cx="640" cy="1062" r="${70 + 30 * brillo}" fill="url(#g)" opacity="${brillo}"/>
        <path d="M 600 1035 l 14 18 l -14 14 l 14 18" stroke="#ff3b2f" stroke-width="7" fill="none" stroke-linecap="round" opacity="${golpe}"/>`;
    },
  }];

  // ---------------- Animación por cuadro ----------------
  function actualizar(t) {
    // Llantas bajas al inicio, infladas desde "¿Cuánto aire?"
    const baja = t < T('cuanto') ? 1 : 0;
    delantera.llanta.morphTargetInfluences[0] = baja;
    trasera.llanta.morphTargetInfluences[0] = baja;
    roce.material.opacity = t >= T('aplasta') && t < T('pellizco') ? 0.9 * progreso(t, T('aplasta', 'roza'), T('aplasta', 'roza', 0.4)) * (0.85 + 0.15 * Math.sin(t * 9)) : 0;

    // Giro de la rueda delantera (solo al final, con la válvula)
    const giroRueda = t >= T('semana', 'revisala') && t < T('cta') ? -2.2 * Math.max(0, t - T('semana', 'cada')) * progreso(t, T('semana', 'cada'), T('semana', 'cada', 0.6)) : 0;
    delantera.giro.rotation.z = giroRueda;
    trasera.giro.rotation.z = t >= T('cta') ? -(t - T('cta')) * 1.2 : 0;
    if (t >= T('cta')) delantera.giro.rotation.z = -(t - T('cta')) * 1.2;

    // Tapón: sale con "tapón", vuelve en "Pon el tapón"
    let fuera;
    if (t < T('tapon')) fuera = 0;
    else if (t < T('semana')) fuera = progreso(t, T('tapon', 'tapon', -0.1), T('tapon', 'valvula'), suave);
    else fuera = 1 - progreso(t, T('semana', 'pon'), T('semana', 'y'), suave);
    delantera.tapon.position.z = 0.048 + fuera * 0.045;
    delantera.tapon.position.y = fuera > 0.7 ? (fuera - 0.7) * 0.25 : 0;
    delantera.tapon.rotation.z = fuera * Math.PI * 6;
    delantera.tapon.visible = fuera < 0.98;

    // Extensión de válvula (solo en tapón/cabezal)
    const conExtension = t >= T('tapon') && t < T('error');
    delantera.extension.visible = conExtension && t >= T('tapon', 'usa');
    delantera.extension.scale.z = Math.max(0.0001, progreso(t, T('tapon', 'usa'), T('tapon', 'extension', 0.1), cubica));

    // Cabezal del inflador: entra recto y cierra la palanca
    cabezal.grupo.visible = t >= T('cabezal') && t < T('error');
    const entra = progreso(t, T('cabezal', 'encaja', -0.1), T('cabezal', 'hasta', 0.3), cubica);
    cabezal.grupo.position.z = 0.092 - 0.006 + (1 - entra) * 0.16;
    cabezal.palanca.rotation.x = -1.1 * (1 - progreso(t, T('cabezal', 'cierra'), T('cabezal', 'cierra', 0.45), cubica));
    eje.visible = t >= T('cabezal') && t < T('cabezal', 'y');

    // Pistola del grifo conectada directo a la válvula
    pistola.grupo.visible = t >= T('error') && t < T('inflador');
    pistola.grupo.position.z = 0.04 + (1 - progreso(t, T('error'), T('error', 'error', 0.3), cubica)) * 0.08;
    pistola.palanca.rotation.x = 0;
    const sobre = t >= T('error') ? progreso(t, T('error', 'en'), T('error', 'segundo', 0.25), cubica) : 0;
    delantera.llanta.scale.setScalar(1 + 0.035 * sobre * (t < T('inflador') ? 1 : 0));

    // Manómetro: sube a pasitos hasta 48 PSI
    const tr = T('reloj');
    fijarAguja(escalones(t, tr, [[0, 20], [T('reloj', 'de'), 26], [T('reloj', 'poquitos'), 31], [T('reloj', 'mirando'), 36], [T('reloj', 'reloj'), 40], [T('reloj', 'cuando'), 44], [T('reloj', 'marque', 0.15), 47.5]]));
    manija.position.y = 0.76 - 0.12 * Math.max(0, Math.sin((t - tr) * 6.3)) * (t > tr && t < T('reloj', 'numero') ? 1 : 0);

    // Iluminación por plano
    const enError = t >= T('error') && t < T('inflador');
    bordeRojo.intensity = enError ? 6 : 1.9;
    clave.intensity = enError ? 0.8 : 2.0;
    bordeCian.intensity = enError ? 0.5 : 1.5;
    const calor = t >= T('frio', 'caliente') && t < T('tapon') ? progreso(t, T('frio', 'caliente'), T('frio', 'caliente', 0.5)) : 0;
    puntoCalor.intensity = 0.6 * calor;
    puntoCalor.position.set(F.x + 0.1, 0.03, 0.15);
    puntoCian.position.set(F.x - 0.15, 0.12, 0.25);
    const general = (t >= T('aplasta') && t < T('pellizco')) || t >= T('cta');
    escena.fog.near = general ? 4.5 : t >= T('inflador') && t < T('semana') ? 3.2 : 2.2;
    escena.fog.far = general ? 9 : 5.5;
    inflador.visible = t >= T('inflador') && t < T('semana');
    puntoCian.intensity = general ? 0 : 0.04;
  }

  return {
    planos, rotulos, fichas, hud, esquemas, actualizar,
    subtitulosHasta: T('cta', 'fin', 0.25),
    cierre: { telefono: T('cta'), logo: T('cta', 'fin', 0.25) },
  };
}
