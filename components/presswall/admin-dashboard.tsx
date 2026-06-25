"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/presswall/brand-logo";
import { PresswallPreviewPair } from "@/components/presswall/preview-pair";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { adminFetch } from "@/lib/admin-fetch";
import { LOGO_GUIDANCE } from "@/lib/logo-guidance";
import { DEFAULT_PRESSWALL_CONFIG } from "@/lib/presswall-defaults";
import type {
  PresswallConfig,
  PublisherCatalogItem,
  ShopPublisherSelection,
} from "@/lib/presswall-types";
import { PUBLISHER_CATEGORIES } from "@/lib/publishers-seed";

type SelectedPublisher = {
  key: string;
  publisherId?: string;
  customName?: string;
  customLogoSvg?: string;
  customUrl?: string;
};

function buildSelections(
  selected: SelectedPublisher[]
): ShopPublisherSelection[] {
  return selected.map((item, index) => ({
    publisherId: item.publisherId,
    customName: item.customName,
    customLogoSvg: item.customLogoSvg,
    customUrl: item.customUrl,
    position: index,
  }));
}

function sliderValue(value: number | readonly number[]): number {
  if (typeof value === "number") {
    return value;
  }
  return value[0] ?? 0;
}

export function AdminDashboard() {
  const [catalog, setCatalog] = useState<PublisherCatalogItem[]>([]);
  const [config, setConfig] = useState<PresswallConfig>(
    DEFAULT_PRESSWALL_CONFIG
  );
  const [selected, setSelected] = useState<SelectedPublisher[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [customName, setCustomName] = useState("");
  const [customSvg, setCustomSvg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [publishersRes, presswallRes] = await Promise.all([
      adminFetch("/api/publishers"),
      adminFetch("/api/presswall"),
    ]);

    if (!(publishersRes.ok && presswallRes.ok)) {
      setIsLoading(false);
      toast.error("Failed to load Presswall settings");
      return;
    }

    const publishersData = await publishersRes.json();
    const presswallData = await presswallRes.json();

    setCatalog(publishersData.publishers);
    setConfig(presswallData.config);
    setSelected(
      presswallData.selections.map(
        (selection: ShopPublisherSelection, index: number) => ({
          key: selection.publisherId ?? `custom-${index}`,
          publisherId: selection.publisherId,
          customName: selection.customName,
          customLogoSvg: selection.customLogoSvg,
          customUrl: selection.customUrl,
        })
      )
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredCatalog = useMemo(
    () =>
      catalog.filter((publisher) => {
        const matchesCategory =
          category === "All" || publisher.category === category;
        const matchesSearch =
          search.trim().length === 0 ||
          publisher.name.toLowerCase().includes(search.toLowerCase()) ||
          publisher.category.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [catalog, category, search]
  );

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.publisherId).filter(Boolean)),
    [selected]
  );

  const togglePublisher = (publisher: PublisherCatalogItem) => {
    setSelected((current) => {
      const exists = current.some((item) => item.publisherId === publisher.id);
      if (exists) {
        return current.filter((item) => item.publisherId !== publisher.id);
      }
      return [...current, { key: publisher.id, publisherId: publisher.id }];
    });
  };

  const movePublisher = (index: number, direction: -1 | 1) => {
    setSelected((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return current;
      }
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const removePublisher = (key: string) => {
    setSelected((current) => current.filter((item) => item.key !== key));
  };

  const addCustomPublisher = () => {
    if (!customName.trim()) {
      return;
    }

    setSelected((current) => [
      ...current,
      {
        key: `custom-${Date.now()}`,
        customName: customName.trim(),
        customLogoSvg: customSvg.trim() || undefined,
      },
    ]);
    setCustomName("");
    setCustomSvg("");
  };

  const save = async () => {
    setIsSaving(true);
    const response = await adminFetch("/api/presswall", {
      method: "PUT",
      body: JSON.stringify({
        config,
        selections: buildSelections(selected),
      }),
    });

    setIsSaving(false);
    if (response.ok) {
      toast.success("Presswall saved");
      return;
    }

    toast.error("Could not save Presswall settings");
  };

  const updateConfig = <K extends keyof PresswallConfig>(
    key: K,
    value: PresswallConfig[K]
  ) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const catalogById = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-4">
          <BrandLogo size={48} />
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
              Presswall
            </p>
            <h1 className="font-semibold text-2xl tracking-tight">
              As seen on your storefront
            </h1>
            <p className="max-w-2xl text-muted-foreground text-sm">
              Pick outlets, customize the heading and styling, then add the
              theme block to your store.
            </p>
          </div>
        </div>
        <Button disabled={isLoading || isSaving} onClick={() => void save()}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Publisher library</CardTitle>
              <CardDescription>
                {catalog.length} built-in outlets. Add custom ones with
                transparent logos for the cleanest look.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search publishers..."
                  value={search}
                />
                <Select
                  onValueChange={(value) => value && setCategory(value)}
                  value={category}
                >
                  <SelectTrigger className="sm:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PUBLISHER_CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-72 rounded-lg border p-3">
                {filteredCatalog.length === 0 ? (
                  <Empty className="border-0">
                    <EmptyHeader>
                      <EmptyTitle>No publishers found</EmptyTitle>
                      <EmptyDescription>
                        Try another search term or category.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid gap-2">
                    {filteredCatalog.map((publisher) => {
                      const checked = selectedIds.has(publisher.id);
                      return (
                        <label
                          className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/40"
                          htmlFor={`publisher-${publisher.id}`}
                          key={publisher.id}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={checked}
                              id={`publisher-${publisher.id}`}
                              onCheckedChange={() => togglePublisher(publisher)}
                            />
                            <div>
                              <p className="font-medium text-sm">
                                {publisher.name}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {publisher.category}
                              </p>
                            </div>
                          </div>
                          <div
                            className="h-6 max-w-24 overflow-hidden opacity-80"
                            dangerouslySetInnerHTML={{
                              __html: publisher.logoMonoSvg,
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              <Alert>
                <AlertTitle>{LOGO_GUIDANCE.title}</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">{LOGO_GUIDANCE.summary}</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {LOGO_GUIDANCE.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                <Label htmlFor="custom-name">Custom outlet</Label>
                <Input
                  id="custom-name"
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Podcast, local news, blog..."
                  value={customName}
                />
                <div className="grid gap-2">
                  <Label htmlFor="custom-svg">Logo (SVG recommended)</Label>
                  <Textarea
                    id="custom-svg"
                    onChange={(event) => setCustomSvg(event.target.value)}
                    placeholder='Paste inline SVG with a transparent background, e.g. <svg xmlns="http://www.w3.org/2000/svg" ...>'
                    rows={4}
                    value={customSvg}
                  />
                  <p className="text-muted-foreground text-xs">
                    Transparent PNGs can be embedded as a base64{" "}
                    <code className="rounded bg-muted px-1">&lt;image&gt;</code>{" "}
                    inside an SVG if needed.
                  </p>
                </div>
                <Button onClick={addCustomPublisher} variant="outline">
                  Add custom outlet
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected outlets</CardTitle>
              <CardDescription>
                Drag order with the move buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selected.length === 0 ? (
                <Empty className="border-dashed">
                  <EmptyHeader>
                    <EmptyTitle>No outlets selected</EmptyTitle>
                    <EmptyDescription>
                      Choose publishers from the library or add a custom outlet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                selected.map((item, index) => {
                  const publisher = item.publisherId
                    ? catalogById.get(item.publisherId)
                    : null;
                  const label = publisher?.name ?? item.customName ?? "Custom";

                  return (
                    <div
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                      key={item.key}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => movePublisher(index, -1)}
                          size="sm"
                          variant="outline"
                        >
                          Up
                        </Button>
                        <Button
                          onClick={() => movePublisher(index, 1)}
                          size="sm"
                          variant="outline"
                        >
                          Down
                        </Button>
                        <Button
                          onClick={() => removePublisher(item.key)}
                          size="sm"
                          variant="ghost"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4 flex flex-col gap-4" value="content">
              <Card>
                <CardHeader>
                  <CardTitle>Heading</CardTitle>
                  <CardDescription>
                    Show, hide, or rewrite the label above your logos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-heading">Show heading</Label>
                    <Switch
                      checked={config.showHeading}
                      id="show-heading"
                      onCheckedChange={(checked) =>
                        updateConfig("showHeading", checked)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="heading-text">Heading text</Label>
                    <Input
                      disabled={!config.showHeading}
                      id="heading-text"
                      onChange={(event) =>
                        updateConfig("headingText", event.target.value)
                      }
                      placeholder="As seen on"
                      value={config.headingText}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="mt-4 flex flex-col gap-4" value="style">
              <Card>
                <CardHeader>
                  <CardTitle>Logo treatment</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Label>Color mode</Label>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button size="sm" variant="ghost">
                              ?
                            </Button>
                          }
                        />
                        <TooltipContent>
                          Mono and muted modes work best with transparent logos.
                          Full color shows original brand marks.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      onValueChange={(value) =>
                        updateConfig(
                          "colorMode",
                          value as PresswallConfig["colorMode"]
                        )
                      }
                      value={config.colorMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mono">Black & white</SelectItem>
                        <SelectItem value="muted">Muted grayscale</SelectItem>
                        <SelectItem value="color">Full color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {config.colorMode === "muted" ? (
                    <div className="grid gap-2">
                      <Label>Muted opacity ({config.grayscaleOpacity}%)</Label>
                      <Slider
                        max={100}
                        min={20}
                        onValueChange={(value) =>
                          updateConfig("grayscaleOpacity", sliderValue(value))
                        }
                        step={5}
                        value={[config.grayscaleOpacity]}
                      />
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <Label>Logo height ({config.logoHeight}px)</Label>
                    <Slider
                      max={80}
                      min={16}
                      onValueChange={(value) =>
                        updateConfig("logoHeight", sliderValue(value))
                      }
                      step={2}
                      value={[config.logoHeight]}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="text-color">Text color</Label>
                      <Input
                        id="text-color"
                        onChange={(event) =>
                          updateConfig("textColor", event.target.value)
                        }
                        value={config.textColor}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="background-color">Background</Label>
                      <Input
                        id="background-color"
                        onChange={(event) =>
                          updateConfig("backgroundColor", event.target.value)
                        }
                        placeholder="transparent"
                        value={config.backgroundColor}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="mt-4 flex flex-col gap-4" value="layout">
              <Card>
                <CardHeader>
                  <CardTitle>Layout</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label>Layout type</Label>
                    <Select
                      onValueChange={(value) =>
                        updateConfig(
                          "layout",
                          value as PresswallConfig["layout"]
                        )
                      }
                      value={config.layout}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Horizontal bar</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="marquee">
                          Scrolling marquee
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Alignment</Label>
                    <Select
                      onValueChange={(value) =>
                        updateConfig(
                          "alignment",
                          value as PresswallConfig["alignment"]
                        )
                      }
                      value={config.alignment}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Gap ({config.gap}px)</Label>
                    <Slider
                      max={64}
                      min={8}
                      onValueChange={(value) =>
                        updateConfig("gap", sliderValue(value))
                      }
                      step={2}
                      value={[config.gap]}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Padding Y ({config.paddingY}px)</Label>
                      <Slider
                        max={80}
                        min={0}
                        onValueChange={(value) =>
                          updateConfig("paddingY", sliderValue(value))
                        }
                        step={2}
                        value={[config.paddingY]}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Padding X ({config.paddingX}px)</Label>
                      <Slider
                        max={80}
                        min={0}
                        onValueChange={(value) =>
                          updateConfig("paddingX", sliderValue(value))
                        }
                        step={2}
                        value={[config.paddingX]}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Corner radius ({config.borderRadius}px)</Label>
                    <Slider
                      max={32}
                      min={0}
                      onValueChange={(value) =>
                        updateConfig("borderRadius", sliderValue(value))
                      }
                      step={2}
                      value={[config.borderRadius]}
                    />
                  </div>

                  {config.layout === "marquee" ? (
                    <div className="grid gap-2">
                      <Label>Marquee speed ({config.marqueeSpeed}s)</Label>
                      <Slider
                        max={80}
                        min={10}
                        onValueChange={(value) =>
                          updateConfig("marqueeSpeed", sliderValue(value))
                        }
                        step={5}
                        value={[config.marqueeSpeed]}
                      />
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Alert>
                <AlertTitle>Add to your theme</AlertTitle>
                <AlertDescription>
                  After saving, open Online Store → Customize → Add block → Apps
                  → Presswall.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <PresswallPreviewPair
            catalog={catalog}
            config={config}
            selections={buildSelections(selected)}
          />
        </div>
      </div>
    </div>
  );
}
