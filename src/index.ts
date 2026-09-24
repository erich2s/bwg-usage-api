import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const app = new Hono();

app.get("/", async (c) => {
  const subToken = c.req.query("sub_token");
  if (!subToken || !process.env.SUB_TOKEN || subToken !== process.env.SUB_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const veid = process.env.BWG_VEID;
  const apiKey = process.env.BWG_API_KEY;
  if (!veid || !apiKey) {
    return c.json({ error: "BWG credentials are not configured" }, 500);
  }

  try {
    const response = await fetch("https://api.64clouds.com/v1/getServiceInfo", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ veid, api_key: apiKey }),
    });

    const body = response.body === null ? null : await response.text();
    let data: unknown;
    let isJson = false;
    try {
      data = JSON.parse(body ?? "");
      isJson = true;
    } catch {
      // Forward non-JSON upstream responses as received.
    }

    const contentType = isJson ? "application/json" : response.headers.get("Content-Type");
    const headers = new Headers();
    if (contentType !== null) headers.set("Content-Type", contentType);

    if (isJson && data !== null && typeof data === "object" && !Array.isArray(data)) {
      const usage: Record<string, number | string> = {};
      for (const name of [
        "data_counter",
        "monthly_data_multiplier",
        "plan_monthly_data",
        "data_next_reset",
      ]) {
        const value = (data as Record<string, unknown>)[name];
        if (typeof value === "number" && Number.isFinite(value)) {
          usage[name] = value;
        } else if (typeof value === "string" && !/[\r\n]/.test(value)) {
          usage[name] = value;
        }
      }
      if (Object.keys(usage).length > 0) {
        headers.set("Bwg-Usage", JSON.stringify(usage));
      }
    }

    const result = new Response(body, {
      status: response.status,
      headers,
    });
    if (contentType === null) result.headers.delete("Content-Type");
    return result;
  } catch {
    return c.json({ error: "Failed to reach BWG API" }, 502);
  }
});

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  serve(
    {
      fetch: app.fetch,
      port: 3000,
    },
    (info) => {
      console.log(`BWG-Usage-API Server is running on http://localhost:${info.port}`);
    },
  );
}
