"use client";

import { useSearchParams } from "next/navigation";
import { isAppWindowRequest } from "@/lib/editor-app-window";
import { getPresswallAppNavLinks } from "@/lib/presswall-app-nav-contract";
import { getPresswallNavPaths } from "@/lib/presswall-nav-paths";

/**
 * App Bridge sidebar nav (Home only). Hidden when the page is loaded inside
 * App Window (`appWindow=1`) so the fullscreen overlay only shows Shopify's
 * exit chrome. Editor is not a nav item — open it from Home via button.
 */
export function PresswallAppNav() {
  const searchParams = useSearchParams();
  if (isAppWindowRequest(searchParams)) {
    return null;
  }

  const [homeLink] = getPresswallAppNavLinks(getPresswallNavPaths());

  return (
    <div aria-hidden="true" className="presswall-app-nav-host">
      <s-app-nav>
        <a href={homeLink.href}>{homeLink.label}</a>
      </s-app-nav>
    </div>
  );
}
