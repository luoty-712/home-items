/**
 * 生成 dist/ 部署包：node build.js
 *
 * 源文件 index.html 保持单文件（双击即用），部署包在此基础上加：
 *   manifest.webmanifest  可"添加到主屏幕"
 *   sw.js                 断网也能打开（network-first，改了代码刷新就生效）
 *   icon-*.png            PWA / iOS 图标
 *   _headers, netlify.toml 缓存与安全头
 *
 * 改完 index.html 后重跑一次即可。
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
fs.mkdirSync(DIST, { recursive: true });

const HEAD_INJECT = `
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="description" content="拍照即建档，搜名字秒出位置，临期自动提醒——给家里每件小东西建个档。">
<meta property="og:title" content="收纳 · 居家物品智能收纳管理助手">
<meta property="og:description" content="拍照即建档，搜名字秒出位置，临期自动提醒。">
<meta property="og:type" content="website">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="收纳">
`;

const SW_REGISTER = `
<script>
/* 只在 http/https 下注册；file:// 双击打开时这段不生效，也不影响使用 */
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
</script>
`;

const MANIFEST = {
  name: "收纳 · 居家物品智能收纳管理助手",
  short_name: "收纳",
  description: "拍照即建档，搜名字秒出位置，临期自动提醒。",
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "portrait",
  background_color: "#F7F3EA",
  theme_color: "#2E5C4F",
  lang: "zh-CN",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

const SW = `const CACHE = "home-items-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});`;

const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(self)

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=3600

/*.png
  Cache-Control: public, max-age=604800
`;

let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
if (!html.includes("manifest.webmanifest")) html = html.replace("</title>", "</title>" + HEAD_INJECT);
if (!html.includes("navigator.serviceWorker.register")) html = html.replace("</body>", SW_REGISTER + "</body>");

fs.writeFileSync(path.join(DIST, "index.html"), html);
fs.writeFileSync(path.join(DIST, "manifest.webmanifest"), JSON.stringify(MANIFEST, null, 2));
fs.writeFileSync(path.join(DIST, "sw.js"), SW);
fs.writeFileSync(path.join(DIST, "_headers"), HEADERS);
fs.writeFileSync(path.join(DIST, "netlify.toml"),
  `[build]\n  publish = "."\n\n[[headers]]\n  for = "/index.html"\n  [headers.values]\n    Cache-Control = "public, max-age=0, must-revalidate"\n`);

for (const f of ["icon-192.png", "icon-512.png", "apple-touch-icon.png"]) {
  fs.copyFileSync(path.join(ROOT, "assets", f), path.join(DIST, f));
}

console.log("dist/ 已生成：");
for (const f of fs.readdirSync(DIST).sort()) {
  console.log("  " + f.padEnd(22) + Math.round(fs.statSync(path.join(DIST, f)).size / 1024 * 10) / 10 + " KB");
}
