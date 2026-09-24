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
# 只获取流量信息响应头
curl -I 'http://localhost:3000/?sub_token=example-token'
```

GET 接口返回 KiwiVM 的 `getServiceInfo` 响应；GET 和 HEAD 使用 `Bwg-Usage` 响应头携带流量信息，其值是包含 `data_counter`、`monthly_data_multiplier`、`plan_monthly_data`、`data_next_reset` 的 JSON 对象。仅包含上游 JSON 提供的有效字段，没有有效字段时省略该响应头。例如：

```http
Bwg-Usage: {"data_counter":123,"monthly_data_multiplier":1.5,"plan_monthly_data":456,"data_next_reset":1790812800}
```

HEAD 不返回响应体。令牌缺失或错误时返回 `401`。远程部署时，将 `localhost` 换成服务器地址。

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
