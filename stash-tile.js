const apiUrl = $argument?.trim();
const tile = {
  title: "数据用量",
  icon: "network",
  backgroundColor: "#F02D55",
};

const finish = (content) => $done({ ...tile, content });
const formatGB = (bytes) => `${(bytes / 1024 ** 3).toFixed(2)} GB`;

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
  $httpClient.get(apiUrl, (error, response, data) => {
    if (error) {
      finish("获取流量失败");
      return;
    }

    const status = response?.status ?? response?.statusCode;
    if (status !== 200) {
      finish(`HTTP ${status ?? "Unknown"}`);
      return;
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch {
      finish("数据解析失败");
      return;
    }

    if (json?.error !== 0) {
      finish(`API Error ${json?.error}`);
      return;
    }

    const used = Number(json.data_counter);
    const multiplier = Number(json.monthly_data_multiplier);
    const total = Number(json.plan_monthly_data) * (multiplier > 0 ? multiplier : 1);

    if (!Number.isFinite(used) || !Number.isFinite(total) || used < 0 || total <= 0) {
      finish("流量数据异常");
      return;
    }

    const reset = formatResetDate(json.data_next_reset);
    const content = [`${formatGB(used)}/${formatGB(total)}`, reset && `${reset} 重置`]
      .filter(Boolean)
      .join("\n");

    finish(content);
  });
}
