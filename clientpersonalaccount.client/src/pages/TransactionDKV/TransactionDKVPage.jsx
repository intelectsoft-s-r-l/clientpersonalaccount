import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import Datepicker from "react-tailwindcss-datepicker";
import dayjs from "dayjs";

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

export default function TransactionDKVPage() {
    const { t } = useTranslation();
    const { token } = useAuth();

    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const [startDate, setStartDate] = useState({ startDate: sixMonthsAgo });
    const [endDate, setEndDate] = useState({ startDate: today });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const startStr = startDate.startDate ? dayjs(startDate.startDate) : null;
            const endStr = endDate.startDate ? dayjs(endDate.startDate) : null;

            const start = startStr?.format("YYYY-MM-DD");
            const end = endStr?.format("YYYY-MM-DD");

            const data = await apiService.proxyRequest(
                `/ISDKVManagement/GetTransactions?startDate=${start}&endDate=${end}`,
                { method: "GET", credentials: "include", headers: { "Content-Type": "application/json", "X-Service-Id": "43" } }
            );
            if (data?.errorMessage) {
                setError(`${data.errorName || "Ошибка"}: ${data.errorMessage}`);
            } else if (Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
                setError("");
            } else {
                setError(t("InternalError"));
            }
        } catch (err) {
            setError(err.message || t("InternalError"));
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchTransactions();
    }, [token, startDate, endDate]);

    const decoratedTransactions = transactions.map((transaction) => {
        const date = new Date(transaction.dateCreated);
        return {
            ...transaction,
            dateCreatedDisplay: date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false }),
            dateCreated: date,
            amountMDLFormatted: `${transaction.amountMDL?.toFixed(2)} MDL`,
            productPriceFormatted: `${transaction.productPrice?.toFixed(2)} MDL`
        };
    });

    const columns = [
        {
            key: "dateCreatedDisplay",
            label: t("CreateDate"),
            filterable: true,
            sortable: true,
            width: "15%",
            sortField: "dateCreated",
        },
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
                <div className="flex justify-between items-center mb-6 gap-4">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent leading-normal">
                        {t("TransactionDKV")}
                    </h1>

                    <div className="flex gap-4 items-center">
                        {/* От */}
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">{t("StartDate")}</label>
                            <Datepicker
                                asSingle={true}
                                value={{ startDate: startDate.startDate, endDate: startDate.startDate }}
                                onChange={setStartDate}
                                primaryColor="cyan"
                                displayFormat="DD.MM.YYYY"
                                maxDate={endDate?.endDate || new Date()}
                                minDate={new Date(2000, 0, 1)}
                                inputClassName="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                            />
                        </div>

                        {/* До */}
                        <div className="flex-1">
                            <label className="text-xs text-gray-500">{t("DateEnd")}</label>
                            <Datepicker
                                asSingle={true}
                                value={{ startDate: endDate.startDate, endDate: endDate.startDate }}
                                onChange={setEndDate}
                                primaryColor="cyan"
                                displayFormat="DD.MM.YYYY"
                                minDate={startDate?.startDate || new Date()}
                                inputClassName="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                            />
                        </div>
                    </div>
                </div>


                <DataTable
                    title={`${t("TransactionDKV")} (${transactions.length})`}
                    columns={columns}
                    data={decoratedTransactions}
                    loading={loading}
                    editable={false}
                    selectableRow={false}
                    onRefresh={fetchTransactions}
                    tableClassName="min-w-[1600px]"
                />
            </div>
        </div>
    );
}
