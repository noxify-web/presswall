"use client";

import { useEffect } from "react";
import {
  EDITOR_APP_WINDOW_CLOSED_EVENT,
  EDITOR_APP_WINDOW_ID,
} from "@/lib/editor-app-window";
import {
  EDITOR_SAVE_BAR_MESSAGE,
  ensureEditorSaveBarElement,
  isEditorSaveBarMessage,
  syncEditorSaveBar,
} from "@/lib/editor-save-bar";

/**
 * Hosts Shopify App Bridge s-app-window and mounts ui-save-bar on the parent
 * page imperatively (not via React JSX), so App Bridge never sees a React
 * class attribute.
 *
 * Dirty state is controlled from the editor iframe via shopify.saveBar and
 * postMessage; Save/Discard on the bar postMessage back into the iframe.
 */
export function EditorAppWindowHost() {
  useEffect(() => {
    const element = document.getElementById(EDITOR_APP_WINDOW_ID);
    if (!element) {
      return;
    }

    const onHide = () => {
      syncEditorSaveBar(false).catch(() => undefined);
      window.dispatchEvent(new CustomEvent(EDITOR_APP_WINDOW_CLOSED_EVENT));
    };

    element.addEventListener("hide", onHide);
    return () => {
      element.removeEventListener("hide", onHide);
    };
  }, []);

  useEffect(() => {
    const postToEditor = (type: string) => {
      const appWindow = document.getElementById(EDITOR_APP_WINDOW_ID) as
        | (HTMLElement & { contentWindow?: Window | null })
        | null;
      const target = appWindow?.contentWindow;
      if (!target) {
        return;
      }

      target.postMessage({ type }, window.location.origin);
    };

    const disposeSaveBar = ensureEditorSaveBarElement({
      onSave: () => {
        postToEditor(EDITOR_SAVE_BAR_MESSAGE.save);
      },
      onDiscard: () => {
        postToEditor(EDITOR_SAVE_BAR_MESSAGE.discard);
      },
    });

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (!isEditorSaveBarMessage(event.data)) {
        return;
      }

      if (event.data.type === EDITOR_SAVE_BAR_MESSAGE.dirty) {
        const dirty = (event.data as { dirty?: unknown }).dirty === true;
        syncEditorSaveBar(dirty).catch(() => undefined);
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      disposeSaveBar();
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return <s-app-window id={EDITOR_APP_WINDOW_ID} src="/editor" />;
}
