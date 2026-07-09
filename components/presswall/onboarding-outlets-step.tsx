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
  const selectedCount = editor.selected.length;
  const canContinue = selectedCount > 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-4">
      <header className="shrink-0 space-y-1">
        <p className="text-muted-foreground text-xs">Step 1 of 3</p>
        <h1 className="font-semibold text-base tracking-tight">
          Choose which press logos to show on your store
        </h1>
        <p className="text-muted-foreground text-sm">
          Click logos to add them to your “As seen on” strip. You can change
          this later.
        </p>
      </header>

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
        nextLabel={
          canContinue
            ? `Continue with ${selectedCount} logo${selectedCount === 1 ? "" : "s"}`
            : "Select logos to continue"
        }
        onNext={onNext}
      />
    </div>
  );
}
