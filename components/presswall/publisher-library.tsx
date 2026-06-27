"use client";

import { IconCheck, IconSearch } from "@tabler/icons-react";
import { useMemo } from "react";
import { PublisherLogo } from "@/components/presswall/publisher-logo";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

function PublisherCatalogList({
  filteredCatalog,
  selectedIds,
  onToggle,
  variant,
}: {
  filteredCatalog: PublisherCatalogItem[];
  selectedIds: Set<string>;
  onToggle: (publisher: PublisherCatalogItem) => void;
  variant: "list" | "grid";
}) {
  if (filteredCatalog.length === 0) {
    return (
      <Empty className="border-0 py-8">
        <EmptyHeader>
          <EmptyTitle>No outlets found</EmptyTitle>
          <EmptyDescription>
            Try a different search or category.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3">
        {filteredCatalog.map((publisher) => {
          const checked = selectedIds.has(publisher.id);
          return (
            <button
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-md border px-2 py-2.5 text-center transition-colors",
                checked
                  ? "border-primary/40 bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              )}
              key={publisher.id}
              onClick={() => onToggle(publisher)}
              type="button"
            >
              {checked ? (
                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck className="size-2.5" stroke={3} />
                </span>
              ) : null}
              <div className="flex h-7 w-full items-center justify-center">
                <PublisherLogo
                  className="[--logo-height:1.5rem]"
                  name={publisher.name}
                  publisherId={publisher.id}
                />
              </div>
              <span className="line-clamp-2 font-medium text-[0.6875rem] leading-tight">
                {publisher.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-0.5 p-1.5">
      {filteredCatalog.map((publisher) => {
        const checked = selectedIds.has(publisher.id);
        return (
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-md border border-transparent px-2.5 py-1.5 transition-colors hover:bg-muted/50",
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
            <div className="flex h-7 w-20 shrink-0 items-center justify-center">
              <PublisherLogo
                className="[--logo-height:1.5rem]"
                name={publisher.name}
                publisherId={publisher.id}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{publisher.name}</p>
              <p className="text-muted-foreground text-xs">
                {publisher.category}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

interface PublisherLibraryProps {
  catalog: PublisherCatalogItem[];
  category: string;
  listClassName?: string;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onToggle: (publisher: PublisherCatalogItem) => void;
  search: string;
  selectedIds: Set<string>;
  variant?: "list" | "grid";
}

export function PublisherLibrary({
  catalog,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  listClassName = "h-80",
  variant = "list",
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
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <IconSearch
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            stroke={2}
          />
          <Input
            className="h-8 pl-8 text-sm"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) => value && onCategoryChange(value)}
          value={category}
        >
          <SelectTrigger className="h-8 w-[7.5rem] text-xs">
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

      <ScrollArea className={cn("rounded-lg border", listClassName)}>
        <PublisherCatalogList
          filteredCatalog={filteredCatalog}
          onToggle={onToggle}
          selectedIds={selectedIds}
          variant={variant}
        />
      </ScrollArea>
    </div>
  );
}
