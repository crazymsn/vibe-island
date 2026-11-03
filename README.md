# Vibe Island 产品介绍

Vibe Island 是一款面向 macOS 的 AI Agent 统一管理工具，通过集成 Claude Code、Codex、Gemini CLI、OpenCode 等 30 余种 AI 编程 Agent，将多个 Agent 的运行状态、任务进度、执行日志、权限审批、问题交互及模型使用额度集中展示在 MacBook 刘海（Dynamic Island）区域。支持一键跳转对应终端会话、实时接收任务通知、审批 Agent 操作、SSH 远程管理等功能，旨在降低多 Agent 并行开发时的监控与交互成本，实现轻量化、非侵入式的 AI Agent 统一管理。

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
