// 验证 antfun-v2.html 声场三处升级：帧反馈拖尾 / Kuramoto 锁相 / ACES 色调
// 用法：npm install && npx playwright install chromium && npm run verify
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // 包根目录

const FILE = pathToFileURL(path.join(DIR, 'antfun-v2.html')).href;
const OUT = path.join(DIR, 'screenshots', 'verify-room.png');

const errors = [];
const browser = await chromium.launch();
// crop-hi：2 倍像素密度再拍一张大厅卡片特写，检查细扫描线
{ const p2 = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })).newPage(); await p2.goto(FILE, { waitUntil: 'networkidle' }); await p2.waitForTimeout(500); await p2.locator('.lc').first().screenshot({ path: OUT.replace('.png', '-card-hi.png') }); }
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

await page.goto(FILE, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// 进第一个直播间（大厅卡片 .lc）→ 挂载声场
await page.screenshot({ path: OUT.replace('.png', '-lobby-shot.png') });
await page.locator('.lc').first().click();
await page.waitForSelector('.stage canvas', { timeout: 5000 });
await page.waitForTimeout(1200);

const sync0 = await page.evaluate(() => window.antfunField.sync);
// 连续大额买入，把人群耦合推高，观察 Kuramoto 锁相
for (let i = 0; i < 6; i++) { await page.keyboard.press('g'); await page.waitForTimeout(250); }
await page.waitForTimeout(2500);

const sync1 = await page.evaluate(() => window.antfunField.sync);
console.log('=== 城市特征 ===', JSON.stringify(await page.evaluate(() => window.antfunField.traits)));
console.log('=== Kuramoto 序参量 r ===', `前 ${sync0.r.toFixed(3)} (K=${sync0.coupling.toFixed(2)}) → 后 ${sync1.r.toFixed(3)} (K=${sync1.coupling.toFixed(2)})，人群 ${sync1.n}`);

// 标签重叠检查：可见 .lbl 两两求交
const overlaps = await page.evaluate(() => {
  const rs = [...document.querySelectorAll('.stage .lbl')].filter(e => e.style.display !== 'none').map(e => ({ t: e.textContent, b: e.getBoundingClientRect() }));
  const out = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i].b, b = rs[j].b;
    if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) out.push(rs[i].t + ' × ' + rs[j].t); }
  return { n: rs.length, out };
});
console.log('=== 标签重叠 ===', `${overlaps.n} 个可见标签，`, overlaps.out.length ? '重叠：' + overlaps.out.join('; ') : '无重叠');
await page.locator('.stage').screenshot({ path: OUT });
await page.screenshot({ path: OUT.replace('.png', '-full.png') });

console.log('=== 控制台错误 ===');
console.log(errors.length ? errors.join('\n') : '（无）');
console.log('=== 截图 ===', OUT);

// WebGL 上下文健康检查
const glOk = await page.evaluate(() => {
  const c = document.querySelector('.stage canvas');
  if (!c) return 'no-canvas';
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  return gl ? 'webgl-ok ' + c.width + 'x' + c.height : 'no-webgl';
});
console.log('=== WebGL ===', glOk);

await browser.close();
