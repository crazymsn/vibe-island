# Vibe Island

免费开源的 AI 编程代理灵动岛官网。纯静态页面，nginx 部署。

## 部署

```bash
git clone https://github.com/crazymsn/vibe-island.git
cd vibe-island
docker compose up -d
```

访问 `http://服务器IP:7080`。

镜像：`crazymsn/vibe-island:latest`（amd64 / arm64）

### 云服务器

- 安全组 / 防火墙放行 TCP `7080`。
- 前面有 Nginx、Caddy 或云负载均衡时，只监听本机：`VIBE_ISLAND_BIND=127.0.0.1 docker compose up -d`
- 端口和镜像标签可在同目录 `.env` 里改：`VIBE_ISLAND_PORT`、`VIBE_ISLAND_TAG`

### 更新

```bash
docker compose pull && docker compose up -d
```

## 联系我们

<img src="docs/contact-qr.png" alt="联系我们二维码" width="160">

## 许可证

Apache-2.0
