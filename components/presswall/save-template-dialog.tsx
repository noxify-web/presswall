"use client";

import { IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminFetch } from "@/lib/admin-fetch";
import type {
  PresswallConfig,
  ShopPublisherSelection,
} from "@/lib/presswall-types";

interface SaveTemplateDialogProps {
  config: PresswallConfig;
  onOpenChange: (open: boolean) => void;
  onSaved: (name: string) => void;
  open: boolean;
  selections: ShopPublisherSelection[];
  showPlacementHint?: boolean;
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  config,
  onSaved,
  selections,
  showPlacementHint = false,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Enter a banner name");
      return;
    }

    setIsSaving(true);

    try {
      const response = await adminFetch("/api/banners", {
        method: "POST",
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || undefined,
          config,
          selections,
        }),
      });

      if (response.status === 409) {
        toast.error("A banner with this name already exists");
        return;
      }

      if (!response.ok) {
        toast.error("Could not save banner");
        return;
      }

      toast.success("Banner saved");
      onSaved(trimmedName);
      handleOpenChange(false);
    } catch {
      toast.error("Could not save banner");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save banner</DialogTitle>
          <DialogDescription>
            {showPlacementHint
              ? "Save your design as a banner you can reload from Templates. Use the By page tab to choose where this banner appears on your store."
              : "Save your design as a banner you can reload from Templates later in the editor."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="banner-name">Banner name</Label>
            <Input
              autoFocus
              id="banner-name"
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="My press strip"
              value={name}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="banner-description"
              maxLength={240}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note about when to use this look."
              rows={3}
              value={description}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={handleSave} type="button">
            <IconDeviceFloppy stroke={2} />
            {isSaving ? "Saving..." : "Save banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
