import React from "react";
import { useMediaQuery } from "react-responsive";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

// Массив ключей месяцев для передачи в t
const monthKeys = [
    "month.jan",
    "month.feb",
    "month.mar",
    "month.apr",
    "month.may",
    "month.jun",
    "month.jul",
    "month.aug",
    "month.sep",
    "month.oct",
    "month.nov",
    "month.dec",
];

// Функция форматирования даты с локализацией
function formatDateToMonth(dateString, t) {
    const date = new Date(dateString);
    // Получаем локализованное название месяца
    const monthName = t ? t(monthKeys[date.getMonth()]) : monthKeys[date.getMonth()];
    // Возвращаем, например: "Июн '25"
    return `${monthName} '${date.getFullYear().toString().slice(2)}`;
}

// Исправленный тултип с локализацией
const CustomTooltip = ({ active, payload, label, t }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded shadow border border-gray-200">
                <p className="font-semibold text-gray-800 mb-1">{label}</p>
                <p className="text-cyan-600 font-bold text-lg">
                    {payload[0].value !== undefined
                        ? payload[0].value.toLocaleString()
                        : t
                            ? t("No value")
                            : "No value"}
                </p>
            </div>
        );
    }
    return null;
};

export default function YearlySalesChart({ title, data, t }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 w-full h-40 flex items-center justify-center">
                <p className="text-gray-500 text-lg">
                    {t ? t("No data available to display chart.") : "No data available"}
                </p>
            </div>
        );
    }

    // Группируем данные по месяцам
    const monthlyDataMap = data.reduce((acc, item) => {
        const date = new Date(item.date);
        const monthKey = date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, "0");
        acc[monthKey] = (acc[monthKey] || 0) + item.value;
        return acc;
    }, {});

    // Преобразуем в массив с локализованными метками месяцев
    const monthlyData = Object.entries(monthlyDataMap)
        .sort(([a], [b]) => new Date(a + "-01") - new Date(b + "-01"))
        .map(([month, value]) => {
            const [year, monthNum] = month.split("-");
            // Формируем date с локализацией
            const dummyDateStr = `${year}-${monthNum}-01`;
            return {
                date: formatDateToMonth(dummyDateStr, t),
                value,
            };
        });

    const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });

    return (
        <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-full flex flex-col">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <h6 className="text-xl font-semibold text-gray-800">{t("POSForYear")}</h6>
            </div>

            <div className="p-4 h-[320px] md:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={monthlyData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        barCategoryGap="30%"
                    >
                        <defs>
                            <linearGradient id="barGradientYearly" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.9} />
                                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.7} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#374151", fontSize: isSmallScreen ? 9 : 14, fontWeight: "600" }}
                            padding={{ left: isSmallScreen ? 2 : 20, right: isSmallScreen ? 2 : 20 }}
                            interval={0}
                            tickFormatter={(month) => month.slice(0, 3)}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#374151", fontSize: 14, fontWeight: "600" }}
                            orientation="left"
                            padding={{ top: 10, bottom: 10 }}
                            tickFormatter={(value) =>
                                value >= 1000000
                                    ? `${(value / 1000000).toFixed(1)}M`
                                    : value >= 1000
                                        ? `${(value / 1000).toFixed(0)}K`
                                        : value
                            }
                        />
                        <Tooltip content={<CustomTooltip t={t} />} />
                        <Bar
                            dataKey="value"
                            fill="url(#barGradientYearly)"
                            radius={[8, 8, 0, 0]}
                            minPointSize={6}
                            isAnimationActive={true}
                            animationDuration={1000}
                            animationEasing="ease-in-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
