import React from 'react';

export default function SimplePieChart({ data, t }) {
    if (!data || typeof data !== "object") return null;
    // Вычисление общей суммы значений
    const allValues = Object.values(data)
        .flatMap(posItem => (posItem?.data ?? []).map(item => item.value ?? 0));

    const totalValue = allValues.reduce((acc, val) => acc + val, 0);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between w-48 h-48">
            <div className="text-center w-full">
                <h6 className="text-lg font-semibold text-gray-800 mb-2">
                    {t("TotalValue")}
                </h6>
                <p className="text-3xl font-bold text-cyan-600">
                    {totalValue.toLocaleString()}
                </p>
            </div>
        </div>
    );
}
