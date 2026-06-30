"use client";

import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminFetch } from "@/lib/admin-fetch";
import type { ShopBannerAssignmentsState } from "@/lib/banner-assignment-service";

interface BannerOption {
  id: string;
  isDefault: boolean;
  name: string;
}

interface ProductAssignmentRow {
  bannerId: string;
  productId: string;
  productTitle: string;
}

interface BannerAssignmentsPanelProps {
  onSaved?: () => void;
}

const SHOPIFY_PRODUCT_GID_PREFIX = /^gid:\/\/shopify\/Product\//;

export function BannerAssignmentsPanel({
  onSaved,
}: BannerAssignmentsPanelProps) {
  const [banners, setBanners] = useState<BannerOption[]>([]);
  const [homepageBannerId, setHomepageBannerId] = useState<string>("");
  const [allProductsBannerId, setAllProductsBannerId] = useState<string>("");
  const [productAssignments, setProductAssignments] = useState<
    ProductAssignmentRow[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAssignments = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await adminFetch("/api/banner-assignments");
      if (!response.ok) {
        throw new Error("Failed to load");
      }

      const data = (await response.json()) as {
        assignments: ShopBannerAssignmentsState;
        banners: BannerOption[];
      };

      setBanners(data.banners);
      setHomepageBannerId(data.assignments.homepageBannerId ?? "");
      setAllProductsBannerId(data.assignments.allProductsBannerId ?? "");
      setProductAssignments(
        data.assignments.productAssignments.map((assignment) => ({
          bannerId: assignment.bannerId,
          productId: assignment.productId,
          productTitle:
            assignment.productTitle ?? `Product ${assignment.productId}`,
        }))
      );
    } catch {
      toast.error("Could not load banner placements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments().catch(() => undefined);
  }, [loadAssignments]);

  const pickProducts = async () => {
    const shopify = window.shopify;
    if (!shopify?.resourcePicker) {
      toast.error("Product picker is unavailable in this session");
      return;
    }

    try {
      const selection = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        action: "select",
      });

      if (!selection || selection.length === 0) {
        return;
      }

      const defaultBannerId =
        allProductsBannerId || homepageBannerId || banners[0]?.id || "";

      setProductAssignments((current) => {
        const existingIds = new Set(current.map((row) => row.productId));
        const additions = selection
          .map((product) => {
            const productId = String(product.id).replace(
              SHOPIFY_PRODUCT_GID_PREFIX,
              ""
            );
            if (existingIds.has(productId)) {
              return null;
            }

            return {
              productId,
              productTitle: product.title ?? `Product ${productId}`,
              bannerId: defaultBannerId,
            };
          })
          .filter((row): row is ProductAssignmentRow => row !== null);

        return [...current, ...additions];
      });
    } catch {
      toast.error("Could not open product picker");
    }
  };

  const removeProductAssignment = (productId: string) => {
    setProductAssignments((current) =>
      current.filter((row) => row.productId !== productId)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await adminFetch("/api/banner-assignments", {
        method: "PUT",
        body: JSON.stringify({
          homepageBannerId: homepageBannerId || null,
          allProductsBannerId: allProductsBannerId || null,
          productAssignments,
        }),
      });

      if (!response.ok) {
        toast.error("Could not save banner placements");
        return;
      }

      toast.success("Banner placements saved");
      onSaved?.();
    } catch {
      toast.error("Could not save banner placements");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Loading placements…
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Save a template first to assign banners to pages.
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-5 p-3">
        <div className="space-y-1.5">
          <Label htmlFor="homepage-banner">Homepage</Label>
          <Select
            onValueChange={(value) => setHomepageBannerId(value ?? "")}
            value={homepageBannerId}
          >
            <SelectTrigger id="homepage-banner">
              <SelectValue placeholder="Choose a saved banner" />
            </SelectTrigger>
            <SelectContent>
              {banners.map((banner) => (
                <SelectItem key={banner.id} value={banner.id}>
                  {banner.name}
                  {banner.isDefault ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-banner">All product pages</Label>
          <Select
            onValueChange={(value) => setAllProductsBannerId(value ?? "")}
            value={allProductsBannerId}
          >
            <SelectTrigger id="product-banner">
              <SelectValue placeholder="Choose a saved banner" />
            </SelectTrigger>
            <SelectContent>
              {banners.map((banner) => (
                <SelectItem key={banner.id} value={banner.id}>
                  {banner.name}
                  {banner.isDefault ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Specific products</Label>
            <Button
              onClick={pickProducts}
              size="sm"
              type="button"
              variant="outline"
            >
              <IconPlus stroke={2} />
              Add products
            </Button>
          </div>

          {productAssignments.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              Override the product-page default for individual products.
            </p>
          ) : (
            <div className="space-y-2">
              {productAssignments.map((assignment) => (
                <div
                  className="flex items-center gap-2 rounded-lg border p-2"
                  key={assignment.productId}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {assignment.productTitle}
                    </p>
                    <p className="truncate text-muted-foreground text-xs">
                      ID {assignment.productId}
                    </p>
                  </div>
                  <Select
                    onValueChange={(bannerId) => {
                      if (!bannerId) {
                        return;
                      }

                      setProductAssignments((current) =>
                        current.map((row) =>
                          row.productId === assignment.productId
                            ? { ...row, bannerId }
                            : row
                        )
                      );
                    }}
                    value={assignment.bannerId}
                  >
                    <SelectTrigger className="w-[9.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {banners.map((banner) => (
                        <SelectItem key={banner.id} value={banner.id}>
                          {banner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    aria-label={`Remove ${assignment.productTitle}`}
                    onClick={() =>
                      removeProductAssignment(assignment.productId)
                    }
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <IconTrash stroke={2} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          disabled={isSaving}
          onClick={handleSave}
          type="button"
        >
          {isSaving ? "Saving..." : "Save placements"}
        </Button>
      </div>
    </ScrollArea>
  );
}
