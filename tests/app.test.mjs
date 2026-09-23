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
    return new Response('{"error":0,"data_counter":123}', {
      headers: { "Content-Type": "application/json" },
    });
  };

  const response = await app.request("/?sub_token=test-token");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { error: 0, data_counter: 123 });
});
