// stash 磁贴脚本
var API = $argument;

function showError(message) {
  $done({
    title: "BWG · 获取失败",
    content: message,
    icon: "exclamationmark.triangle.fill",
    backgroundColor: "#FF3B30"
  });
}

function formatGB(bytes) {
  var gb = bytes / 1073741824;

  if (Math.abs(gb - Math.round(gb)) < 0.01) {
    return Math.round(gb) + " GB";
  }

  return gb.toFixed(1) + " GB";
}

function formatResetDate(timestamp) {
  if (!timestamp) {
    return "";
  }

  var date = new Date(timestamp * 1000);
  var month = date.getMonth() + 1;
  var day = date.getDate();

  if (month < 10) {
    month = "0" + month;
  }

  if (day < 10) {
    day = "0" + day;
  }

  return month + "/" + day;
}

if (!API) {
  showError("未配置 API URL");
} else {
  $httpClient.get(API, function (error, response, data) {
    if (error) {
      showError("网络请求失败");
      return;
    }

    if (!response || response.status !== 200) {
      var status = response ? response.status : "Unknown";
      showError("HTTP " + status);
      return;
    }

    try {
      var json = JSON.parse(data);

      if (json.error !== 0) {
        showError("API Error " + json.error);
        return;
      }

      var used = Number(json.data_counter);
      var multiplier = json.monthly_data_multiplier;

      if (multiplier === undefined || multiplier === null) {
        multiplier = 1;
      }

      var total = Number(json.plan_monthly_data) * Number(multiplier);

      if (
        !isFinite(used) ||
        !isFinite(total) ||
        total <= 0
      ) {
        showError("流量数据异常");
        return;
      }

      var remaining = Math.max(total - used, 0);
      var percent = Math.min((used / total) * 100, 100);

      var backgroundColor = "#007AFF";
      var icon = "network";

      if (percent >= 90) {
        backgroundColor = "#FF3B30";
        icon = "exclamationmark.triangle.fill";
      } else if (percent >= 70) {
        backgroundColor = "#FF9500";
      }

      var reset = formatResetDate(json.data_next_reset);

      var title =
        "BWG · " +
        formatGB(used) +
        " / " +
        formatGB(total) +
        " · " +
        percent.toFixed(0) +
        "%";

      var content = "剩余 " + formatGB(remaining);

      if (reset) {
        content += " · " + reset + " 重置";
      }

      $done({
        title: title,
        content: content,
        icon: icon,
        backgroundColor: backgroundColor
      });
    } catch (e) {
      showError("数据解析失败");
    }
  });
}}
