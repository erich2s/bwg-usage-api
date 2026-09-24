const apiUrl = $argument?.trim();
const tile = {
  title: "数据用量",
  icon: "network",
  backgroundColor: "#F02D55",
};

const finish = (content) => $done({ ...tile, content });

const formatGB = (bytes) => `${Number((bytes / 1024 ** 3).toFixed(2))} GB`;
const formatResetDate = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

if (!apiUrl) {
  finish("未配置 API URL");
} else {
  $httpClient.head(apiUrl, (error, response) => {
    if (error) {
      finish("获取流量失败");
      return;
    }

    const status = response?.status ?? response?.statusCode;
    if (status !== 200) {
      finish(`HTTP ${status ?? "Unknown"}`);
      return;
    }

    const usageHeader = Object.entries(response?.headers ?? {}).find(
      ([name]) => name.toLowerCase() === "bwg-usage",
    )?.[1];
    if (!usageHeader) {
      finish("未返回流量数据");
      return;
    }

    let usage;
    try {
      usage = JSON.parse(usageHeader);
    } catch {
      finish("数据解析失败");
      return;
    }

    if (usage === null || typeof usage !== "object" || Array.isArray(usage)) {
      finish("流量数据异常");
      return;
    }

    const used = Number(usage.data_counter);
    const multiplier = Number(usage.monthly_data_multiplier);
    const total = Number(usage.plan_monthly_data) * (multiplier > 0 ? multiplier : 1);

    if (!Number.isFinite(used) || !Number.isFinite(total) || used < 0 || total <= 0) {
      finish("流量数据异常");
      return;
    }

    const reset = formatResetDate(usage.data_next_reset);
    const content = [`${formatGB(used)}/${formatGB(total)}`, reset && `${reset} 重置`]
      .filter(Boolean)
      .join("\n");

    finish(content);
  });
}
