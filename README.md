# ANT.FUN v2 原型：赛博朋克霓虹 + 城市声场

社交语音（直播间）+ 交易的网页原型。整个页面是一个单文件 HTML，不需要构建步骤。直播间中央的「声场」是一座由房间绑定的 token 生成的香港风霓虹城市。

- 代码仓库：https://github.com/shaun8149/antfun-web
- 在线预览：https://claude.ai/artifact/L3XTD8T6XFwqjf4yzDLkTJ （拿到链接即可打开，内容与本包一致）
- 当前版本：0.30.0（2026-10-02）

> 3D 声场的完整功能说明和接入方式见 **[FEATURES.md](FEATURES.md)**。

## 快速开始

直接用浏览器打开 `antfun-v2.html` 就能用。需要联网，因为 three.js r128 从 cdnjs 加载，字体从 Google Fonts 加载。

进入任意直播间后可以用这些操作：

| 操作 | 作用 |
|---|---|
| `b` / `s` | 买入 / 卖出：彗星从楼顶飞向广场，城市闪青光或红光 |
| `g` | 大额买入：大彗星，人群锁相明显增强 |
| 拖动画面 | 改变环绕视角 |
| 滚轮 | 推近或拉远镜头 |
| 举手 / 让举手者上麦 / 用麦克风 | 举手者上麦；接入麦克风后用真实音量驱动光球 |

## 自动验证（改完代码请跑一遍）

```bash
npm install
npx playwright install chromium
npm run verify   # 进房 → 连按 6 次 g → 检查控制台错误、WebGL、Kuramoto 锁相 r、名字标签是否重叠，并截图
npm run views    # 从 4 个方位各拍一张城市截图，写到 screenshots/view-0..3.png
npm run camera   # 镜头原则检测：自动镜头只能前进、绝不回头、不能停住（约 2 分钟）
```

`verify` 要满足这几条才算通过：控制台错误为「（无）」、WebGL 正常、锁相 r 在大单后升到 0.9 以上、标签无重叠。截图写到 `screenshots/verify-*.png`。

## 目录

```
antfun-v2.html            整个应用（HTML + CSS + JS 单文件，约 180KB，含内嵌头像）
scripts/verify.mjs        Playwright 冒烟测试
scripts/views.mjs         四方位截图
assets/avatars/           20 张真人头像原图（已压缩为 96px 内嵌进 HTML，这里是源文件）
screenshots/              当前版本预览图
history/antfun-v2.rain-experiment.html   被否决的「下雨 + 招牌随跌幅损坏 + 近景悬空横招」实验版，仅供参考
```

## 代码地图（antfun-v2.html）

文件里每一段都有分区注释，搜索下面这些标题就能跳过去。

**CSS**
- `:root` 设计令牌：颜色、发光、字体都在这里。
- 之后依次是：`app frame` → `left` → `CRT 扫描线` → `center: lobby` → `center: room` → `center: trade mode` → `right` → `modal / toast`。

**JS：页面部分**
- `utils`，其中有 `PHOTOS` 和 `PH(name)`，按名字的哈希固定分配头像。
- `data`：mock 的房间、群、币、动态。
- 之后依次是：`left column` → `center: lobby` → `center: room` → `trade mode (K line)` → `right column` → `modal` → `mode`。

**JS：`3D sound field`（声场，一个 IIFE，对外只暴露 `field` 对象）**
- **城市特征**：`rollTraits(token)` 把 token 名经 FNV-1a 哈希后作为种子，抽出配色方案、楼高轮廓、霓虹密度，以及 2.5% 概率的单色稀有款。同一个币永远生成同一座城。
- **楼体**：`cityMat` 加 `buildCity()`，所有楼合在一个 InstancedMesh 里一次绘制。
  - 窗格是在着色器里程序生成的，以暗为主；亮窗比例跟着在线人数变。
  - 楼的竖棱和屋顶边缘是霓虹灯管。
  - 内圈留了 3 条放射状的大街缺口，用来透出远景。
- **招牌和屏幕**：`layoutCity()` 每次进房重建，按楼高挑出 18 栋挂点楼（内圈 28 栋楼，去掉 3 条大街缺口后约 21 栋）。编号对应代码注释 1)–10)：
  1. 屋顶币名价格招牌
  2. K 线大屏
  3. 在麦头像墙
  4. 竖向 ANT.FUN 灯管招牌
  5. LED 跑马灯环
  6. 横广告：5 个币种标志（BTC/ETH/SOL/DOGE/USDT）
  7. 48 块竖向港式挂牌，用图集绘制
  8. 几何构成主义运动海报，共 6 张（排球扣球、射箭、冲浪、击剑、篮球扣篮、公路自行车）：矢量人体按身体部位和贯穿全画的构图线/圆切成平涂色块，配色取自产品负责人给的参考图；最后经「LED 大屏化」处理（黑底、人物保持原色、深色线变亮边、亮部光晕、竖向像素格、发光边框），预览见 `screenshots/poster-*.png`
  9. PUNK 像素头像屏
  10. Fidenza 风格流场巨幕
- **共识（Kuramoto 锁相）**：`setupRoom()` 和 `stepSync()`。每个听众是一个振子，成交会改变耦合强度，锁相越强，全城窗灯的呼吸越同步。
- **后处理**：依次是湿地面镜像倒影 → 帧反馈拖尾 → 泛光（四分之一分辨率）→ ACES 色调映射加暗角。
- **其他交互**：演讲者、举手、彗星、麦克风输入、镜头控制。

**JS：`simulation loop`**：模拟成交、聊天、价格，驱动整个页面。

## 研发接入：房间参数接口（3D 场景）

声场对象 `field`（页面上也挂在 `window.antfunField`）提供以下接口。进房由 `field.mount(stage, labels, chips, room)` 完成，之后用下面两个方法推送变化：

```js
field.setRoomInfo({
  name:     'Bitgold-阿彪的直播间',          // 直播间名字 → 楼面顶部横向霓虹招牌
  title:    '平台后续主要发展业务…',           // 直播间标题 → LED 跑马灯环第一条
  tokens:   ['BGLD', 'BTC', 'SOL'],          // 购物车 token；[0] 为主币，决定城市种子 → 主塔价格巨招每 6 秒轮换，并上街边竖招牌
  speakers: ['Bitgold-阿彪', '八方来财yc'],  // 当前在麦的完整名单（字符串或 {name}）
});
field.setProgress(0.42);                     // 全城灯火进度 0–1（最低显示 12%），口径由产品定：累计净买入 / 应援数等
```

- 每个字段都可以单独传，只传变化的那一项即可。
- `speakers` 传的是**完整在麦名单**，组件会自动计算差异：名单里新出现的人上麦，消失的人下麦。本机麦克风接入的 `You` 不受影响。
- **上麦点名**：新上麦的人约 2.5 秒后会被点名。
  - 名字塔竖牌先「灯管通电」式闪烁，亮起名字，同时全城闪一下光；
  - 相邻 3 块中继竖牌每隔 0.35 秒接力亮起同一个名字，持续约 9 秒；
  - 镜头会「甩镜」转向名字塔并推近：**只沿环绕方向前进、绝不回头**；180° 以内 1 秒，更大角度最多 1.6 秒，缓入缓出；
  - 两次甩镜至少间隔 30 秒，冷却期内照常点名，只是镜头不动；用户正在拖动或刚松手 4 秒内不抢镜；拖动时会立即交还镜头；
  - 可以用 `field.setAutoCamera(false)` 关闭甩镜，或用 `field.setAutoCamera({ cooldown: 45, idle: 6 })` 调节参数；
  - 点名结束后，名字塔显示「發言中」（当前说话的人），中继牌显示其他在麦的人。
  - 多人同时上麦时会排队，依次点名。
- **只有主币变化才会重建城市**；改名字、改标题、上下麦都不会重建。
- 不调用 `setProgress` 时，原型用模拟成交来驱动进度。一旦调用过一次，就改为完全由外部数据驱动。
- 原型里每隔 20–35 秒会自动模拟一次上麦或下麦，代码在 `simulation loop` 的 `micT` 段，这段就是调用示范。接入真实数据后删掉它即可。
- 只读状态：`field.speakerNames`、`field.nameSigns`、`field.progress`。

## 调试接口

页面暴露了 `window.antfunField`，验证脚本靠它取数据：

- `antfunField.sync`：`{ r, coupling, n }`，分别是锁相序参量、耦合强度、听众数。
- `antfunField.traits`：当前城市的特征。
- `antfunField.setView(az)`：把镜头固定到某个方位角，同时关闭自动环绕。

## 设计约定（产品负责人已确认，改动前请对齐）

- **配色**：
  - 底色是深蓝黑；霓虹以青色和蓝色为主，**洋红和紫色只做点缀**。
  - 主按钮统一用普通蓝色。
  - 左右两栏用冷色。
  - 直播间里的城市可以更浓烈一些。
- **扫描线**：Logo、顶栏切换和主按钮上叠 1.5px 间距的细扫描线，在 Retina 屏上效果最好。
- **城市要符合现实**：**招牌必须挂在楼上**，悬空的东西已经被否决过。窗户以暗为主。
- **招牌文字**：用港式繁体、行业招牌和地名，比如押、茶餐廳、金行、啟德機場、紅磡、蓮香。不要用「元宇宙」「电玩城」这类概念词，**也不要用「安饭」**，品牌一律写 ANT.FUN。
- **品牌**：不用真实的非加密品牌名（比如周大福），改用虚构老字号，避免商标问题。币种标志（BTC/ETH/SOL/DOGE/USDT）属于资产标识，可以用。

## 素材与版权

- **three.js r128**：MIT 授权。**字体**：Google Fonts 上的 Chakra Petch、Noto Sans SC、IBM Plex Mono。
- **头像**：来自 randomuser.me 的示例照片，**只作占位**，正式版换成用户自己的头像。
- **PUNK 头像**：程序生成的 24×24 像素人物，风格参照 CryptoPunks，但不复制任何真实的 Punk。CryptoPunks 的版权属于 Yuga Labs。
- **流场巨幕**：自写的算法（值噪声角度场 + 不相交的色带），向 Tyler Hobbs 的 Fidenza 致敬，没有使用 Fidenza 的原代码。
- **币种标志**：在画布上手绘，颜色用各家的官方品牌色。

## 已知限制 / 下一步

- 所有数据都是 mock 的，还没有接入真实的行情和语音服务。
- 移动端没有专门适配，声场在低端设备上可能偏重。可以先降低 `renderer.setPixelRatio`，或者减少楼的数量（`MAX_BLD`）。
- 「无限城」方向（香港山海钢铁丛林，镜头放在 40–50 楼的高度，往上往下都看不到尽头）在讨论中，还没有开工。
- `antfun-v2.html` 的第一行是从 claude.ai Artifact 平台导出时自带的包裹头，不影响使用。
