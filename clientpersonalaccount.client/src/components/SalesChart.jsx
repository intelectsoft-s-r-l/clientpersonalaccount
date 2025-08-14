import React, { useState } from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import ProgressCircle from "./ProgressCircle";

export default function SalesChart({ title, data, t }) {
    const [chartType, setChartType] = useState("area");

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const value = payload[0].value;
            const name = payload[0].dataKey === "value" ? (t ? t("Value") : "Value") : payload[0].dataKey;

            return (
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="font-semibold text-gray-800 mb-2">{label}</p>
                    <p className="text-cyan-600 font-medium text-lg">
                        {`${name}: ${value.toLocaleString()}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md h-40 flex items-center justify-center">
                <p className="text-gray-500 text-lg">
                    {t ? t("No data available to display chart.") : "No data available to display chart."}
                </p>
            </div>
        );
    }

    // Если одна точка — показать прогресс
    if (data.length === 1) {
        const maxValue = Math.max(100, data[0].value * 2); // максимум для прогресса, например в 2 раза больше значения
        console.log(data);
        return (
            <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-[260px] flex flex-col items-center py-4 px-4">
                <h6 className="text-md font-semibold text-gray-800 mb-2">{title}</h6>
                <ProgressCircle value={data[0].value} max={maxValue} />
                <p className="mt-2 text-gray-600 text-xs">{data[0].date}</p>
            </div>
        );
    }

    // Остальной код отрисовки графиков
    return (
        <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-xl flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h6 className="text-lg font-semibold text-gray-800 mb-0">{title}</h6>
                <select
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                >
                    <option value="area">{t ? t("LineChart") : "Area Chart"}</option>
                    <option value="bar">{t ? t("BarChart") : "Bar Chart"}</option>
                </select>
            </div>

            {/* Chart Content */}
            <div className="flex-1 p-4">
                <div className="h-[300px] md:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "area" ? (
                            <AreaChart
                                data={data}
                                margin={{ top: 15, right: 20, left: 15, bottom: 15 }}
                            >
                                <defs>
                                    <linearGradient id="colorValueArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#06B6D4" />
                                        <stop offset="100%" stopColor="#22D3EE" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#6B7280", fontSize: 12 }}
                                    tickFormatter={(value) => value.slice(0, 5)}
                                    padding={{ left: 20, right: 20 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#6B7280", fontSize: 12 }}
                                    orientation="left"
                                    padding={{ top: 10, bottom: 10 }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                        return value;
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="url(#lineColor)"
                                    fill="url(#colorValueArea)"
                                    strokeWidth={3}
                                    activeDot={{
                                        r: 6,
                                        stroke: "#22D3EE",
                                        strokeWidth: 3,
                                        fill: "#fff",
                                        cursor: "pointer",
                                    }}
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            </AreaChart>
                        ) : (
                            <BarChart
                                data={data}
                                margin={{ top: 15, right: 20, left: 15, bottom: 15 }}
                                barCategoryGap="20%"
                            >
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.7} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#6B7280", fontSize: 12 }}
                                    tickFormatter={(value) => value.slice(0, 5)}
                                    padding={{ left: 20, right: 20 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#6B7280", fontSize: 12 }}
                                    orientation="left"
                                    padding={{ top: 10, bottom: 10 }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                        return value;
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    fill="url(#barGradient)"
                                    radius={[8, 8, 0, 0]}
                                    minPointSize={5}
                                    isAnimationActive={true}
                                    animationDuration={800}
                                    animationEasing="ease-in-out"
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
