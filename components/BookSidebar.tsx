"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  label: string;
  value: string;
}

interface BooksSidebarProps {
  authors: string[];
  genres: string[];
  publishers: string[];
  translators: string[];
  countries: string[];
  selectedAuthor: string | null;
  selectedGenre: string | null;
  selectedPublisher: string | null;
  selectedTranslator: string | null;
  selectedCountry: string | null;
  selectedStatus: string | null;
  sortBy: "pageCount" | "rating" | null;
  sortOrder: "asc" | "desc";
  onAuthorChange: (author: string | null) => void;
  onGenreChange: (genre: string | null) => void;
  onPublisherChange: (publisher: string | null) => void;
  onTranslatorChange: (translator: string | null) => void;
  onCountryChange: (country: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onSortByChange: (sortBy: "pageCount" | "rating" | null) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
}

export default function BooksSidebar({
  authors,
  genres,
  publishers,
  translators,
  countries,
  selectedAuthor,
  selectedGenre,
  selectedPublisher,
  selectedTranslator,
  selectedCountry,
  selectedStatus,
  sortBy,
  sortOrder,
  onAuthorChange,
  onGenreChange,
  onPublisherChange,
  onTranslatorChange,
  onCountryChange,
  onStatusChange,
  onSortByChange,
  onSortOrderChange,
}: BooksSidebarProps) {
  const renderSelect = (
    label: string,
    items: (string | SelectOption)[],
    selected: string | null,
    onChange: (val: string | null) => void
  ) => {
    const normalizedItems: SelectOption[] = items.map((item) =>
      typeof item === "string" ? { label: item, value: item } : item
    );

    return (
      <div>
        <p className="text-gray-300 font-medium mb-1">{label}:</p>
        <Select
          value={selected || "all"}
          onValueChange={(val) => onChange(val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full" dir="rtl">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="max-h-48">
              <SelectGroup>
                <SelectItem value="all" dir="rtl">
                  همه
                </SelectItem>
                {normalizedItems.map((item) => (
                  <SelectItem key={item.value} value={item.value} dir="rtl">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <aside className="md:col-span-1 border rounded-xl p-4 space-y-6 h-fit bg-card">
      <h2 className="font-bold text-xl text-gray-100 mb-4">فیلتر کتاب‌ها</h2>

      {renderSelect("نویسنده", authors, selectedAuthor, onAuthorChange)}
      {renderSelect("ژانر", genres, selectedGenre, onGenreChange)}
      {renderSelect("ناشر", publishers, selectedPublisher, onPublisherChange)}
      {renderSelect(
        "مترجم",
        translators,
        selectedTranslator,
        onTranslatorChange
      )}
      {renderSelect("کشور", countries, selectedCountry, onCountryChange)}

      {/* وضعیت خواندن */}
      {renderSelect(
        "وضعیت خواندن",
        [
          { label: "خوانده نشده", value: "UNREAD" },
          { label: "در حال خواندن", value: "READING" },
          { label: "خوانده شده", value: "FINISHED" },
        ],
        selectedStatus,
        onStatusChange
      )}

      {/* مرتب‌سازی */}
      <div>
        <p className="text-gray-300 font-medium mb-1">مرتب‌سازی بر اساس:</p>
        <Select
          value={sortBy || "none"}
          onValueChange={(val) =>
            onSortByChange(
              val === "none" ? null : (val as "pageCount" | "rating")
            )
          }
        >
          <SelectTrigger className="w-full" dir="rtl">
            <SelectValue placeholder="مرتب‌سازی" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none" dir="rtl">
                بدون مرتب‌سازی
              </SelectItem>
              <SelectItem value="pageCount" dir="rtl">
                تعداد صفحات
              </SelectItem>
              <SelectItem value="rating" dir="rtl">
                امتیاز
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="text-gray-300 font-medium mb-1">ترتیب:</p>
        <Select
          value={sortOrder}
          onValueChange={(val) => onSortOrderChange(val as "asc" | "desc")}
        >
          <SelectTrigger className="w-full" dir="rtl">
            <SelectValue placeholder="ترتیب" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="asc" dir="rtl">
                صعودی
              </SelectItem>
              <SelectItem value="desc" dir="rtl">
                نزولی
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </aside>
  );
}
