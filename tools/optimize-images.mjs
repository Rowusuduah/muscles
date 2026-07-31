/* muscles — one-time image pipeline (run manually, not shipped).
   Compresses raw GYM/*.jpeg -> assets/equipment/eqN.webp using headless
   Chrome's canvas (no native deps). Usage: node tools/optimize-images.mjs   */
import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROOT = 'E:/gYM';
const OUTDIR = ROOT + '/assets/equipment';
const TMP = ROOT + '/tools/_convert.html';
const MAX = 1000, Q = 0.82;
if (!existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true });

// which photo numbers to convert: those referenced in equipment.js (fallback 1..51)
let nums = [];
try {
  const eq = readFileSync(ROOT + '/data/equipment.js', 'utf8');
  const re = /img\((\d+)\)/g; let m; const s = new Set();
  while ((m = re.exec(eq))) s.add(+m[1]);
  nums = [...s].sort((a, b) => a - b);
} catch {}
if (!nums.length) nums = Array.from({ length: 51 }, (_, i) => i + 1);

const items = nums.map((n) => ({
  n,
  src: 'file:///' + encodeURI((n === 1 ? ROOT + '/GYM/Gym equipment.jpeg' : ROOT + '/GYM/Gym equipment ' + n + '.jpeg'))
})).filter((it) => existsSync(decodeURIComponent(it.src.replace('file:///', ''))));

const html = `<!doctype html><meta charset=utf-8><canvas id=c></canvas><script>
const items=${JSON.stringify(items)}; const MAX=${MAX}, Q=${Q};
window.RESULTS=[]; window.DONE=false;
const cv=document.getElementById('c'), cx=cv.getContext('2d');
function one(it){return new Promise(res=>{const img=new Image();img.onload=function(){
  // preserve the whole photo (no crop) — just downscale to fit MAX on the long side
  const s=Math.min(MAX/img.width, MAX/img.height, 1);
  const dw=Math.max(1,Math.round(img.width*s)), dh=Math.max(1,Math.round(img.height*s));
  cv.width=dw; cv.height=dh; cx.clearRect(0,0,dw,dh); cx.drawImage(img,0,0,dw,dh);
  let url=''; try{url=cv.toDataURL('image/webp',Q);}catch(e){url='';}
  window.RESULTS.push({n:it.n,url:url}); img.src=''; res();
};img.onerror=function(){window.RESULTS.push({n:it.n,url:''});res();};img.src=it.src;});}
(async function(){for(const it of items){await one(it);}window.DONE=true;})();
</script>`;
writeFileSync(TMP, html);

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--allow-file-access-from-files', '--disable-web-security', '--user-data-dir=' + ROOT + '/tools/_chromeprofile',
  '--remote-debugging-port=9360', 'about:blank']);
async function target() { for (let i = 0; i < 40; i++) { try { const r = await fetch('http://127.0.0.1:9360/json'); const l = await r.json(); const p = l.find((t) => t.type === 'page'); if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl; } catch {} await sleep(150); } throw new Error('no target'); }
const ws = new WebSocket(await target()); let id = 0; const pend = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const cmd = (method, params = {}) => { id++; const c = id; return new Promise((r) => { pend.set(c, r); ws.send(JSON.stringify({ id: c, method, params })); }); };
const evalJs = async (e) => (await cmd('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;

await cmd('Page.enable');
await cmd('Page.navigate', { url: 'file:///' + encodeURI(TMP) });
// wait for conversion
for (let i = 0; i < 120; i++) { if (await evalJs('window.DONE===true')) break; await sleep(500); }
const count = await evalJs('window.RESULTS.length');
let ok = 0, bytes = 0;
for (let i = 0; i < count; i++) {
  const it = await evalJs(`(function(){var r=window.RESULTS[${i}];return {n:r.n,url:r.url};})()`);
  if (!it || !it.url) { console.log('skip eq' + (it && it.n)); continue; }
  const b64 = it.url.split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  writeFileSync(OUTDIR + '/eq' + it.n + '.webp', buf);
  ok++; bytes += buf.length;
}
console.log('converted', ok, 'images,', Math.round(bytes / 1024) + ' KB total, avg', Math.round(bytes / 1024 / Math.max(1, ok)) + ' KB');
ws.close(); chrome.kill(); process.exit(0);
