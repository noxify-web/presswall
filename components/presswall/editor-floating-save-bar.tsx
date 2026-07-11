"use client";

import { IconInfoCircle, IconLoader2 } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EditorFloatingSaveBarProps {
  isDirty: boolean;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void | Promise<void>;
}

/**
 * Floating save chip — centered over the live-preview column (parent must be
 * `relative`). Does not reserve layout space.
 */
export function EditorFloatingSaveBar({
  isDirty,
  isSaving,
  onDiscard,
  onSave,
}: EditorFloatingSaveBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isDirty) {
    return null;
  }

  const busy = isSaving;

  return (
    <>
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3"
      >
        <section
          aria-label="Unsaved changes"
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-white",
            "px-3 py-2 shadow-lg",
            "fade-in slide-in-from-bottom-2 animate-in duration-200"
          )}
        >
          <div className="flex min-w-0 items-center gap-2 pl-0.5">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-800"
            >
              <IconInfoCircle className="size-4" stroke={2} />
            </span>
            <span className="whitespace-nowrap font-medium text-sm">
              Unsaved changes
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
              size="default"
              type="button"
              variant="outline"
            >
              Discard
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                Promise.resolve(onSave()).catch(() => undefined);
              }}
              size="default"
              type="button"
            >
              {busy ? (
                <IconLoader2 className="size-3.5 animate-spin" stroke={2} />
              ) : null}
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </section>
      </div>

      <Dialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your edits to this press strip will be lost. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setConfirmOpen(false)}
              type="button"
              variant="outline"
            >
              Keep editing
            </Button>
            <Button
              onClick={() => {
                onDiscard();
                setConfirmOpen(false);
              }}
              type="button"
              variant="destructive"
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
