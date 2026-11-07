// Motor genérico de videos explicativos 3D (vertical 1080x1920).
// Carga <video>/guion.json, <video>/build/tiempos.json y <video>/escena.js,
// y expone window.dibujar(t) para que render.mjs capture cuadro por cuadro.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const ANCHO = 1080, ALTO = 1920;
const params = new URLSearchParams(location.search);
const carpeta = params.get('video');
const escala = parseFloat(params.get('escala') || '1');

const cargarJSON = async (ruta) => (await fetch(ruta)).json();
const guion = await cargarJSON(`../${carpeta}/guion.json`);
const tiempos = await cargarJSON(`../${carpeta}/build/tiempos.json`);
const modulo = await import(`../${carpeta}/escena.js`);

// ---------- Utilidades de tiempo ----------
const normal = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
const frasePorId = Object.fromEntries(tiempos.frases.map((f) => [f.id, f]));
/** Tiempo (s) de una frase: T('id'), T('id','palabra'), T('id','fin'), con desfase opcional. */
function T(id, palabra = null, desfase = 0) {
  const f = frasePorId[id];
  if (!f) throw new Error(`Frase desconocida: ${id}`);
  if (palabra === null) return f.inicio + desfase;
  if (palabra === 'fin') return f.fin + desfase;
  const objetivo = normal(String(palabra));
  const w = f.palabras.find((p) => normal(p.texto).startsWith(objetivo));
  if (!w) throw new Error(`Palabra "${palabra}" no está en la frase ${id}`);
  return w.inicio + desfase;
}
const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => { x = limitar(x); return x * x * (3 - 2 * x); };
const sinusoidal = (x) => 0.5 - 0.5 * Math.cos(Math.PI * limitar(x));
const cubica = (x) => { x = limitar(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** Progreso 0..1 entre dos tiempos con suavizado. */
const progreso = (t, a, b, ease = suave) => ease((t - a) / Math.max(1e-6, b - a));

// ---------- Three.js ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(ANCHO * escala, ALTO * escala, false);
renderer.domElement.style.width = `${ANCHO}px`;
renderer.domElement.style.height = `${ALTO}px`;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('lienzo').appendChild(renderer.domElement);

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x050608);
const pmrem = new THREE.PMREMGenerator(renderer);
escena.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
const camara = new THREE.PerspectiveCamera(35, ANCHO / ALTO, 0.005, 50);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.setSize(ANCHO * escala, ALTO * escala);
composer.addPass(new RenderPass(escena, camara));
const bloom = new UnrealBloomPass(new THREE.Vector2(ANCHO * escala / 2, ALTO * escala / 2), 0.32, 0.45, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

await document.fonts.ready;
await Promise.all([500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Poppins`)));

const ctx = { THREE, escena, camara, renderer, T, tiempos, guion, utiles: { limitar, suave, sinusoidal, cubica, progreso } };
const programa = await modulo.crear(ctx);

// ---------- Cámara por planos ----------
const planos = programa.planos.slice().sort((a, b) => a.t - b.t);
const _v = new THREE.Vector3();
function estadoPlano(p, t, fin) {
  const k = (p.ease || sinusoidal)((t - p.t) / Math.max(1e-6, fin - p.t));
  if (p.orbita) {
    const o = p.orbita;
    const ang = o.ang0 + (o.ang1 - o.ang0) * k;
    const radio = o.radio0 + ((o.radio1 ?? o.radio0) - o.radio0) * k;
    const altura = o.altura0 + ((o.altura1 ?? o.altura0) - o.altura0) * k;
    const pos = new THREE.Vector3(o.centro[0] + radio * Math.cos(ang), o.centro[1] + altura, o.centro[2] + radio * Math.sin(ang));
    return { pos, mira: new THREE.Vector3().fromArray(o.mira || o.centro), fov: o.fov };
  }
  const pos = new THREE.Vector3().fromArray(p.de.pos).lerp(_v.fromArray(p.a?.pos || p.de.pos), k);
  const mira = new THREE.Vector3().fromArray(p.de.mira).lerp(_v.fromArray(p.a?.mira || p.de.mira), k);
  const fov = p.de.fov + ((p.a?.fov ?? p.de.fov) - p.de.fov) * k;
  return { pos, mira, fov };
}
function colocarCamara(t) {
  let i = planos.findLastIndex((p) => p.t <= t);
  if (i < 0) i = 0;
  const p = planos[i];
  const fin = planos[i + 1]?.t ?? tiempos.duracion;
  let e = estadoPlano(p, t, fin);
  if (i > 0 && !p.corte) {
    const transicion = p.transicion ?? 0.9;
    const b = cubica((t - p.t) / transicion);
    if (b < 1) {
      const previo = estadoPlano(planos[i - 1], p.t, p.t);
      e = { pos: previo.pos.lerp(e.pos, b), mira: previo.mira.lerp(e.mira, b), fov: previo.fov + (e.fov - previo.fov) * b };
    }
  }
  camara.position.copy(e.pos);
  camara.fov = e.fov;
  camara.updateProjectionMatrix();
  camara.lookAt(e.mira);
  camara.updateMatrixWorld();
}

// ---------- Subtítulos karaoke ----------
const subs = document.getElementById('subs');
const todas = tiempos.frases.flatMap((f, fi) => f.palabras.map((p) => ({ ...p, frase: fi })));
const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
let ultimoSubs = '';
function dibujarSubtitulos(t) {
  let html = '';
  const fin = programa.subtitulosHasta ?? tiempos.fin_voz;
  const idx = todas.findLastIndex((w) => w.inicio <= t);
  if (idx >= 0 && t < fin) {
    const actual = todas[idx];
    const pagina = todas.filter((w) => w.pagina === actual.pagina && w.inicio <= t);
    const partes = [];
    for (let i = 0; i < pagina.length; i++) {
      const w = pagina[i];
      const clase = w === actual ? 'a' : 'p';
      if (w.clave) {
        const grupo = [];
        while (i < pagina.length && pagina[i].clave === w.clave) grupo.push(pagina[i++]);
        i--;
        partes.push(`<span class="clave">${grupo.map((g) => `<span>${escapar(g.texto)}</span>`).join(' ')}</span>`);
      } else {
        partes.push(`<span class="${clase}">${escapar(w.texto)}</span>`);
      }
    }
    html = partes.join(' ');
  }
  if (html !== ultimoSubs) { subs.innerHTML = html; ultimoSubs = html; }
}

// ---------- Rótulos anclados (3D o pantalla) ----------
const capaRotulos = document.getElementById('rotulos');
const lineas = document.getElementById('lineas');
const rotulos = (programa.rotulos || []).map((r) => {
  const el = document.createElement('div');
  el.className = `rotulo ${r.color || ''} ${r.chico ? 'chico' : ''}`;
  el.textContent = r.texto;
  el.style.display = 'none';
  capaRotulos.appendChild(el);
  return { ...r, el };
});
function proyectar(ancla, t) {
  if (ancla.pantalla) {
    const [x, y] = typeof ancla.pantalla === 'function' ? ancla.pantalla(t) : ancla.pantalla;
    return { x, y, visible: true };
  }
  const v = (typeof ancla === 'function' ? ancla() : new THREE.Vector3().fromArray(ancla)).clone().project(camara);
  return { x: (v.x * 0.5 + 0.5) * ANCHO, y: (-v.y * 0.5 + 0.5) * ALTO, visible: v.z < 1 };
}
function dibujarRotulos(t) {
  let svg = '';
  for (const r of rotulos) {
    const hasta = r.hasta ?? Infinity;
    if (t < r.desde || t > hasta + 0.18) { r.el.style.display = 'none'; continue; }
    const a = proyectar(r.ancla, t);
    if (!a.visible) { r.el.style.display = 'none'; continue; }
    const op = Math.min(progreso(t, r.desde, r.desde + 0.16), 1 - progreso(t, hasta, hasta + 0.18));
    const esc = 0.85 + 0.15 * progreso(t, r.desde, r.desde + 0.2, cubica);
    const [dx, dy] = r.caja || [0, 120];
    const cx = a.x + dx, cy = a.y + dy;
    r.el.style.display = 'block';
    r.el.style.opacity = op;
    r.el.style.transform = `translate(-50%, -50%) translate(${cx}px, ${cy}px) scale(${esc})`;
    if (r.linea !== false) {
      const w = r.el.offsetWidth / 2, h = r.el.offsetHeight / 2;
      // Punto del borde de la caja más cercano al ancla
      const ex = Math.abs(dx) > w ? cx - Math.sign(dx) * w : a.x;
      const ey = Math.abs(dx) > w ? cy : cy - Math.sign(dy) * h;
      const color = r.color === 'rojo' ? 'var(--rojo)' : r.color === 'blanco' ? '#e9edf1' : 'var(--cian)';
      const largo = progreso(t, r.desde, r.desde + 0.25, cubica);
      svg += `<g opacity="${op}" style="color:${color}"><line x1="${a.x}" y1="${a.y}" x2="${a.x + (ex - a.x) * largo}" y2="${a.y + (ey - a.y) * largo}" stroke="currentColor" stroke-width="3"/>` +
             `<circle cx="${a.x}" cy="${a.y}" r="8" fill="currentColor" stroke="#fff" stroke-width="2"/></g>`;
    }
  }
  lineas.innerHTML = svg;
}

// ---------- Fichas de checklist ----------
const capaFichas = document.getElementById('fichas');
const fichas = (programa.fichas || []).map((f) => {
  const el = document.createElement('div');
  el.className = `ficha ${f.tipo === 'mal' ? 'mal' : ''}`;
  el.textContent = `${f.tipo === 'mal' ? '✕' : '✓'}  ${f.texto}`;
  el.style.top = `${f.y ?? 1080 + (f.fila || 0) * 84}px`;
  if (f.x) el.style.left = `${f.x}px`;
  el.style.display = 'none';
  capaFichas.appendChild(el);
  return { ...f, el };
});
function dibujarFichas(t) {
  for (const f of fichas) {
    const hasta = f.hasta ?? Infinity;
    if (t < f.desde || t > hasta + 0.2) { f.el.style.display = 'none'; continue; }
    const op = Math.min(progreso(t, f.desde, f.desde + 0.15), 1 - progreso(t, hasta, hasta + 0.2));
    f.el.style.display = 'block';
    f.el.style.opacity = op;
    f.el.style.transform = `translateX(${(1 - progreso(t, f.desde, f.desde + 0.25, cubica)) * -40}px)`;
  }
}

// ---------- Medidor (HUD) ----------
// Cada entrada de programa.hud puede definir: nombre, unidad, max, marcas, banda [min,max], tolerancia.
// Por defecto es el medidor de presión (0–80 PSI) del primer video.
const hud = document.getElementById('hud');
let marcasActuales = '';
function dibujarHud(t) {
  const h = (programa.hud || []).find((x) => t >= x.desde && t < x.hasta + 0.2);
  if (!h) { hud.style.display = 'none'; return; }
  const max = h.max ?? 80;
  const marcas = h.marcas ?? [0, 20, 40, 60, 80];
  const clave = `${max}|${marcas.join(',')}`;
  if (clave !== marcasActuales) {
    hud.querySelector('.marcas').innerHTML = marcas.map((v) => `<span style="left:${(v / max) * 100}%">${v}</span>`).join('');
    marcasActuales = clave;
  }
  const valor = h.valor(t);
  const op = Math.min(progreso(t, h.desde, h.desde + 0.2), 1 - progreso(t, h.hasta, h.hasta + 0.2));
  const [b0, b1] = h.banda || [45, 50];
  const tolerancia = h.tolerancia ?? 8;
  const enBanda = valor >= b0 - 0.5 && valor <= b1 + 0.5;
  const color = enBanda ? 'var(--cian)' : (valor < b0 - tolerancia || valor > b1 + tolerancia) ? 'var(--rojo)' : '#e9edf1';
  hud.style.display = 'block';
  hud.style.opacity = op;
  hud.querySelector('.valor').textContent = Math.round(valor);
  hud.querySelector('.valor').style.color = color;
  hud.querySelector('.lectura small').textContent = h.unidad ?? 'PSI';
  hud.querySelector('.nombre').textContent = h.nombre || 'PRESIÓN';
  const banda = hud.querySelector('.banda');
  banda.style.display = h.mostrarBanda === false ? 'none' : 'block';
  banda.style.left = `${(b0 / max) * 100}%`;
  banda.style.width = `${((b1 - b0) / max) * 100}%`;
  const relleno = hud.querySelector('.relleno');
  relleno.style.width = `${limitar(valor / max) * 100}%`;
  relleno.style.background = color;
}

// ---------- Esquemas 2D ----------
const esquema = document.getElementById('esquema');
function dibujarEsquemas(t) {
  const e = (programa.esquemas || []).find((x) => t >= x.desde && t < x.hasta);
  esquema.style.display = e ? 'block' : 'none';
  if (e) esquema.innerHTML = e.svg(t);
  return !!e;
}

// ---------- Cierre: teléfono + logo ----------
const lienzo = document.getElementById('lienzo');
const perfil = document.getElementById('perfil');
const logo = document.getElementById('logo');
const marca = guion.marca || { nombre: 'La Clínica del Scooter', usuario: 'laclinicadelscooter' };
perfil.innerHTML = `<div class="avatar">LC</div><div>${marca.usuario}</div><div class="seguir">Seguir</div>`;
logo.innerHTML = `<div class="marca">LA CLÍNICA<br><em>DEL SCOOTER</em></div><div class="linea"></div>` +
  `<div class="bajada">${marca.bajada || 'Taller de scooters eléctricos'}</div><div class="usuario">@${marca.usuario}</div>`;
function dibujarCierre(t) {
  const c = programa.cierre;
  if (!c) return;
  const k = progreso(t, c.telefono, c.telefono + 0.7, cubica);
  if (t >= c.telefono) {
    const s = 1 - 0.36 * k;
    lienzo.style.transform = `scale(${s})`;
    lienzo.style.borderRadius = `${70 * k / s}px`;
    lienzo.style.outline = k > 0 ? `${14 / s}px solid rgba(30,32,37,${k})` : 'none';
    perfil.style.display = 'flex';
    perfil.style.opacity = progreso(t, c.telefono + 0.4, c.telefono + 0.8);
  } else {
    lienzo.style.transform = 'none'; lienzo.style.outline = 'none'; perfil.style.display = 'none';
  }
  if (t >= c.logo) {
    logo.style.display = 'flex';
    logo.style.opacity = progreso(t, c.logo, c.logo + 0.3);
    logo.querySelector('.linea').style.width = `${520 * progreso(t, c.logo + 0.2, c.logo + 0.9, cubica)}px`;
    logo.querySelector('.marca').style.transform = `scale(${0.92 + 0.08 * progreso(t, c.logo, c.logo + 0.6, cubica)})`;
  } else {
    logo.style.display = 'none';
  }
}

// ---------- Cuadro ----------
window.dibujar = (t) => {
  programa.actualizar?.(t);
  colocarCamara(t);
  const plano = !dibujarEsquemas(t);
  if (plano) composer.render();
  dibujarSubtitulos(t);
  dibujarRotulos(plano ? t : -1);
  if (!plano) dibujarRotulosEsquema(t);
  dibujarFichas(t);
  dibujarHud(t);
  dibujarCierre(t);
};
// En los esquemas solo se muestran los rótulos con ancla de pantalla.
function dibujarRotulosEsquema(t) {
  const visibles = rotulos.filter((r) => r.ancla.pantalla);
  const ocultos = rotulos.filter((r) => !r.ancla.pantalla);
  ocultos.forEach((r) => { r.el.style.display = 'none'; });
  const guardados = rotulos.splice(0, rotulos.length, ...visibles);
  dibujarRotulos(t);
  rotulos.splice(0, rotulos.length, ...guardados);
}

window.duracion = tiempos.duracion;
window.listo = true;
