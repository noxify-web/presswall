import { afterEach, describe, expect, test } from "bun:test";
import {
  getAppUrl,
  getPublicAppUrl,
  isEphemeralAppHost,
  PRODUCTION_APP_URL,
} from "@/lib/app-url";

const ORIGINAL_SHOPIFY_APP_URL = process.env.SHOPIFY_APP_URL;
const ORIGINAL_HOST = process.env.HOST;

afterEach(() => {
  if (ORIGINAL_SHOPIFY_APP_URL === undefined) {
    delete process.env.SHOPIFY_APP_URL;
  } else {
    process.env.SHOPIFY_APP_URL = ORIGINAL_SHOPIFY_APP_URL;
  }
  if (ORIGINAL_HOST === undefined) {
    delete process.env.HOST;
  } else {
    process.env.HOST = ORIGINAL_HOST;
  }
});

describe("isEphemeralAppHost", () => {
  test("flags localhost and tunnels", () => {
    expect(isEphemeralAppHost("http://localhost:3000")).toBe(true);
    expect(isEphemeralAppHost("http://127.0.0.1:3001")).toBe(true);
    expect(
      isEphemeralAppHost("https://reissue-irritable-slider.ngrok-free.dev")
    ).toBe(true);
    expect(isEphemeralAppHost("https://abc.trycloudflare.com")).toBe(true);
  });

  test("allows production", () => {
    expect(isEphemeralAppHost(PRODUCTION_APP_URL)).toBe(false);
  });
});

describe("getPublicAppUrl", () => {
  test("returns production when SHOPIFY_APP_URL is a tunnel", () => {
    process.env.SHOPIFY_APP_URL =
      "https://reissue-irritable-slider.ngrok-free.dev";
    expect(getPublicAppUrl()).toBe(PRODUCTION_APP_URL);
  });

  test("returns production when only localhost is configured", () => {
    process.env.SHOPIFY_APP_URL = "http://localhost:3000";
    expect(getPublicAppUrl()).toBe(PRODUCTION_APP_URL);
  });

  test("keeps a stable https production host", () => {
    process.env.SHOPIFY_APP_URL = PRODUCTION_APP_URL;
    expect(getPublicAppUrl()).toBe(PRODUCTION_APP_URL);
  });

  test("getAppUrl still exposes the tunnel for local OAuth", () => {
    process.env.SHOPIFY_APP_URL =
      "https://reissue-irritable-slider.ngrok-free.dev";
    expect(getAppUrl()).toBe(
      "https://reissue-irritable-slider.ngrok-free.dev"
    );
  });
});
