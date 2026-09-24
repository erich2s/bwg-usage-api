// stash 磁贴脚本
const API = $argument;

if (!API) {
  $done({
    title: "BWG · 配置错误",
    content: "未配置 API URL",
    icon: "exclamationmark.triangle.fill",
    backgroundColor: "#FF3B30",
  });
  return;
}

$httpClient.get(API, (error, response, data) => {
  if (error) {
    showError("网络请求失败");
    return;
  }

  if (!response || response.status !== 200) {
    showError(`HTTP ${response?.status ?? "Error"}`);
    return;
  }

  try {
    const json = JSON.parse(data);

    if (json.error !== 0) {
      showError(`API Error ${json.error}`);
      return;
    }

    const used = Number(json.data_counter);
    const total = Number(json.plan_monthly_data) * Number(json.monthly_data_multiplier ?? 1);

    if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
      showError("流量数据异常");
      return;
    }

    const remaining = Math.max(total - used, 0);
    const percent = Math.min((used / total) * 100, 100);

    // 根据流量使用率改变 Tile 颜色
    let backgroundColor = "#007AFF";
    let icon = "network";

    if (percent >= 90) {
      backgroundColor = "#FF3B30";
      icon = "exclamationmark.triangle.fill";
    } else if (percent >= 70) {
      backgroundColor = "#FF9500";
      icon = "network";
    }

    const reset = formatResetDate(json.data_next_reset);

    $done({
      title: `BWG · ${formatGB(used)} / ${formatGB(total)} · ${percent.toFixed(0)}%`,
      content: `剩余 ${formatGB(remaining)}` + (reset ? ` · ${reset} 重置` : ""),
      icon,
      backgroundColor,
    });
  } catch (error) {
    showError("数据解析失败");
  }
});

function formatGB(bytes) {
  const gb = bytes / 1024 ** 3;

  // 1000 GB 这种整数不显示小数
  if (Math.abs(gb - Math.round(gb)) < 0.01) {
    return `${Math.round(gb)} GB`;
  }

  return `${gb.toFixed(1)} GB`;
}

function formatResetDate(timestamp) {
  if (!timestamp) return null;

  const date = new Date(timestamp * 1000);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}/${day}`;
}

function showError(message) {
  $done({
    title: "BWG · 获取失败",
    content: message,
    icon: "exclamationmark.triangle.fill",
    backgroundColor: "#FF3B30",
  });
}
