/// <reference types="@shopify/app-bridge-types" />

export {};

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
    };
  }
}
