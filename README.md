# Vibe Island

Free, open-source website for Vibe Island, the "Dynamic Island for your AI agents".
Zero-dependency static site (HTML, CSS, vanilla JS), served by an unprivileged nginx container.

- GitHub: <https://github.com/crazymsn/vibe-island>
- Docker Hub: `crazymsn/vibe-island:latest`

## 快速开始

### Docker Compose（推荐）

```bash
git clone https://github.com/crazymsn/vibe-island.git
cd vibe-island
docker compose up -d
```

打开 <http://localhost:8080>。

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `VIBE_ISLAND_PORT` | `8080` | 宿主机端口 |
| `VIBE_ISLAND_BIND` | `0.0.0.0` | 监听地址。放在反向代理后面时设为 `127.0.0.1` |

```bash
# 例：只监听本机的 3000 端口
VIBE_ISLAND_BIND=127.0.0.1 VIBE_ISLAND_PORT=3000 docker compose up -d
```

`docker-compose.yml` 默认拉取 `crazymsn/vibe-island:latest`。想用本地代码构建：`docker compose up -d --build`。

### 直接用镜像

```bash
docker run -d --name vibe-island -p 8080:8080 --read-only --tmpfs /tmp crazymsn/vibe-island:latest
```

### 不用 Docker

它是纯静态站，直接打开 `index.html`，或者：

```bash
python -m http.server 8080
```

## 下载文件

站内所有"Download"按钮都指向 `downloads/Vibe_Island_Design_by_DeepCloud.iso`，由 nginx 以附件形式提供，支持断点续传。

```
SHA-256  e8e53ac8e2e0f3347683ae41e8e6c303423931423f28d45ab1b58648d5e6090c
```

**更换下载文件时**，替换 `downloads/` 里的文件后，同步更新以下三处的文件名和 SHA-256：

- `index.html`（下载链接、安装卡片）
- `assets/js/main.js`（`SHA256` 常量）
- `assets/js/i18n.js`（`install.iso` 中文文案）

## 构建并推送镜像

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t crazymsn/vibe-island:latest --push .
```

镜像基于 `nginxinc/nginx-unprivileged`：以非 root（uid 101）运行，监听 8080，带 `/healthz` 健康检查。
Compose 里还启用了只读根文件系统、`cap_drop: ALL` 和 `no-new-privileges`。

## 目录结构

```
index.html              页面
assets/css/style.css    样式
assets/js/main.js       演示时间线、语言切换、安装卡片
assets/js/i18n.js       简体中文文案（英文是页面默认）
assets/fonts/           字体及其 OFL 许可证
assets/img/             图标
downloads/              站点提供下载的文件
nginx/                  nginx 配置与安全响应头
Dockerfile, docker-compose.yml
```

## 字体

均为 SIL Open Font License 1.1，已随仓库打包，许可证在 `assets/fonts/`：
Departure Mono（品牌字）、Geist Pixel Square（标题）、JetBrains Mono（代码）、Instrument Serif（页脚）。

## 致谢

视觉风格参考 [vibeisland.app](https://vibeisland.app/)。

## 许可证

Apache License 2.0，见 [LICENSE](LICENSE)。
