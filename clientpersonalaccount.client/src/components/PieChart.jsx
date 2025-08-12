import React from "react";
import {
    PieChart as RePieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

// Modern color palette matching the Figma design
const COLORS = ["#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63"];

export function PieChart({ data, t, title }) {
    // Check for empty or invalid data
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center h-96">
                <p className="text-gray-500">{t ? t("No data available for this chart.") : "No data available for this chart."}</p>
            </div>
        );
    }

    // Transform data for Recharts Pie
    const chartData = Object.entries(data)
        .filter(([, val]) => Array.isArray(val.data))
        .map(([id, val]) => ({
            name: val.title,
            value: val.data.reduce((sum, d) => sum + d.value, 0),
        }))
        .filter(item => item.value > 0);

    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                    <p className="font-semibold text-gray-800 mb-2">{item.name}</p>
                    <p className="text-cyan-600 font-medium text-lg">
                        {t ? t("Value") : "Value"}: {item.value.toLocaleString()}
                    </p>
                    <p className="text-gray-500 text-sm">
                        {((item.value / total) * 100).toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    // Custom label function
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Don't show labels for very small segments

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-medium text-sm"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h6 className="text-lg font-semibold text-gray-800 mb-0">{title}</h6>
            </div>

            <div className="p-6">
                <div className="relative h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <defs>
                                {COLORS.map((color, index) => (
                                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                                        <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                innerRadius={50}
                                dataKey="value"
                                startAngle={90}
                                endAngle={450}
                                paddingAngle={2}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#gradient-${index % COLORS.length})`}
                                        stroke="white"
                                        strokeWidth={3}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </RePieChart>
                    </ResponsiveContainer>

                    {/* Center total display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">
                                {total.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {t ? t("Total") : "Total"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}