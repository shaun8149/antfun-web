import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
// 从 4 个方位各拍一张城市截图（用 window.antfunField.setView 固定视角）
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');   // 包根目录
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(pathToFileURL(path.join(DIR, 'antfun-v2.html')).href); await p.waitForTimeout(600);
await p.locator('.lc').first().click(); await p.waitForTimeout(1500);
for (const [i, a] of [0, 1.6, 3.2, 4.8].entries()) { await p.evaluate(a => window.antfunField.setView(a), a); await p.waitForTimeout(900); await p.locator('.stage').screenshot({ path: path.join(DIR, 'screenshots', `view-${i}.png`) }); }
console.log('errors:', errs.length ? errs : 'none'); await b.close();
