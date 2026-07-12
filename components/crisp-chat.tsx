"use client";

import { ChatboxColors, ChatboxPosition, Crisp } from "crisp-sdk-web";
import { useEffect } from "react";

import { applyCrispDesktopPanel, configureCrispChat } from "@/lib/crisp-config";

function currentViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

let enforceRaf = 0;

/**
 * Keep chat as a bottom-right desktop panel above the launcher.
 * Bubble and X stay in Crisp’s default corner (no top-right close override).
 */
function enforceDesktopChatUi() {
  if (enforceRaf !== 0) {
    return;
  }
  enforceRaf = window.requestAnimationFrame(() => {
    enforceRaf = 0;
    applyCrispDesktopPanel(document, currentViewport());
  });
}

/**
 * Loads Crisp free website chatbox on admin pages when
 * NEXT_PUBLIC_CRISP_WEBSITE_ID is set. No-op when unset.
 */
export function CrispChat() {
  useEffect(() => {
    const enabled = configureCrispChat(
      {
        configure: (websiteId) => {
          Crisp.configure(websiteId);
        },
        setColorTheme: () => {
          Crisp.setColorTheme(ChatboxColors.Black);
        },
        setPositionReverse: (reversed) => {
          // SDK: Right = not reversed; also push config for runtime.
          Crisp.setPosition(
            reversed ? ChatboxPosition.Left : ChatboxPosition.Right
          );
          window.$crisp = window.$crisp ?? [];
          window.$crisp.push(["config", "position:reverse", [reversed]]);
        },
        setAvailabilityTooltip: (enabledTooltip) => {
          Crisp.setAvailabilityTooltip(enabledTooltip);
          window.$crisp = window.$crisp ?? [];
          window.$crisp.push([
            "config",
            "availability:tooltip",
            [enabledTooltip],
          ]);
        },
        toggleOperatorCount: (enabledCount) => {
          Crisp.toggleOperatorCount(enabledCount);
          window.$crisp = window.$crisp ?? [];
          window.$crisp.push(["config", "show:operator:count", [enabledCount]]);
        },
      },
      process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
    );
    if (!enabled) {
      return;
    }

    window.$crisp = window.$crisp ?? [];
    // Belt-and-suspenders: always right, never reverse.
    window.$crisp.push(["config", "position:reverse", [false]]);
    window.$crisp.push(["on", "chat:opened", enforceDesktopChatUi]);
    window.$crisp.push(["on", "chat:closed", enforceDesktopChatUi]);
    window.$crisp.push(["on", "session:loaded", enforceDesktopChatUi]);

    window.addEventListener("resize", enforceDesktopChatUi);

    let panelObserver: MutationObserver | null = null;
    const attachPanelObserver = (client: Element) => {
      panelObserver?.disconnect();
      panelObserver = new MutationObserver(() => {
        enforceDesktopChatUi();
      });
      panelObserver.observe(client, {
        subtree: true,
        attributes: true,
        attributeFilter: [
          "style",
          "data-full-view",
          "data-position-reverse",
          "data-maximized",
          "data-small-view",
        ],
      });
      enforceDesktopChatUi();
    };

    const bootObserver = new MutationObserver(() => {
      const client = document.querySelector(".crisp-client");
      if (!client) {
        return;
      }
      bootObserver.disconnect();
      attachPanelObserver(client);
    });
    bootObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const existing = document.querySelector(".crisp-client");
    if (existing) {
      bootObserver.disconnect();
      attachPanelObserver(existing);
    }

    return () => {
      window.removeEventListener("resize", enforceDesktopChatUi);
      bootObserver.disconnect();
      panelObserver?.disconnect();
      window.$crisp?.push?.(["off", "chat:opened"]);
      window.$crisp?.push?.(["off", "chat:closed"]);
      window.$crisp?.push?.(["off", "session:loaded"]);
    };
  }, []);

  return null;
}
