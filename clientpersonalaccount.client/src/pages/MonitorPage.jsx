import React, { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { PieChart } from "../components/PieChart";
import SalesChart from "../components/SalesChart";
import apiService from '../services/apiService';

export default function MonitorPage() {
    //#region вспомогательные атрибуты
    const { t } = useTranslation();
    const [selectedRange, setSelectedRange] = useState("day"); // day/week/month/year
    const [customStartDate, setCustomStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
    });
    const [customEndDate, setCustomEndDate] = useState(() => {
        const d = new Date();
        return d.toISOString().slice(0, 10);
    });
    const [posList, setPosList] = useState([]);
    const [selectedPos, setSelectedPos] = useState([]);
    const [allDevices, setAllDevices] = useState(false);
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState({});
    const [allDevicesChartData, setAllDevicesChartData] = useState({});
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    //#endregion

    //#region  Расчет startDate и endDate по выбранному диапазону
    function getDateRange(range) {
        const now = new Date();
        let start, end;
        if (range === "custom") {
            // Используем даты из состояния
            start = new Date(customStartDate);
            end = new Date(customEndDate);
        } else {
            switch (range) {
                case "day":
                    start = end = now;
                    break;
                case "week":
                    start = new Date(now);
                    start.setDate(now.getDate() - 6);
                    end = now;
                    break;
                case "month":
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = now;
                    break;
                case "year":
                    start = new Date(now.getFullYear(), 0, 1);
                    end = now;
                    break;
                default:
                    start = end = now;
            }
        }
        return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
        };
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
    // Загрузка списка POS
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
        const { startDate, endDate } = getDateRange(selectedRange);

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

            setAllDevicesChartData(formattedData);
        } catch (e) {
            console.error("Error loading All Devices chart", e);
        }
    }, [user, selectedRange, getDateRange, customStartDate, customEndDate]);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const newChartData = {};
        const { startDate, endDate } = getDateRange(selectedRange);

        try {
            if (allDevices) {
                // Группируем по всем устройствам за период
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

                // Группируем сумму по датам всех POS вместе
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
                            title: `POS: ${posList.find((p) => p.posID === result.posID)?.name || result.posID}`,
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
    }, [user, selectedPos, allDevices, selectedRange, loadAllDevicesData, getDateRange, posList, customStartDate, customEndDate]);
    //#endregion

    //#region useEffect
    useEffect(() => {
        if (user) {
            fetchPosList();
            loadAllDevicesData();
        }
    }, [user, customStartDate, customEndDate]);

    // Сброс выбора, если включаем "All Devices"
    useEffect(() => {
        if (allDevices) setSelectedPos([]);
    }, [allDevices, customStartDate, customEndDate]);

    useEffect(() => {
        if (!user) return;
        if (!allDevices && selectedPos.length === 0) return;

        loadData();
    }, [user?.id, allDevices, selectedPos.length, selectedRange, customStartDate, customEndDate]);

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

    return (
        <div id="monitor" className="page-section active dark:bg-gray-700 dark:text-white">
            <div className="top-header mb-4 d-flex justify-content-between align-items-center dark:bg-gray-800 dark:text-white rounded shadow-sm" >
                <h4>{t("Monitoring")}</h4>
                <div className="d-flex align-items-center">
                    <div style={{ marginRight: 40 }}>
                        {/* Dropdown POS */}
                        <div className="dropdown" ref={dropdownRef}>
                            <button
                                className="btn btn-outline-secondary dropdown-toggle text-start dark:text-white"
                                type="button"
                                onClick={() => setIsOpen((prev) => !prev)}
                                style={{ width: 200 }}
                            >
                                {allDevices
                                    ? t("AllDevices")
                                    : selectedPos.length === 0
                                        ? t("SelectPOSdevices")
                                        : `${selectedPos.length} ${t("Selected")}`}
                            </button>

                            <ul
                                className={`dropdown-menu p-2 ${isOpen ? "show" : ""} dark:bg-gray-800 dark:text-white`}
                                style={{ width: 200, maxHeight: "200px", overflowY: "auto" }}
                            >
                                <li
                                    className={`dropdown-item rounded mb-1 ${allDevices ? "bg-success text-white" : "dark:text-white"} dark:hover:bg-gray-700`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAllDevices((prev) => {
                                            const newValue = !prev;
                                            if (newValue) setSelectedPos([]);
                                            return newValue;
                                        });
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    {t("AllDevices")}
                                </li>

                                {posList.map(({ posID, name }) => {
                                    const isSelected = selectedPos.includes(posID);
                                    return (
                                        <li
                                            key={posID}
                                            className={`dropdown-item border rounded mb-1 ${isSelected ? "bg-primary text-white border-primary" : "dark:text-white border-secondary"} ${allDevices ? "disabled text-muted" : ""} dark:bg-gray-700`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!allDevices) togglePos(posID);
                                            }}
                                            style={{ cursor: allDevices ? "not-allowed" : "pointer" }}
                                        >
                                            {name || posID}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Кнопки выбора периода */}
                    <div className="d-flex align-items-center">
                        {["day", "week", "month", "year", "custom"].map((range) => (
                            <button
                                key={range}
                                type="button"
                                className={`btn btn-sm me-2 ${selectedRange === range ? "btn-primary dark:bg-blue-700 dark:border-blue-600 dark:text-white" : "btn-outline-primary dark:border-gray-600 dark:text-white"
                                    }`}
                                onClick={() => setSelectedRange(range)}
                            >
                                {range === "custom" ? t("CustomRange") : t(range.charAt(0).toUpperCase() + range.slice(1))}
                            </button>
                        ))}
                    </div>

                    {/* Если custom выбран — показываем выбор дат */}
                    {selectedRange === "custom" && (
                        <div className="d-flex gap-2 align-items-center ms-3">
                            <label className="mb-0" htmlFor="start-date">{t("StartDate")}:</label>
                            <input
                                id="start-date"
                                type="date"
                                value={customStartDate}
                                max={customEndDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="form-control form-control-sm"
                            />
                            <label className="mb-0" htmlFor="end-date">{t("DateEnd")}:</label>
                            <input
                                id="end-date"
                                type="date"
                                value={customEndDate}
                                min={customStartDate}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="form-control form-control-sm"
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow-1 row g-3 d-flex gap-4 mb-4">
                <div className="col-md-6">
                    <PieChart data={allDevicesChartData} t={t} title={t("OneMonthForAllPOS")} />
                </div>
            </div>
            {/* Правая панель — графики */}
            <div className="flex-grow-1 row g-3">
                {Object.entries(chartData).map(([posID, { title, data }]) => (
                    <div className="col-md-6" key={posID}>
                        <SalesChart title={title} data={data} t={t} />
                    </div>
                ))}
            </div>
        </div>
    );
}
