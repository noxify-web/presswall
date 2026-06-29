"use client";

import { IconSearch } from "@tabler/icons-react";
import { useMemo } from "react";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PublisherCatalogItem } from "@/lib/presswall-types";
import { PUBLISHER_CATEGORIES } from "@/lib/publishers-seed";
import { cn } from "@/lib/utils";

interface PublisherLibraryProps {
  catalog: PublisherCatalogItem[];
  category: string;
  className?: string;
  listClassName?: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onToggle: (publisher: PublisherCatalogItem) => void;
  search: string;
  selectedIds: Set<string>;
}

export function PublisherLibrary({
  catalog,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  className,
  listClassName = "h-80",
}: PublisherLibraryProps) {
  const filteredCatalog = useMemo(
    () =>
      catalog.filter((publisher) => {
        const matchesCategory =
          category === "All" || publisher.category === category;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          publisher.name.toLowerCase().includes(query) ||
          publisher.category.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      }),
    [catalog, category, search]
  );

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            stroke={2}
          />
          <Input
            autoComplete="off"
            className="pl-8"
            data-1p-ignore
            data-form-type="other"
            data-lpignore="true"
            name="presswall-outlet-search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search outlets..."
            type="search"
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) => value && onCategoryChange(value)}
          value={category}
        >
          <SelectTrigger className="sm:w-40">
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

      <div
        className={cn(
          "min-h-0 overflow-y-auto rounded-lg border",
          listClassName
        )}
      >
        {filteredCatalog.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>No outlets found</EmptyTitle>
              <EmptyDescription>
                Try a different search term or category.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-0.5 p-1.5">
            {filteredCatalog.map((publisher) => {
              const checked = selectedIds.has(publisher.id);
              return (
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:bg-muted/50",
                    checked && "border-border bg-muted/40"
                  )}
                  htmlFor={`publisher-${publisher.id}`}
                  key={publisher.id}
                >
                  <Checkbox
                    checked={checked}
                    id={`publisher-${publisher.id}`}
                    onCheckedChange={() => onToggle(publisher)}
                  />
                  <div className="flex h-8 w-28 shrink-0 items-center justify-center rounded-md bg-muted/40 px-1">
                    <PublisherLogo
                      className="[--logo-height:1.75rem]"
                      name={publisher.name}
                      publisherId={publisher.id}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {publisher.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {publisher.category}
                    </p>
                  </div>
                  {checked ? <Badge variant="secondary">Added</Badge> : null}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
