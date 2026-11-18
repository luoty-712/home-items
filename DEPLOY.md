# 上传 / 部署说明

这个项目是纯静态单页，**没有后端、没有数据库**，传到任何静态托管都能跑。

`dist/` 是上传用的目录，由 `node build.js` 从 `index.html` 生成（每改一次源码都要重跑一次）。

## 传上去之后会多出三样东西

| 能力 | 为什么本地没有 | 上传后 |
| --- | --- | --- |
| 网页内实时取景 | `getUserMedia` 只在 https / localhost 下开放 | https 站点直接可用，不用再跑 `启动-实时取景版.cmd` |
| 添加到主屏幕 | 需要 manifest + 图标 | 手机上像 App 一样打开，独立窗口、无地址栏 |
| 断网可打开 | 需要 service worker | 打开过一次后，断网也能进（数据本来就在本机） |

## 三条路线

### 1. Netlify Drop：最快，30 秒

1. 打开 <https://app.netlify.com/drop>
2. 把 **`dist` 文件夹整个拖进窗口**（不是拖 `index.html`）
3. 等 10 秒，得到一个 `https://随机名.netlify.app` 链接
4. 想保留这个地址就注册（免费），在 Site settings 里能改成 `home-items.netlify.app` 这种

不注册也能用，但链接几天后会被回收。答辩前建议注册并固定下来。

### 2. Vercel：同样免费，国内速度通常略好

```bash
npm i -g vercel
cd dist
vercel --prod
```

按提示登录（GitHub 账号最快），一路回车，最后给一个 `https://xxx.vercel.app`。

### 3. GitHub Pages：仓库已经初始化好了，推上去就行

本地已经 `git init` 并提交过第一个版本，`.github/workflows/pages.yml` 会在每次 push 时自动构建并发布。

**第一步**，在 GitHub 网页建一个空仓库：

- 名字建议 `home-items`（网址会变成 `https://你的用户名.github.io/home-items/`）
- 选 **Public**
- **不要**勾选 "Add a README / .gitignore / license"，保持空仓库

**第二步**，在本目录执行（把用户名和仓库名换成你的）：

```bash
git remote add origin https://github.com/你的用户名/home-items.git
git push -u origin main
```

首次 push 会弹出 GitHub 登录窗口（Git Credential Manager），浏览器点授权即可，不用手动生成 token。

**第三步**，去仓库 `Settings → Pages → Build and deployment → Source`，选 **GitHub Actions**。

**第四步**，等 1 分钟，仓库的 Actions 标签页会跑完一次部署，地址显示为：

```
https://你的用户名.github.io/home-items/
```

之后每次 `git add . && git commit -m "改了什么" && git push`，网站会自动更新，不用再手动构建。

> 想要国内访问稳定、还能绑自己的域名，就得用阿里云 OSS / 腾讯云 COS 或云服务器，自定义域名需要备案。答辩前时间紧，不建议现弄。

## 上传后必须知道的四件事

1. **数据是按网址分开存的。** 浏览器把 IndexedDB 按域名隔离，`netlify.app` 上的 24 条数据，和你在本地 `file://` 打开的那份，是两套互不相通的数据。换地址 = 空数据。
   - 迁移办法：旧地址「我的 → 导出备份」存 JSON，新地址「我的 → 导入备份」选这个文件。
2. **第一次打开会新建一份示例数据**，包括那条带照片的方便面。想从头开始就点「清空全部数据」。
3. **改了代码要重新构建再传。** 流程是：改 `index.html` → `node build.js` → 重新拖 `dist`。
4. **手机上用实时取景要授权摄像头。** 第一次点「拍照」会弹权限，选允许。iOS Safari 还需要页面在前台、且是 https（正好满足）。

## 演示现场建议

- 提前一天把链接在自己手机上打开一次，让 service worker 缓存住（现场网络差也能开）
- 答辩电脑上用浏览器直接开链接，别用 file://，这样「拍照」能直接调摄像头
- 万一现场断网：手机热点 + 已缓存的页面仍然能演示增删改查

## 目录

```
index.html          源文件，单文件、双击即用（本地演示用这个）
build.js            生成 dist/
assets/             图标源文件（192 / 512 / iOS）
dist/               上传用，整个文件夹拖给托管平台
```
