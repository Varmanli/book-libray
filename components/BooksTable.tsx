import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";

interface BookData {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  genre?: string | null;
  country?: string | null;
  status?: string;
  pageCount?: number | null;
  progress?: number | null;
  rating?: number | null;
  createdAt: string;
}

interface BooksTableProps {
  data: BookData[];
  title: string;
  searchPlaceholder?: string;
  filterOptions?: { value: string; label: string }[];
  onFilterChange?: (filter: string) => void;
  className?: string;
}

type SortField = keyof BookData;
type SortOrder = "asc" | "desc";

export default function BooksTable({
  data,
  title,
  searchPlaceholder = "جستجو...",
  filterOptions = [],
  onFilterChange,
  className = "",
}: BooksTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filter, setFilter] = useState("all");

  // Filter and search data
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.publisher &&
        item.publisher.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.genre &&
        item.genre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filter === "all" || item.status === filter;

    return matchesSearch && matchesFilter;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    onFilterChange?.(value);
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          {filterOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="فیلتر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-700 text-sm text-gray-300">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                {[
                  { key: "title", label: "عنوان" },
                  { key: "author", label: "نویسنده" },
                  { key: "publisher", label: "ناشر", desktopOnly: true },
                  { key: "genre", label: "ژانر", desktopOnly: true },
                  { key: "country", label: "کشور", desktopOnly: true },
                  { key: "status", label: "وضعیت", desktopOnly: true },
                  { key: "pageCount", label: "صفحات", desktopOnly: true },
                  { key: "rating", label: "امتیاز", desktopOnly: true },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`border p-3 text-right ${
                      col.key !== "actions"
                        ? "cursor-pointer hover:bg-gray-700 select-none"
                        : ""
                    } ${col.desktopOnly ? "hidden md:table-cell" : ""}`}
                    onClick={() => handleSort(col.key as SortField)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {col.label}
                      {col.key !== "actions" &&
                        getSortIcon(col.key as SortField)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-700 transition-colors text-xs md:text-sm"
                >
                  <td className="border p-3 font-medium">{item.title}</td>
                  <td className="border p-3">{item.author}</td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.publisher || "—"}
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.genre || "—"}
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.country || "—"}
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "FINISHED"
                          ? "bg-green-700 text-green-100"
                          : item.status === "READING"
                          ? "bg-blue-700 text-blue-100"
                          : "bg-gray-600 text-gray-100"
                      }`}
                    >
                      {item.status === "FINISHED"
                        ? "تمام شده"
                        : item.status === "READING"
                        ? "در حال خواندن"
                        : "خوانده نشده"}
                    </span>
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.pageCount || "—"}
                  </td>
                  <td className="border p-3 hidden md:table-cell">
                    {item.rating ? `${item.rating}/5` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              هیچ کتابی یافت نشد
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
