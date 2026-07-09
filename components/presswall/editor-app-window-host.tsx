"use client";

import { useEffect } from "react";
import {
  EDITOR_APP_WINDOW_CLOSED_EVENT,
  EDITOR_APP_WINDOW_ID,
} from "@/lib/editor-app-window";

/**
 * Hosts Shopify App Bridge `<s-app-window>` so the editor can open as a
 * fullscreen admin overlay (covers the whole screen with Shopify exit chrome).
 *
 * `src` is set when opening via `openEditorAppWindow()` so shop/host/session
 * query params match the current embedded context.
 */
export function EditorAppWindowHost() {
  useEffect(() => {
    const element = document.getElementById(EDITOR_APP_WINDOW_ID);
    if (!element) {
      return;
    }

    const onHide = () => {
      window.dispatchEvent(new CustomEvent(EDITOR_APP_WINDOW_CLOSED_EVENT));
    };

    element.addEventListener("hide", onHide);
    return () => {
      element.removeEventListener("hide", onHide);
    };
  }, []);

  return <s-app-window id={EDITOR_APP_WINDOW_ID} src="/editor" />;
}
