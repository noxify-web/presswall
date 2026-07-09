import { describe, expect, test } from "bun:test";
import {
  APP_WINDOW_QUERY_PARAM,
  APP_WINDOW_QUERY_VALUE,
  buildEditorAppWindowSrc,
  isAppWindowRequest,
} from "@/lib/editor-app-window";

describe("editor app window helpers", () => {
  test("buildEditorAppWindowSrc preserves shop/host and tags appWindow", () => {
    const src = buildEditorAppWindowSrc(
      "?shop=demo.myshopify.com&host=abc&id_token=stale"
    );

    const url = new URL(src, "https://presswall.example");
    expect(url.pathname).toBe("/editor");
    expect(url.searchParams.get("shop")).toBe("demo.myshopify.com");
    expect(url.searchParams.get("host")).toBe("abc");
    expect(url.searchParams.get(APP_WINDOW_QUERY_PARAM)).toBe(
      APP_WINDOW_QUERY_VALUE
    );
    expect(url.searchParams.has("id_token")).toBe(false);
  });

  test("isAppWindowRequest detects the fullscreen content flag", () => {
    expect(isAppWindowRequest("?appWindow=1&shop=x")).toBe(true);
    expect(isAppWindowRequest("?shop=x")).toBe(false);
    expect(isAppWindowRequest({ appWindow: "1" })).toBe(true);
    expect(isAppWindowRequest(new URLSearchParams("appWindow=1"))).toBe(true);
  });
});
