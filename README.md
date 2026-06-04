# 媽媽の栃木・茨城 — 旅のしおり（離線 PWA）

香港媽媽 2026/6/16–21 栃木・茨城 6 日自由行嘅離線行程手帳。
所有景點/餐廳開放時間、交通車資、booking、緊急資訊都經官網核查 + Codex/Antigravity 交叉驗證。

🔗 **網址**：https://yinstagram.github.io/mama-japan-trip-2026/
📱 iPhone Safari 開 → 分享 → **加入主畫面** → 變 app icon、離線都用到。

## 結構
- `index.html` — 殼（4 tab：行程 / 交通 / 清單 / 緊急）
- `data.js` — **所有內容喺呢度**（改行程只需改呢個 file）
- `app.js` — render + 互動（匯率機、packing、字體掣、tap-to-call）
- `style.css` — 和紙手帳設計系統
- `sw.js` + `manifest.json` — PWA 離線 + 安裝
- `assets/icons/` — 朱印 app icon

## 改內容 → 重新部署
1. 改 `data.js`（例：訂咗回程機就更新交通段）。
2. 改完 push 自動重新部署：
   ```bash
   cd site && git add -A && git commit -m "update" && git push
   ```
   GitHub Pages 約 1 分鐘自動 rebuild。
3. （可選）重出 PDF / 單檔 HTML：
   ```bash
   node ../build-standalone.mjs
   # PDF：用 chrome-headless-shell 印 index.html?print=1
   ```

> 改咗 `data.js`/`app.js`/`style.css` 後，如果 iPhone 開到舊版，係 Service Worker cache —
> 改 `sw.js` 第一行 `CACHE` 版本號（v1→v2）再 push，就會強制更新。
