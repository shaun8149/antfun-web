import { chromium } from 'playwright'; import { fileURLToPath, pathToFileURL } from 'node:url'; import path from 'node:path';
// 镜头原则检测：① 自动镜头方位角只能单调不减（只前进、绝不回头）；② 不能停住超过 0.5 秒（甩完就停会让人以为卡死）。逐个房间采样 16 秒
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const b = await chromium.launch(); let worst = 0, n = 0, freeze = 0;
for (let room = 0; room < 7; room++) { const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto(pathToFileURL(path.join(DIR, 'antfun-v2.html')).href); await p.waitForTimeout(400); await p.locator('.lc').nth(room).click();
  let prev = null; const t0 = Date.now(); let back = 0, still = 0, maxStill = 0;
  while (Date.now() - t0 < 16000) { const a = await p.evaluate(() => window.antfunField.camState.az); if (prev != null) { const d = a - prev; if (d < -1e-4) back = Math.min(back, d); if (Math.abs(d) < 1e-5) { still += 50; maxStill = Math.max(maxStill, still); } else still = 0; n++; } prev = a; await p.waitForTimeout(50); }
  console.log('room', room, 'max backward step', back.toFixed(4), 'longest freeze ms', maxStill); worst = Math.min(worst, back); freeze = Math.max(freeze, maxStill); await p.close(); }
console.log('samples', n, 'worst backward', worst.toFixed(4)); await b.close();
if (worst < 0) { console.error('FAIL：镜头出现反向转动'); process.exit(1); } if (freeze > 500) { console.error('FAIL：镜头停住 ' + freeze + 'ms'); process.exit(1); } console.log('PASS：镜头只前进、不停顿');
