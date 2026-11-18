/* 极简静态服务器：让页面跑在 http://localhost 上，浏览器才允许实时取景（getUserMedia）
   用法：双击「启动-实时取景版.cmd」，或在命令行执行 node serve.js */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = __dirname;
const BASE_PORT = 8848;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 not found");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});

function listen(port, triesLeft) {
  server.once("error", err => {
    if (err.code === "EADDRINUSE" && triesLeft > 0) {
      listen(port + 1, triesLeft - 1);
    } else {
      console.error("启动失败：" + err.message);
      process.exit(1);
    }
  });
  server.listen(port, "127.0.0.1", () => {
    const url = `http://localhost:${port}/index.html`;
    console.log("");
    console.log("  收纳助手已启动：" + url);
    console.log("  这个窗口保持打开，关掉即停止服务。");
    console.log("");
    const open = process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`;
    exec(open, () => {});
  });
}

listen(BASE_PORT, 5);
