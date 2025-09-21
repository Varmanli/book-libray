import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

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
  fixedStatusColors?: boolean; // 🔥 برای byStatus
}

// پالت رنگ اصلی
const DEFAULT_COLORS = [
  "#FF6B6B", // قرمز
  "#FFD93D", // زرد
  "#6BCB77", // سبز
  "#4D96FF", // آبی
  "#A66DD4", // بنفش
  "#FF922B", // نارنجی
  "#20C997", // فیروزه‌ای
  "#845EC2", // بنفش پررنگ
  "#FFC75F", // طلایی
  "#0081CF", // آبی تیره
];

// پالت ثابت برای وضعیت کتاب‌ها
const STATUS_COLORS: Record<string, string> = {
  Finished: "#6BCB77", // سبز
  READING: "#4D96FF", // آبی
  UNREAD: "#9CA3AF", // خاکستری
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
  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={14}
                tick={{ fill: "#F3F4F6", fontWeight: 600 }}
                interval={0}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: "#E5E7EB" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(31,41,55,0.9)",
                  border: "1px solid #4B5563",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#F9FAFB",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
                labelStyle={{ color: "#FACC15", fontWeight: "bold" }}
                itemStyle={{ color: "#FFFFFF" }}
              />
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => {
                  const fillColor = fixedStatusColors
                    ? STATUS_COLORS[entry.name] || "#F3F4F6"
                    : colors[index % colors.length];
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey={dataKey}
                labelLine={false}
                label={(props: any) => {
                  const { name, value, percent } = props;
                  return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
                }}
              >
                {data.map((entry, index) => {
                  const fillColor = fixedStatusColors
                    ? STATUS_COLORS[entry.name] || "#F3F4F6"
                    : colors[index % colors.length];
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(31,41,55,0.9)",
                  border: "1px solid #4B5563",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#F9FAFB",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
                labelStyle={{ color: "#FACC15", fontWeight: "bold" }}
                itemStyle={{ color: "#FFFFFF" }}
              />
              <Legend wrapperStyle={{ color: "#E5E7EB", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: "#E5E7EB" }}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tick={{ fill: "#E5E7EB" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(31,41,55,0.9)",
                  border: "1px solid #4B5563",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#F9FAFB",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
                labelStyle={{ color: "#FACC15", fontWeight: "bold" }}
                itemStyle={{ color: "#FFFFFF" }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#4D96FF"
                strokeWidth={2}
                dot={{ fill: "#FFD93D", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          renderChart()
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            داده‌ای برای نمایش وجود ندارد
          </div>
        )}
      </CardContent>
    </Card>
  );
}
