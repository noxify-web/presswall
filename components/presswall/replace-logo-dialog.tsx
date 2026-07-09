"use client";

import { IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { CustomOutletForm } from "@/components/presswall/custom-outlet-form";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopCustomLogo,
} from "@/lib/presswall-types";
import { cn } from "@/lib/utils";

type PendingPick =
  | { kind: "publisher"; publisher: PublisherCatalogItem }
  | { kind: "custom"; logo: ShopCustomLogo };

type DialogTab = "library" | "yours" | "upload";

interface ReplaceLogoDialogProps {
  catalog: PublisherCatalogItem[];
  colorMode: PresswallConfig["colorMode"];
  currentLabel: string;
  customLogos: ShopCustomLogo[];
  onOpenChange: (open: boolean) => void;
  onSelectCustom: (logo: ShopCustomLogo) => void;
  onSelectPublisher: (publisher: PublisherCatalogItem) => void;
  /** Add to library only (does not append to the strip). */
  onUploadCustom: (name: string, svg: string) => Promise<ShopCustomLogo | null>;
  open: boolean;
}

export function ReplaceLogoDialog({
  open,
  onOpenChange,
  catalog,
  customLogos,
  colorMode,
  currentLabel,
  onSelectPublisher,
  onSelectCustom,
  onUploadCustom,
}: ReplaceLogoDialogProps) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingPick | null>(null);
  const [tab, setTab] = useState<DialogTab>("library");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setPending(null);
      setTab("library");
    }
  }, [open]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return catalog;
    }
    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [catalog, search]);

  const filteredCustom = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return customLogos;
    }
    return customLogos.filter((logo) =>
      logo.name.toLowerCase().includes(query)
    );
  }, [customLogos, search]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (!pending) {
      return;
    }
    if (pending.kind === "publisher") {
      onSelectPublisher(pending.publisher);
    } else {
      onSelectCustom(pending.logo);
    }
    handleOpenChange(false);
  };

  const handleUpload = async (name: string, svg: string) => {
    const logo = await onUploadCustom(name, svg);
    if (!logo) {
      return;
    }
    setPending({ kind: "custom", logo });
    setTab("yours");
  };

  const whiteOnDark = colorMode === "white";
  let pendingId: string | null = null;
  if (pending?.kind === "publisher") {
    pendingId = pending.publisher.id;
  } else if (pending?.kind === "custom") {
    pendingId = pending.logo.id;
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="flex max-h-[min(40rem,90vh)] max-w-lg flex-col gap-0 overflow-hidden bg-white p-0 text-foreground shadow-lg"
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b bg-white px-4 py-3">
          <DialogTitle>Change logo</DialogTitle>
          <DialogDescription>
            Pick a replacement for{" "}
            <span className="font-medium text-foreground">{currentLabel}</span>,
            then confirm with Change.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          className="flex min-h-0 flex-1 flex-col"
          onValueChange={(value) => setTab(value as DialogTab)}
          value={tab}
        >
          <div className="shrink-0 space-y-2 border-b bg-white px-4 py-2.5">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-100">
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="yours">
                Your logos
                {customLogos.length > 0 ? (
                  <span className="text-muted-foreground tabular-nums">
                    ({customLogos.length})
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            {tab === "library" || tab === "yours" ? (
              <div className="relative">
                <IconSearch
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  stroke={2}
                />
                <Input
                  autoFocus={tab === "library"}
                  className="h-8 border-zinc-200 bg-white pl-9 text-xs"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    tab === "yours"
                      ? "Search your logos..."
                      : "Search outlets..."
                  }
                  type="search"
                  value={search}
                />
              </div>
            ) : null}
          </div>

          <TabsContent
            className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white data-[state=inactive]:hidden"
            value="library"
          >
            <div className="p-4">
              {filteredCatalog.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-xs">
                  No outlets match your search.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredCatalog.map((publisher) => {
                    const selected = pendingId === publisher.id;
                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(
                          "relative flex h-12 items-center justify-center rounded-md border px-1.5 transition-colors",
                          whiteOnDark
                            ? "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
                          selected &&
                            (whiteOnDark
                              ? "ring-1 ring-neutral-300"
                              : "border-foreground ring-1 ring-foreground/25")
                        )}
                        key={publisher.id}
                        onClick={() =>
                          setPending({ kind: "publisher", publisher })
                        }
                        title={publisher.name}
                        type="button"
                      >
                        <PublisherLogo
                          className="[--logo-height:0.9375rem] [--logo-max-width:5.5rem]"
                          colorMode={colorMode}
                          name={publisher.name}
                          publisherId={publisher.id}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white data-[state=inactive]:hidden"
            value="yours"
          >
            <div className="p-4">
              {filteredCustom.length === 0 ? (
                <div className="space-y-3 py-6 text-center">
                  <p className="text-muted-foreground text-xs">
                    {customLogos.length === 0
                      ? "No custom logos yet. Upload one to use it here."
                      : "No logos match your search."}
                  </p>
                  {customLogos.length === 0 ? (
                    <Button
                      onClick={() => setTab("upload")}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Upload a logo
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredCustom.map((logo) => {
                    const selected = pendingId === logo.id;
                    return (
                      <button
                        aria-pressed={selected}
                        className={cn(
                          "relative flex h-12 items-center justify-center rounded-md border border-zinc-200 bg-white px-1.5 transition-colors",
                          selected
                            ? "border-foreground ring-1 ring-foreground/25"
                            : "hover:border-zinc-300 hover:bg-zinc-50"
                        )}
                        key={logo.id}
                        onClick={() => setPending({ kind: "custom", logo })}
                        title={logo.name}
                        type="button"
                      >
                        <PublisherLogo
                          className="[--logo-height:0.9375rem] [--logo-max-width:5.5rem]"
                          customLogoSvg={logo.logoSvg}
                          name={logo.name}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white data-[state=inactive]:hidden"
            value="upload"
          >
            <div className="p-4">
              <CustomOutletForm compact onAdd={handleUpload} />
              {pending?.kind === "custom" ? (
                <p className="mt-3 text-center text-muted-foreground text-xs">
                  “{pending.logo.name}” is selected — click Change to apply it.
                </p>
              ) : (
                <p className="mt-3 text-center text-muted-foreground text-xs">
                  After upload, confirm with Change to replace the logo on the
                  strip.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex shrink-0 gap-2 border-zinc-200 border-t bg-white px-4 py-3">
          <Button
            className="flex-1 border-zinc-200 bg-white hover:bg-zinc-50"
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!pending}
            onClick={handleConfirm}
            type="button"
          >
            Change
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
