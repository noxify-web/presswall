import { describe, expect, test } from "bun:test";
import {
  formatProductAssignmentTarget,
  normalizeProductId,
  parseBannerPageContext,
} from "@/lib/banner-page-context";

describe("parseBannerPageContext", () => {
  test("parses homepage from page_type", () => {
    const context = parseBannerPageContext(
      new URLSearchParams("page_type=homepage")
    );

    expect(context).toEqual({ pageType: "homepage" });
  });

  test("parses product context with numeric id", () => {
    const context = parseBannerPageContext(
      new URLSearchParams("page_type=product&product_id=12345")
    );

    expect(context).toEqual({ pageType: "product", productId: "12345" });
  });

  test("parses product gid into numeric id", () => {
    expect(normalizeProductId("gid://shopify/Product/98765")).toBe("98765");
    expect(formatProductAssignmentTarget("gid://shopify/Product/98765")).toBe(
      "product:98765"
    );
  });
});
