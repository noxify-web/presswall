/// <reference types="@shopify/app-bridge-types" />

import type {
  SAppNavAttributes,
  SAppNavLinkAttributes,
} from "@shopify/app-bridge-types";

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      resourcePicker?: (options: {
        type: "product";
        multiple?: boolean;
        action?: "select";
      }) => Promise<
        Array<{
          id: string | number;
          title?: string;
        }>
      >;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      "s-app-nav": SAppNavAttributes;
      "s-link": SAppNavLinkAttributes;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "s-app-nav": SAppNavAttributes;
      "s-link": SAppNavLinkAttributes;
    }
  }
}
