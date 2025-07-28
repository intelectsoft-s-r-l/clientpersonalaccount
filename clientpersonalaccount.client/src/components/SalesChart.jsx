import React, { useState, useEffect } from "react";
import {
  AreaChart, // Используем AreaChart для градиентной заливки
  Area,      // Компонент для области в AreaChart
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  // LineChart и Line можно убрать из импорта, если они не используются напрямую
} from "recharts";

export default function SalesChart({ title, data, t }) {
  const [chartType, setChartType] = useState("line");

  // Кастомный компонент для тултипа
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].dataKey === 'value' ? t("Value") : payload[0].dataKey; 

      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)", // Полупрозрачный белый фон
            border: "1px solid #e0e6ed", // Очень светлый, едва заметный бордер
            padding: "12px 16px",
            borderRadius: "10px", // Ещё более скругленные углы
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)", // Более мягкая и размытая тень
            backdropFilter: "blur(5px)", // Чуть сильнее размытие
            color: '#333',
            fontSize: '0.9rem',
            fontFamily: 'Roboto, sans-serif', // Предположим, что Roboto или аналогичный шрифт используется в приложении
            lineHeight: '1.4',
          }}
        >
          <p style={{ margin: 0, marginBottom: '6px', fontWeight: 'bold', color: '#555' }}>{label}</p>
          <p style={{ margin: 0, color: payload[0].stroke || payload[0].fill || '#007bff', fontWeight: '600' }}>
            {`${name}: `}
            <span style={{ fontSize: '1.1rem', marginLeft: '5px' }}>{value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Если данные отсутствуют или пусты, можно отобразить заглушку
  if (!data || data.length === 0) {
    return (
      <div
        className="card h-100 d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "#ffffff",
          border: "none",
          borderRadius: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
          color: '#888',
          fontSize: '1.1rem',
        }}
      >
        <p>{t("No data available to display chart.")}</p>
      </div>
    );
  }

  return (
    <div
      className="card h-100"
      style={{
        backgroundColor: "#d2eff2", // Чистый белый фон карточки
        border: "none", // Убрал основной бордер, полагаемся на тень
        borderRadius: "16px", // Максимально скругленные углы
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)", // Более выраженная, но легкая тень
        overflow: 'hidden', // Скрываем выходящие за границы элементы
        display: 'flex', // Для гибкого содержимого внутри карточки
        flexDirection: 'column', // Элементы располагаются по вертикали
      }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{
          borderBottom: "none", // Убираем границу в шапке
          padding: "20px 30px",
          backgroundColor: "#d2eff2", // Шапка сливается с фоном карточки
          marginBottom: '10px', // Небольшой отступ от контента графика
        }}
      >
        <h6 className="mb-0" style={{ color: "#333", fontSize: "1.3rem", fontWeight: '700', fontFamily: 'Roboto, sans-serif' }}>{title}</h6>
        <select
          className="form-select form-select-sm w-auto"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          style={{
            backgroundColor: "#ffffff",
            color: "#343534",
            border: "1px solid #e0e6ed",
            borderRadius: "10px",
            padding: "8px 15px",
            fontSize: "0.95rem",
            boxShadow: "none",
            cursor: 'pointer',
            minWidth: '120px',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666' width='18px' height='18px'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '12px',
          }}
        >
          <option value="line" style={{ backgroundColor: "#f9fafb", color: "#343534" }}>{t("LineChart")}</option>
          <option value="bar" style={{ backgroundColor: "#f9fafb", color: "#343534" }}>{t("BarChart")}</option>
        </select>
      </div>
      <div className="card-body" style={{ height: 320, padding: "20px" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <AreaChart // Используем AreaChart вместо LineChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 5,
              }}
              transitionDuration={800}
            >
              <defs>
                {/* Градиент для заливки области под линией */}
                <linearGradient id="colorValueArea" x1="0" y1="0" x2="0" y2="2">
                  <stop offset="5%" stopColor="#72b827" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                {/* Градиент для самой линии */}
                <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#72b827" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#343534" strokeDasharray="5 5" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                stroke="#343534"
                fontSize="0.85rem"
                tickFormatter={(value) => value.slice(0, 3)}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#343534"
                fontSize="0.85rem"
                orientation="left"
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e0e6ed', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area // Используем Area вместо Line
                type="monotone"
                dataKey="value"
                stroke="url(#lineColor)" // Применяем градиент к линии
                fill="url(#colorValueArea)" // Применяем градиент к заливке
                strokeWidth={3}
                activeDot={{
                  r: 6,
                  stroke: '#72b827',
                  strokeWidth: 3,
                  fill: '#fff',
                  cursor: 'pointer',
                }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 5,
              }}
              barCategoryGap="20%"
            >
              <defs>
                {/* Градиент для столбцов */}
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#72b827" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f0f2f5" strokeDasharray="5 5" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                stroke="#99a4b3"
                fontSize="0.85rem"
                tickFormatter={(value) => value.slice(0, 3)}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#99a4b3"
                fontSize="0.85rem"
                orientation="left"
                padding={{ top: 10, bottom: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar
                dataKey="value"
                fill="url(#barGradient)" // Применяем градиент к столбцам
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
  );
}