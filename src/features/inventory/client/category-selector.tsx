"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, Plus, X, Loader2, Search } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { getShopCategories } from "../server/actions";
import { Message } from "@/shared/components/pages/message";

const SEARCH_THRESHOLD = 30
const MAX_CATEGORY_LENGTH = 20;

export function CategorySelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (categories: string[]) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [selected, setSelected] = useState<string[]>(value);
  const [availableCategories, setAvailableCategories] = useState<
    { id: string; name: string }[]
  >([]);


  useEffect(() => {
    setSelected(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;

    getShopCategories()
      .then((categories) => {
        if (!cancelled) setAvailableCategories(categories);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const commit = (next: string[]) => {
    setSelected(next);
    onChange(next);
  };

const addNewCategory = () => {
  const trimmed = newCategory.trim();
  if (!trimmed || trimmed.length > MAX_CATEGORY_LENGTH) return;
  const normalized = trimmed.toLowerCase();
  if (!selected.some((c) => c.toLowerCase() === normalized)) {
    commit([...selected, trimmed]);
  }
  setNewCategory("");
};

  const removeCategory = (index: number) => {
    commit(selected.filter((_, i) => i !== index));
  };

  const toggleCategory = (name: string) => {
    const normalized = name.toLowerCase();
    const exists = selected.some((c) => c.toLowerCase() === normalized);
    commit(
      exists
        ? selected.filter((c) => c.toLowerCase() !== normalized)
        : [...selected, name],
    );
  };

  const showSearch = availableCategories.length > SEARCH_THRESHOLD;
  const isTooLong = newCategory.length > MAX_CATEGORY_LENGTH;

  const filteredCategories = useMemo(() => {
    if (!showSearch || !categorySearch.trim()) return availableCategories;
    const q = categorySearch.trim().toLowerCase();
    return availableCategories.filter((c) => c.name.toLowerCase().includes(q));
  }, [availableCategories, categorySearch, showSearch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-neutral">
        <Layers className="size-4" />
        <span className="font-semibold md:text-lg">Categories</span>
      </div>

      <div>
        <div className="flex w-full items-center gap-2">
          <div className="min-w-0 flex-1">
            <Input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewCategory();
                }
              }}
              placeholder="Add a new category..."
              aria-invalid={isTooLong}
            />
          </div>

          <Button
            type="button"
            shape="round"
            variant="secondary"
            onClick={addNewCategory}
            aria-label="Add category"
            disabled={isTooLong || !newCategory.trim()}
          >
            <Plus className="size-5" />
          </Button>
        </div>

        {isTooLong && (
            <Message>
              Category cannot be more than {MAX_CATEGORY_LENGTH} characters
            </Message>
        )}
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((c, index) => (
            <li key={`${c}-${index}`}>
              <Badge
                variant="secondary"
                className="gap-1 py-1 pl-2.5 pr-1.5 font-normal"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(index)}
                  aria-label={`Remove ${c}`}
                  className="rounded-full p-0.5 hover:bg-danger/10"
                >
                  <X className="size-3.5 text-neutral hover:text-danger" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-ink/60">
          <Loader2 className="size-4 animate-spin" />
          Loading categories...
        </div>
      ) : (
        availableCategories.length > 0 && (
          <div className="space-y-1.5 border rounded-md p-2 md:p-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b">
              <p className="text-sm font-medium text-ink/60">
                Or pick from existing categories
              </p>
            </div>

            {showSearch && (
              <div className="relative">
                <Input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories..."
                  className="h-8 pl-8 text-sm"
                  icon={Search}
                />
              </div>
            )}

            <div className="max-h-48 grid grid-cols-2 gap-y-0.5 md:grid-cols-3 overflow-y-auto rounded-md">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((c) => {
                  const checked = selected.some(
                    (s) => s.toLowerCase() === c.name.toLowerCase(),
                  );
                  return (
                    <label
                      key={c.id}
                      htmlFor={`category-${c.id}`}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <Checkbox
                        id={`category-${c.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleCategory(c.name)}
                      />
                      <span className="text-sm text-ink line-clamp-2">
                        {c.name}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="col-span-full py-4 text-center text-sm text-neutral">
                  No categories match &quot;{categorySearch}&quot;.
                </p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
