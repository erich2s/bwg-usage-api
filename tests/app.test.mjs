import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../dist/index.js";

const originalFetch = globalThis.fetch;
const originalEnv = {
  SUB_TOKEN: process.env.SUB_TOKEN,
  BWG_VEID: process.env.BWG_VEID,
  BWG_API_KEY: process.env.BWG_API_KEY,
};

before(() => {
  process.env.SUB_TOKEN = "test-token";
  process.env.BWG_VEID = "test-veid";
  process.env.BWG_API_KEY = "test-key";
});

after(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("rejects missing and incorrect tokens without calling BWG", async () => {
  globalThis.fetch = () => {
    throw new Error("fetch should not be called");
  };

  for (const path of ["/", "/?sub_token=wrong"]) {
    const response = await app.request(path);
    assert.equal(response.status, 401);
  }
});

test("calls BWG with server credentials after authentication and returns its response", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://api.64clouds.com/v1/getServiceInfo");
    assert.equal(init.method, "POST");
    assert.equal(init.body.get("veid"), "test-veid");
    assert.equal(init.body.get("api_key"), "test-key");
    return new Response(
      '{"error":0,"data_counter":123,"monthly_data_multiplier":1.5,"plan_monthly_data":456,"data_next_reset":1790812800}',
      {
        headers: { "Content-Type": "text/plain" },
      },
    );
  };

  const response = await app.request("/?sub_token=test-token");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(response.headers.get("Bwg-Usage")), {
    data_counter: 123,
    monthly_data_multiplier: 1.5,
    plan_monthly_data: 456,
    data_next_reset: 1790812800,
  });
  for (const name of [
    "data_counter",
    "monthly_data_multiplier",
    "plan_monthly_data",
    "data_next_reset",
  ]) {
    assert.equal(response.headers.get(name), null);
  }
  assert.deepEqual(await response.json(), {
    error: 0,
    data_counter: 123,
    monthly_data_multiplier: 1.5,
    plan_monthly_data: 456,
    data_next_reset: 1790812800,
  });
});

test("HEAD returns the usage JSON header without a body", async () => {
  globalThis.fetch = async () =>
    new Response(
      '{"data_counter":123,"monthly_data_multiplier":1.5,"plan_monthly_data":456,"data_next_reset":1790812800}',
      {
        headers: { "Content-Type": "application/json" },
      },
    );

  const getResponse = await app.request("/?sub_token=test-token");
  const headResponse = await app.request("/?sub_token=test-token", { method: "HEAD" });
  assert.equal(headResponse.status, getResponse.status);
  assert.equal(headResponse.headers.get("Bwg-Usage"), getResponse.headers.get("Bwg-Usage"));
  assert.equal(headResponse.body, null);
});

test("keeps the upstream Content-Type for non-JSON responses", async () => {
  globalThis.fetch = async () =>
    new Response("upstream unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  const response = await app.request("/?sub_token=test-token");
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("Bwg-Usage"), null);
  assert.equal(await response.text(), "upstream unavailable");
});

test("does not invent a Content-Type when the upstream has none", async () => {
  globalThis.fetch = async () => {
    const response = new Response("upstream unavailable");
    response.headers.delete("Content-Type");
    return response;
  };

  const response = await app.request("/?sub_token=test-token");
  assert.equal(response.headers.get("Content-Type"), null);
  assert.equal(await response.text(), "upstream unavailable");
});
