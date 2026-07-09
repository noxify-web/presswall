import { afterEach, describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { assertPresswallAppNavContract } from "@/lib/presswall-app-nav-contract";

mock.module("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function mountGlobalStyles() {
  const styleId = "presswall-test-globals";
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = readFileSync(
    join(import.meta.dir, "../../app/globals.css"),
    "utf8"
  );
  document.head.append(style);
}

const { PresswallAppNav } = await import("./app-nav");

describe("PresswallAppNav", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders App Bridge nav contract Shopify admin discovers automatically", () => {
    mountGlobalStyles();

    const view = render(<PresswallAppNav />);

    assertPresswallAppNavContract(view.container, {
      home: "/",
      editor: "/editor",
    });

    const host = view.container.querySelector(
      ".presswall-app-nav-host"
    ) as HTMLElement;
    expect(window.getComputedStyle(host).display).toBe("none");
  });
});
