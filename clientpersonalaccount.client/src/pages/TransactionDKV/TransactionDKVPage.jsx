import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable"; // универсальная таблица
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

export default function TransactionDKVPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { token } = useAuth();
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const { t } = useTranslation();

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await apiService.proxyRequest(`/ISDKVManagement/GetTransactions?startDate=${startDate}&endDate=${endDate}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "43",
                }
            })

            if (data?.errorMessage) {
                setError(`${data.errorName || "Ошибка"}: ${data.errorMessage}`);
            } else if (Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
                setError("");
            } else {
                setError("Неожиданная структура ответа");
            }
        } catch (err) {
            setError(err.message || "Ошибка получения данных");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchTransactions();
    }, [token, startDate, endDate]);

    const decoratedTransactions = transactions.map((transaction) => {
        return {
            ...transaction,
            dateCreated: formatDate(transaction.dateCreated),
            amountMDLFormatted: `${transaction.amountMDL?.toFixed(2)} MDL`,
            productPriceFormatted: `${transaction.productPrice?.toFixed(2)} MDL`
        };
    });

    const columns = [
        { key: "dateCreated", label: t("CreateDate"), filterable: true, sortable: true, width: "15%" },
        { key: "terminalID", label: t("IdTerminal"), filterable: true, width: "15%" },
        { key: "product", label: t("Product"), filterable: true, width: "15%" },
        { key: "productQuantity", label: t("ProductQuantity"), filterable: true, width: "15%" },
        { key: "productPriceFormatted", label: t("ProductPrice"), filterable: true, sortable: true, width: "15%" },
        { key: "amountMDLFormatted", label: t("SummaMDL"), filterable: true, width: "15%" },
        { key: "olaAppCode", label: t("CodeActivatedOla"), filterable: true, width: "15%" },
        { key: "stan", label: "Stan", filterable: true, width: "15%" },
        { key: "pan", label: "Pan", filterable: true, sortable: true, width: "15%" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br to-indigo-100 p-0 m-0">
            <div className="w-full px-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent">{t("TransactionDKV")}</h1>
                    <div className="flex gap-4 items-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border px-2 py-1 rounded"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border px-2 py-1 rounded"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
                )}

                <DataTable
                    title={`${t("TransactionDKV")} (${transactions.length})`}
                    columns={columns}
                    data={decoratedTransactions}
                    loading={loading}
                    editable={false}
                    selectableRow={false}
                    onRefresh={fetchTransactions}
                />
            </div>
        </div>
    );
};