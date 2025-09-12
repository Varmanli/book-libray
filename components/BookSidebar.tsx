"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BooksSidebarProps {
  authors: string[];
  genres: string[];
  publishers: string[];
  translators: string[];
  selectedAuthor: string | null;
  selectedGenre: string | null;
  selectedPublisher: string | null;
  selectedTranslator: string | null;
  onAuthorChange: (author: string | null) => void;
  onGenreChange: (genre: string | null) => void;
  onPublisherChange: (publisher: string | null) => void;
  onTranslatorChange: (translator: string | null) => void;
}

export default function BooksSidebar({
  authors,
  genres,
  publishers,
  translators,
  selectedAuthor,
  selectedGenre,
  selectedPublisher,
  selectedTranslator,
  onAuthorChange,
  onGenreChange,
  onPublisherChange,
  onTranslatorChange,
}: BooksSidebarProps) {
  return (
    <aside className="md:col-span-1 border rounded-xl p-4 space-y-6 h-fit bg-card">
      <h2 className="font-bold text-xl text-gray-100 mb-4">فیلترها</h2>

      {/* فیلتر نویسنده */}
      <Select
        value={selectedAuthor || "all"}
        onValueChange={(val) => onAuthorChange(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-full" dir="rtl">
          <SelectValue placeholder="انتخاب نویسنده" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-48">
            <SelectGroup>
              <SelectLabel dir="rtl">نویسنده</SelectLabel>
              <SelectItem value="all" dir="rtl">
                همه نویسنده‌ها
              </SelectItem>
              {authors.map((author) => (
                <SelectItem key={author} value={author} dir="rtl">
                  {author}
                </SelectItem>
              ))}
            </SelectGroup>
          </ScrollArea>
        </SelectContent>
      </Select>

      {/* فیلتر ژانر */}
      <Select
        value={selectedGenre || "all"}
        onValueChange={(val) => onGenreChange(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-full" dir="rtl">
          <SelectValue placeholder="انتخاب ژانر" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-48">
            <SelectGroup>
              <SelectLabel dir="rtl">ژانر</SelectLabel>
              <SelectItem value="all" dir="rtl">
                همه ژانرها
              </SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre} value={genre} dir="rtl">
                  {genre}
                </SelectItem>
              ))}
            </SelectGroup>
          </ScrollArea>
        </SelectContent>
      </Select>

      {/* فیلتر ناشر */}
      <Select
        value={selectedPublisher || "all"}
        onValueChange={(val) => onPublisherChange(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-full" dir="rtl">
          <SelectValue placeholder="انتخاب ناشر" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-48">
            <SelectGroup dir="rtl">
              <SelectLabel dir="rtl">ناشر</SelectLabel>
              <SelectItem value="all" dir="rtl">
                همه ناشرها
              </SelectItem>
              {publishers.map((publisher) => (
                <SelectItem key={publisher} value={publisher} dir="rtl">
                  {publisher}
                </SelectItem>
              ))}
            </SelectGroup>
          </ScrollArea>
        </SelectContent>
      </Select>

      {/* فیلتر مترجم */}
      <Select
        value={selectedTranslator || "all"}
        onValueChange={(val) => onTranslatorChange(val === "all" ? null : val)}
      >
        <SelectTrigger className="w-full" dir="rtl">
          <SelectValue placeholder="انتخاب مترجم" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="max-h-48">
            <SelectGroup>
              <SelectLabel dir="rtl">مترجم</SelectLabel>
              <SelectItem value="all" dir="rtl">
                همه مترجم‌ها
              </SelectItem>
              {translators.map((translator) => (
                <SelectItem key={translator} value={translator} dir="rtl">
                  {translator}
                </SelectItem>
              ))}
            </SelectGroup>
          </ScrollArea>
        </SelectContent>
      </Select>
    </aside>
  );
}
