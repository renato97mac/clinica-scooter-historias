// Renderiza un video cuadro por cuadro con Chromium (Playwright) y lo codifica con ffmpeg.
// Uso: node motor/render.mjs <carpeta-video> [--fps 30] [--desde 0] [--hasta fin] [--escala 1] [--salida ruta.mp4]
//      node motor/render.mjs <carpeta-video> --master --salida ruta.mov   (máster ProRes 422 HQ para edición)
//      node motor/render.mjs <carpeta-video> --cuadros 1.5,12,30   (solo capturas PNG de prueba)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const carpeta = args[0];
const opcion = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const fps = Number(opcion('fps', 30));
const escala = Number(opcion('escala', 1));
const build = path.join(raiz, carpeta, 'build');
const salida = path.resolve(opcion('salida', path.join(build, 'video.mp4')));

const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
const servidor = http.createServer((req, res) => {
  const ruta = path.join(raiz, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!ruta.startsWith(raiz) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': tipos[path.extname(ruta)] || 'application/octet-stream' });
  fs.createReadStream(ruta).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const puerto = servidor.address().port;

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
pagina.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[página]', m.text()); });
pagina.on('pageerror', (e) => console.log('[error]', e.message));
await pagina.goto(`http://127.0.0.1:${puerto}/motor/pagina.html?video=${encodeURIComponent(carpeta)}&escala=${escala}`);
await pagina.waitForFunction(() => window.listo === true, null, { timeout: 120000 });
const duracion = await pagina.evaluate(() => window.duracion);

const cuadros = opcion('cuadros', null);
if (cuadros) {
  fs.mkdirSync(path.join(build, 'pruebas'), { recursive: true });
  for (const t of cuadros.split(',').map(Number)) {
    await pagina.evaluate((x) => window.dibujar(x), t);
    const archivo = path.join(build, 'pruebas', `t${t.toFixed(2)}.png`);
    await pagina.screenshot({ path: archivo });
    console.log(archivo);
  }
} else {
  const desde = Number(opcion('desde', 0));
  const hasta = Math.min(Number(opcion('hasta', duracion)), duracion);
  const total = Math.round((hasta - desde) * fps);
  const voz = path.join(build, 'voz.wav');
  // --master: cuadros PNG sin pérdida → Apple ProRes 422 HQ (10 bits 4:2:2) + audio PCM 24 bits (.mov)
  // por defecto: cuadros JPEG → H.264 para publicar (.mp4)
  const master = args.includes('--master');
  const entradaVideo = master
    ? ['-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-']
    : ['-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  const codificacion = master
    ? ['-c:v', 'prores_ks', '-profile:v', '3', '-vendor', 'apl0', '-bits_per_mb', '8000', '-pix_fmt', 'yuv422p10le',
       '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(fps),
       '-c:a', 'pcm_s24le', '-ac', '2']
    : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(fps),
       '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'];
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', ...entradaVideo,
    '-ss', String(desde), '-t', String(hasta - desde), '-i', voz,
    '-filter_complex', '[1:a]aresample=48000:resampler=soxr,apad[a]', '-map', '0:v', '-map', '[a]', '-shortest',
    ...codificacion, salida], { stdio: ['pipe', 'inherit', 'inherit'] });
  const inicio = Date.now();
  for (let i = 0; i < total; i++) {
    const t = desde + i / fps;
    await pagina.evaluate((x) => window.dibujar(x), t);
    const cuadro = await pagina.screenshot(master ? { type: 'png' } : { type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(cuadro)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0) {
      const s = (Date.now() - inicio) / 1000;
      console.log(`cuadro ${i}/${total}  t=${t.toFixed(2)}s  ${(s / (i + 1)).toFixed(2)} s/cuadro`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`Listo: ${salida}`);
}
await navegador.close();
servidor.close();
