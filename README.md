# BWG Usage API

一个基于 Hono 的轻量接口，用于获取搬瓦工（BandwagonHost）VPS 的服务与流量信息。访问者提供 `sub_token` 后，服务端使用配置的 `VEID` 和 `API Key` 请求 KiwiVM 的 `getServiceInfo`，并直接返回原始响应。

## 部署

克隆仓库后，确保已配置好`Docker`环境，然后配置文件并填写 `BWG_VEID`、`BWG_API_KEY` 和 `SUB_TOKEN`：

```sh
cp .env.example .env
# 使用 docker compose 部署
docker compose up -d
```

### 使用示例

假设 `.env` 中设置了 `SUB_TOKEN=example-token`，启动后请求：

```sh
curl 'http://localhost:3000/?sub_token=example-token'
```

接口直接返回 KiwiVM 的 `getServiceInfo` 响应；令牌缺失或错误时返回 `401`。远程部署时，将 `localhost` 换成服务器地址。

## 开发命令

```sh
pnpm install
pnpm dev
```

## 其他命令

```sh
pnpm test    # 运行测试
pnpm check   # 修复 lint 问题并格式化代码
```
