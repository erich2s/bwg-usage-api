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

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
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
