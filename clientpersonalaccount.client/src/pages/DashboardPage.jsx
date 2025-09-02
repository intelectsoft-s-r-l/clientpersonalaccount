import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import SimplePieChart from "../components/SimplePieChart";
import SalesChart from "../components/SalesChart";
import YearlySalesChart from "../components/YearlySalesChart";
import apiService from '../services/apiService';
import { ChevronDown, Calendar, Download, TrendingUp, Mail, MessageSquare } from 'lucide-react';
import Datepicker from "react-tailwindcss-datepicker";
import dayjs from "dayjs";

export default function DashboardPage() {
    //#region вспомогательные атрибуты
    const { t } = useTranslation();
    const [selectedRange, setSelectedRange] = useState("day");
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [posList, setPosList] = useState([]);
    const [selectedPos, setSelectedPos] = useState([]);
    const [allDevices, setAllDevices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState({});
    const [allDevicesChartData, setAllDevicesChartData] = useState({});
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [yearlyAllDevicesData, setYearlyAllDevicesData] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [period, setPeriod] = useState({ startDate: null, endDate: null });
    //#endregion

    //#region  Расчет startDate и endDate по выбранному диапазону
    function getDateRange(range) {
        const now = dayjs();
        let start, end;
        if (range === "custom") {
            start = period.startDate ? dayjs(period.startDate) : null;
            end = period.endDate ? dayjs(period.endDate) : null;

            // Если одна дата пустая, используем другую
            if (!start && end) start = dayjs(end);
            if (!end && start) end = dayjs(start);
            if (!start && !end) start = end = now;
        } else {
            switch (range) {
                case "day":
                    start = end = now;
                    break;
                case "week":
                    start = now.subtract(6, "day");
                    end = now;
                    break;
                case "month":
                    start = now.startOf("month");
                    end = now;
                    break;
                case "year":
                    start = now.startOf("year");
                    end = now;
                    break;
                default:
                    start = end = now;
            }
        }

        const date = {
            startDate: start.format("YYYY-MM-DD"),
            endDate: end.format("YYYY-MM-DD"),
        };

        return date;
    }
    //#endregion

    const togglePos = (id) => {
        if (selectedPos.includes(id)) {
            setSelectedPos(selectedPos.filter((x) => x !== id));
        } else {
            setSelectedPos([...selectedPos, id]);
        }
    };

    //#region загрузка данных
    const fetchPosList = useCallback(async () => {
        try {
            const resp = await apiService.proxyRequest(`/BINavigatorAPI/ClientPortal/POSitems?CompanyId=${user.CompanyID}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "58",
                },
            })

            setPosList(resp.posItems || []);
        } catch (e) {
            console.error("Error loading POS list", e);
        }
    }, [user]);

    const loadAllDevicesData = useCallback(async () => {
        if (!user) return;

        const now = new Date();
        const year = now.getFullYear();

        const startDate = new Date(year, 0, 1).toISOString().slice(0, 10);
        const endDate = new Date(year, 11, 31).toISOString().slice(0, 10);

        try {
            const data = await apiService.proxyRequest(`/BINavigatorAPI/ClientPortal/DailyTotalsForAllPosByDateRange?companyId=${user.CompanyID}&startDate=${startDate}&endDate=${endDate}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "58",
                },
            })
            if (!data.posSummaryItems) data.posSummaryItems = [];

            const groupedByPosItem = {};
            data.posSummaryItems.forEach((item) => {
                const key = item.avgCheck || "Unknown";
                const date = item.date?.split("T")[0] || "Unknown";
                const amount = typeof item.totalAmount === "number" ? item.totalAmount : 0;

                if (!groupedByPosItem[key]) groupedByPosItem[key] = {};
                if (!groupedByPosItem[key][date]) groupedByPosItem[key][date] = 0;

                groupedByPosItem[key][date] += amount;
            });

            const formattedData = Object.entries(groupedByPosItem).reduce(
                (acc, [posItem, dateMap]) => {
                    const dataArray = Object.entries(dateMap)
                        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                        .map(([date, value]) => ({ date, value }));

                    acc[posItem] = {
                        title: posItem,
                        data: dataArray,
                    };

                    return acc;
                },
                {}
            );

            const yearlyDataArray = aggregateYearlyByMonth(formattedData);
            setYearlyAllDevicesData({
                title: t("AllDevicesYearly"),
                data: yearlyDataArray,
            });
            setAllDevicesChartData(formattedData);
        } catch (e) {
            console.error("Error loading All Devices chart", e);
        }
    }, [user]);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const newChartData = {};
        const { startDate, endDate } = getDateRange(selectedRange);

        try {
            if (allDevices) {
                const data = await apiService.proxyRequest(`/BINavigatorAPI/ClientPortal/DailyTotalsForAllPosByDateRange?companyId=${user.CompanyID}&startDate=${startDate}&endDate=${endDate}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "58",
                    },
                })

                if (!data.posSummaryItems || data.posSummaryItems.length === 0) {
                    setChartData({});
                    setLoading(false);
                    return;
                }

                const start = new Date(startDate);
                const end = new Date(endDate);

                const grouped = {};
                data.posSummaryItems.forEach((item) => {
                    const rawDate = item.date?.split("T")[0];
                    if (!rawDate) return;

                    const currentDate = new Date(rawDate);
                    if (currentDate < start || currentDate > end) return;

                    const amount = typeof item.totalAmount === "number" ? item.totalAmount : 0;

                    if (!grouped[rawDate]) grouped[rawDate] = 0;
                    grouped[rawDate] += amount;
                });

                const aggregatedData = Object.entries(grouped)
                    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                    .map(([date, value]) => ({ date, value }));

                newChartData["allDevices"] = {
                    title: t("AllDevices"),
                    data: aggregatedData,
                };
            } else {
                if (selectedPos.length === 0) {
                    setChartData({});
                    setLoading(false);
                    return;
                }

                const start = new Date(startDate);
                const end = new Date(endDate);

                const results = await Promise.all(
                    selectedPos.map(async (posID) => {
                        try {
                            const data = await apiService.proxyRequest(`/BINavigatorAPI/ClientPortal/DailyTotalsForPos?PosId=${posID}`, {
                                method: "GET",
                                credentials: "include",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-Service-Id": "58",
                                },
                            })
                            if (!data.posSummaryItems || data.posSummaryItems.length === 0) return null;

                            return {
                                posID,
                                data: data.posSummaryItems.map((item) => ({
                                    date: item.date.split("T")[0],
                                    value: item.totalAmount,
                                })),
                            };
                        } catch (err) {
                            console.error(`Error loading data for POS ${posID}`, err);
                            return null;
                        }
                    })
                );

                results.forEach((result) => {
                    if (result) {
                        const filteredData = result.data.filter(({ date }) => {
                            const current = new Date(date);
                            return current >= start && current <= end;
                        });

                        if (filteredData.length === 0) return;

                        newChartData[result.posID] = {
                            title: `${t("device")}: ${posList.find((p) => p.posID === result.posID)?.name || result.posID}`,
                            data: filteredData,
                        };
                    }
                });
            }

            setChartData(newChartData);
        } catch (e) {
            console.error("Error loading chart data", e);
        } finally {
            setLoading(false);
        }
    }, [user, selectedPos, allDevices, selectedRange, loadAllDevicesData, getDateRange, posList, period]);

    const loadTopProducts = useCallback(async () => {
        if (!user) return;

        try {
            const data = await apiService.proxyRequest(
                `/BINavigatorAPI/ClientPortal/top-products?companyId=${user.CompanyID}&dateFrom=${getDateRange(selectedRange).startDate}&dateTo=${getDateRange(selectedRange).endDate}&top=${5}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "58",
                    },
                }
            );

            setTopProducts(data.companyTopProducts || []);
        } catch (e) {
            console.error("Error loading top products", e);
        }
    }, [user, selectedRange, period]);
    //#endregion

    //#region useEffect
    useEffect(() => {
        if (user) {
            fetchPosList();
            loadAllDevicesData();
            loadTopProducts();
        }
    }, [user, selectedRange, period]);

    useEffect(() => {
        if (allDevices) setSelectedPos([]);
    }, [allDevices, period]);

    useEffect(() => {
        if (!user) return;
        if (!allDevices && selectedPos.length === 0) return;

        loadData();
    }, [user?.id, allDevices, selectedPos.length, selectedRange,period]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    //#endregion

    function aggregateYearlyByMonth(dataByDevices) {
        const now = new Date();
        const year = now.getFullYear();

        // Объект для суммирования по месяцам
        const monthlySums = {};

        Object.values(dataByDevices).forEach(({ data }) => {
            data.forEach(({ date, value }) => {
                const d = new Date(date);
                if (d.getFullYear() === year) {
                    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthlySums[monthKey] = (monthlySums[monthKey] || 0) + value;
                }
            });
        });

        // Формируем массив для графика с месяцами от Января до Декабря
        const result = [];
        for (let m = 0; m < 12; m++) {
            const key = `${year}-${String(m + 1).padStart(2, '0')}`;
            result.push({
                date: key,
                value: monthlySums[key] || 0,
            });
        }

        return result;
    }

    const sortedChartEntries = Object.entries(chartData)
        .map(([posID, obj]) => ({ posID, ...obj })) // приводим к массиву объектов с ключом posID
        .sort((a, b) => {
            if (a.data.length === 1 && b.data.length !== 1) return -1;
            if (a.data.length !== 1 && b.data.length === 1) return 1;
            return 0;
        });

    const sortedTopProducts = [...topProducts].sort((a, b) => b.totalSales - a.totalSales);
    const formatDate = (date) => { if (!date) return ""; const d = dayjs(date); const format = d.format("DD.MM.YYYY"); return format; };
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border border-gray-100 rounded-2xl">
                <div className="w-full px-2 py-2 flex flex-wrap justify-start items-center gap-2">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Device Selector */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:border-cyan-400 hover:shadow-md transition"
                            >
                                {allDevices
                                    ? t("AllDevices")
                                    : selectedPos.length === 0
                                        ? t("SelectPOSdevices")
                                        : `${selectedPos.length} ${t("Selected")}`}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {isOpen && (
                                <div className="absolute mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto p-2 z-[9999]">
                                    <div
                                        className={`px-3 py-2 rounded-lg cursor-pointer transition ${allDevices
                                            ? "bg-cyan-50 text-cyan-700 font-semibold"
                                            : "hover:bg-gray-50"
                                            }`}
                                        onClick={() => {
                                            setAllDevices(!allDevices);
                                            if (!allDevices) setSelectedPos([]);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {t("AllDevices")}
                                    </div>
                                    {posList.map(({ posID, name }) => {
                                        const isSelected = selectedPos.includes(posID);
                                        return (
                                            <div
                                                key={posID}
                                                className={`px-3 py-2 rounded-lg cursor-pointer transition ${allDevices
                                                    ? "text-gray-400 cursor-not-allowed"
                                                    : isSelected
                                                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                                                        : "hover:bg-gray-50"
                                                    }`}
                                                onClick={() => !allDevices && togglePos(posID)}
                                            >
                                                {name}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Time Range Buttons */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {["day", "week", "month", "year", "custom"].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setSelectedRange(range)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors hover:scale-105 ${selectedRange === range
                                        ? "bg-white shadow text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {range === "custom"
                                        ? t("CustomRange")
                                        : t(range.charAt(0).toUpperCase() + range.slice(1))}
                                </button>
                            ))}
                        </div>

                        {selectedRange === "custom" && (
                            <div className="max-w-md mx-2 px-2 py-1 space-y-2">

                                <div className="flex gap-2">
                                    {/* От */}
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500">{t("StartDate")}</label>
                                        <Datepicker
                                            asSingle={true}
                                            value={{ startDate: period.startDate, endDate: period.startDate }}
                                            onChange={(newValue) =>
                                                setPeriod(prev => ({
                                                    ...prev, startDate: newValue.startDate
                                                }))
                                            }
                                            primaryColor="cyan"
                                            displayFormat="DD.MM.YYYY"
                                            maxDate={period?.endDate || new Date()}
                                            minDate={new Date(2000, 0, 1)}
                                            inputClassName="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>

                                    {/* До */}
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-500">{t("DateEnd")}</label>
                                        <Datepicker
                                            asSingle={true}
                                            value={{ startDate: period.endDate, endDate: period.endDate }}
                                            onChange={(newValue) =>
                                                setPeriod(prev => ({ ...prev, endDate: newValue.startDate }))
                                            }
                                            primaryColor="cyan"
                                            displayFormat="DD.MM.YYYY"
                                            minDate={period?.startDate || new Date()}
                                            maxDate={new Date()}
                                            inputClassName="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-12xl mx-auto px-6 py-8">
                {/* Top Products */}
                {sortedTopProducts.length > 0 && (
                    <div className="mb-2 p-4 rounded-2xl ">
                        <h2 className="text-xl font-bold mb-2">{t("TopProducts")}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:grid-cols-5 gap-6">
                            {sortedTopProducts.map((product, index) => {
                                const bgClass =
                                    index === 0
                                        ? "bg-yellow-400 text-white"
                                        : index === 1
                                            ? "bg-green-400 text-white"
                                            : index === 2
                                                ? "bg-purple-400 text-white"
                                                : index === 3
                                                    ? "bg-blue-400 text-white"
                                                    : index === 4
                                                        ? "bg-cyan-400 text-white"
                                                        : "bg-gray-50 text-gray-900";

                                return (
                                    <div
                                        key={product.code || `product-${index}`}
                                        className={`${bgClass} p-3 rounded-2xl shadow-lg relative transform hover:scale-105 transition-all duration-300 flex flex-col justify-between`}
                                    >
                                        {index < 5 && (
                                            <div className="absolute -top-3 -right-3 bg-white text-black font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                                                {index + 1}
                                            </div>
                                        )}
                                        <p className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</p>
                                        <p className="text-xl font-bold">{t("TotalSales")}: {product.totalSales}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {/* Верхний ряд с PieChart и годовым графиком */}
                <div className="flex flex-col xl:flex-row gap-8 mb-8">
                    <div className="flex-shrink-0 w-full xl:w-60 p-4 rounded-2xl hover:scale-105 transition-all">
                        <SimplePieChart data={allDevicesChartData} t={t} />
                    </div>

                    {yearlyAllDevicesData && (
                        <div className="flex-1 p-4 rounded-2xl hover:scale-105 transition-all">
                            <YearlySalesChart
                                data={yearlyAllDevicesData.data}
                                t={t}
                            />
                        </div>
                    )}
                </div>

                {/* Ниже — остальные графики в сетке */}
                <div className="space-y-6">
                    {/* Сетка одиночных графиков */}
                    <div className="grid grid-cols-6 gap-6">
                        {Object.entries(sortedChartEntries)
                            .filter(([_, { data }]) => data.length === 1)
                            .map(([posID, { title, data }]) => (
                                <div key={posID} className="col-span-1 hover:scale-105 transition-all">
                                    <SalesChart title={title} data={data} t={t} />
                                </div>
                            ))}
                    </div>

                    {/* Сетка обычных графиков */}
                    <div className="grid grid-cols-6 gap-6">
                        {Object.entries(sortedChartEntries)
                            .filter(([_, { data }]) => data.length > 1)
                            .map(([posID, { title, data }]) => (
                                <div key={posID} className="col-span-2 hover:scale-105 transition-all">
                                    <SalesChart title={title} data={data} t={t} />
                                </div>
                            ))}

                        {loading && (
                            <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-md col-span-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                            </div>
                        )}

                        {!loading && Object.keys(chartData).length === 0 && (
                            <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-md col-span-full">
                                <div className="text-center">
                                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">{t("SelectDevicesToViewAnalytics")}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>

    );
}