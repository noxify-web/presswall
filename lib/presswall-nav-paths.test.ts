import { describe, expect, test } from "bun:test";
import { getPresswallNavPaths } from "@/lib/presswall-nav-paths";

describe("getPresswallNavPaths", () => {
  test("returns stable app-relative path for Home sidebar only", () => {
    expect(getPresswallNavPaths()).toEqual({
      home: "/",
    });
  });
});
