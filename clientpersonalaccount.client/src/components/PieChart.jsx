import React from "react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label, // Мы можем использовать Label, если не хотим полностью кастомный центр
} from "recharts";

// Можно использовать эти цвета или подобрать свои, которые хорошо смотрятся на светлом фоне
// и дают хороший контраст между секторами.
const COLORS = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#17a2b8"]; // Более "современные" цвета

export function PieChart({ data, t, title }) {
  // Проверка на пустые или некорректные данные
  if (!data || Object.keys(data).length === 0) {
    return (
      <div
        className="card"
        style={{
          width: 450,
          backgroundColor: "#fff",
          color: "#333",
          border: "1px solid #eee",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 400, // Примерная высота
        }}
      >
        <p>{t("No data available for this chart.")}</p>
      </div>
    );
  }

  // Преобразование данных для Recharts Pie
  const chartData = Object.entries(data)
    .filter(([, val]) => Array.isArray(val.data)) // Убедимся, что data является массивом
    .map(([id, val]) => ({
      name: val.title,
      value: val.data.reduce((sum, d) => sum + d.value, 0),
    }))
    .filter(item => item.value > 0); // Отфильтруем элементы с нулевым значением, чтобы они не отображались

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // Кастомный компонент для тултипа
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "#d2eff2", // Белый фон
            border: "1px solid #ddd",
            padding: "10px",
            borderRadius: "5px",
            color: "#333", // Темный текст
            fontSize: "0.9rem",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <p className="label" style={{ marginBottom: '5px', fontWeight: 'bold' }}>{item.name}</p>
          <p className="intro" style={{ color: item.fill }}>
            {`${t("Value")}: ${item.value.toFixed(2)}`}
          </p>
          <p className="percent" style={{ color: '#666' }}>
            {`(${((item.value / total) * 100).toFixed(1)}%)`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="card h-100"
      style={{
        backgroundColor: "#d2eff2",
        color: "#343534",
        border: "1px solid #eee",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        width: 450,
        minHeight: 350
      }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{
          borderBottom: "none",
          backgroundColor: "#d2eff2",
        }}
      >
        <h6 className="mb-0" style={{ color: "#343534", fontSize: "1.1rem" }}>{title}</h6>
      </div>
      <div className="card-body" style={{ height: 320, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RePieChart>
        </ResponsiveContainer>
        
        <div
          className="fw-bold text-center"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            color: "#343534",
            fontSize: "0.95rem"
          }}
        >
          {t("Total")}: {total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}