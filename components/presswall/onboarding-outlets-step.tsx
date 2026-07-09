"use client";

import { OnboardingActions } from "@/components/presswall/onboarding-actions";
import { OutletLibraryPanel } from "@/components/presswall/outlet-library-panel";
import type { PresswallEditor } from "@/hooks/use-presswall-editor";
import type { PresswallConfig } from "@/lib/presswall-types";

interface OnboardingOutletsStepProps {
  editor: PresswallEditor;
  onNext: () => void;
}

export function OnboardingOutletsStep({
  editor,
  onNext,
}: OnboardingOutletsStepProps) {
  const canContinue = editor.selected.length > 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      <p className="shrink-0 text-muted-foreground text-xs">
        Step 1 of 3 — Add your press logos
      </p>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card p-4 shadow-sm">
        <OutletLibraryPanel
          catalog={editor.catalog}
          colorMode={editor.config.colorMode}
          columns={3}
          customLogos={editor.customLogos}
          onColorModeChange={(value) =>
            editor.updateConfig(
              "colorMode",
              value as PresswallConfig["colorMode"]
            )
          }
          onDeleteCustom={(logoId) => {
            editor.deleteCustomLogo(logoId);
          }}
          onToggle={editor.togglePublisher}
          onToggleCustom={editor.toggleCustomLogo}
          onUploadCustom={editor.uploadCustomLogo}
          selected={editor.selected}
        />
      </div>

      <OnboardingActions
        className="shrink-0 pt-4 pb-6"
        compact
        nextDisabled={!canContinue}
        nextLabel="Next"
        onNext={onNext}
      />
    </div>
  );
}
