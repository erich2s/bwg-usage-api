var API = $argument;

function showError(message) {
  $done({
    title: "BWG",
    content: message,
    icon: "network",
    backgroundColor: "#F02D55",
  });
}

function formatGB(bytes) {
  var gb = bytes / 1024 / 1024 / 1024;

  return gb.toFixed(2) + " GB";
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
      showError("获取流量失败");
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
      var total = Number(json.plan_monthly_data);
      var multiplier = Number(json.monthly_data_multiplier);

      if (!multiplier || multiplier <= 0) {
        multiplier = 1;
      }

      total = total * multiplier;

      if (!isFinite(used) || !isFinite(total) || used < 0 || total <= 0) {
        showError("流量数据异常");
        return;
      }

      var reset = formatResetDate(json.data_next_reset);

      var content = formatGB(used) + "\n" + formatGB(total);

      if (reset) {
        content += "\n" + reset + " 重置";
      }

      $done({
        title: "BWG",
        content: content,
        icon: "network",
        backgroundColor: "#F02D55",
      });
    } catch {
      showError("数据解析失败");
    }
  });
}
