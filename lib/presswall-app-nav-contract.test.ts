import { describe, expect, test } from "bun:test";
import {
  assertPresswallAppNavContract,
  getPresswallAppNavLinks,
} from "@/lib/presswall-app-nav-contract";

describe("presswall app nav contract", () => {
  test("declares Home only as the visible sidebar sub-page", () => {
    const paths = {
      home: "/",
    };

    expect(getPresswallAppNavLinks(paths)).toEqual([
      { href: paths.home, label: "Home" },
    ]);
  });

  test("assertPresswallAppNavContract validates bridge-discoverable nav DOM", () => {
    const previousHtml = document.body.innerHTML;
    document.body.innerHTML = `
      <div aria-hidden="true" class="presswall-app-nav-host">
        <s-app-nav>
          <a href="/">Home</a>
        </s-app-nav>
      </div>
    `;

    try {
      expect(() =>
        assertPresswallAppNavContract(document.body, {
          home: "/",
        })
      ).not.toThrow();
    } finally {
      document.body.innerHTML = previousHtml;
    }
  });
});
