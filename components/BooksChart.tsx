"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface BooksChartProps {
  data: ChartData[];
  title: string;
  type: "bar" | "pie" | "line";
  dataKey?: string;
  className?: string;
  colors?: string[];
  fixedStatusColors?: boolean;
}

const DEFAULT_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#A66DD4",
  "#FF922B",
  "#20C997",
  "#845EC2",
  "#FFC75F",
  "#0081CF",
];

const STATUS_COLORS: Record<string, string> = {
  FINISHED: "#6BCB77",
  READING: "#4D96FF",
  UNREAD: "#9CA3AF",
};

export default function BooksChart({
  data,
  title,
  type,
  dataKey = "value",
  className = "",
  colors = DEFAULT_COLORS,
  fixedStatusColors = false,
}: BooksChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // فقط ۷ ستون در موبایل
  const filteredData = isMobile ? data.slice(0, 5) : data;

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: "#F3F4F6" }}
                interval={0}
              />
              <YAxis stroke="#9CA3" fontSize={12} tick={{ fill: "#E5E7EB" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#03E88D",
                  border: "1px solid #4B5563",
                  borderRadius: "8px",
                  padding: "6px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#000", fontWeight: "bold" }}
              />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {filteredData.map((entry, index) => {
                  const fillColor = fixedStatusColors
                    ? STATUS_COLORS[entry.name.toUpperCase()] || "#F3F4F6"
                    : colors[index % colors.length];
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-center text-base sm:text-lg font-semibold text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[220px] sm:h-[300px] p-0">
        {data.length > 0 ? (
          <div className="w-full h-full px-2 sm:px-4">{renderChart()}</div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            داده‌ای برای نمایش وجود ندارد
          </div>
        )}
      </CardContent>
    </Card>
  );
}
