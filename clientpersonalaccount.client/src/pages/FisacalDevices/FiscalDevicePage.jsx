import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable";
import LayoutWithSidebar from "../../components/LayoutWithSidebar";
import LongZReport from "./LongZReport";
import { MdReport, MdAssignment, MdReceipt } from "react-icons/md";
import "../../styles/receipt.css";
import "../../styles/receiptTypes.css";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import { FiscalDeviceTypeEnum } from "../../enums/Enums";

export default function FiscalDevicePage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [bills, setBills] = useState([]);
    const [selectedShiftId, setSelectedShiftId] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);
    const [receiptText, setReceiptText] = useState("");
    const [reportModel, setReportModel] = useState(null);
    const [viewMode, setViewMode] = useState("receipt");
    const { t } = useTranslation();

    useEffect(() => {
        if (!id) return;
        fetchShifts(id);
    }, [id]);

    useEffect(() => {
        if (selectedShiftId) fetchBills(id, selectedShiftId);
    }, [selectedShiftId]);

    useEffect(() => {
        if (bills.length > 0) setSelectedBill(bills[0]);
    }, [bills]);

    useEffect(() => {
        if (selectedBill) loadTexts(id, selectedBill);
    }, [selectedBill]);

    const fetchShifts = async (deviceId) => {
        try {
            const data = await apiService.proxyRequest(`/ISFiscalCloudRegister/cabinet/GetShifts?DeviceID=${deviceId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "29",
                }
            })

            setShifts(data.shifts || []);
            if (data.shifts?.length) setSelectedShiftId(data.shifts[0].shiftID);
        } catch {
            setShifts([]);
        }
    };

    const fetchBills = async (deviceId, shiftId) => {
        try {
            const data = await apiService.proxyRequest(`/ISFiscalCloudRegister/cabinet/GetBillsFromShift?DeviceID=${deviceId}&ShiftID=${shiftId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "29",
                }
            })
            setBills(data.bills || []);
        } catch {
            setBills([]);
        }
    };

    const loadTexts = async (deviceId, bill) => {
        const billId = bill.id;

        try {
            const standardJson = await apiService.proxyRequest(`/ISFiscalCloudRegister/cabinet/GetPrintTemplate?ID=${billId}&DeviceID=${deviceId}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "29",
                }
            })

            let decodedText = "";
            try {
                const byteCharacters = atob(standardJson.dataToPrint || "");
                const byteArrays = new Uint8Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteArrays[i] = byteCharacters.charCodeAt(i);
                }
                decodedText = new TextDecoder("utf-8").decode(byteArrays);

                setReceiptText(decodedText);
                setViewMode("receipt");
            } catch (err) {
                console.error("Ошибка декодирования:", err);
                decodedText = "Ошибка декодирования текста.";
            }
        } catch {
            setReceiptText("Ошибка загрузки обычного чека");
        }

        if (bill.reportType === 1) {
            try {
                const zJson = await apiService.proxyRequest(`/ISFiscalCloudRegister/Report/ReportGoods?DeviceID=${deviceId}&ShiftID=${selectedShiftId}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "29",
                    }
                })
                setReportModel(zJson);
            } catch {
                setReportModel(null);
            }
        } else {
            setReportModel(null);
        }
    };

    const iconStyle = {
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
        userSelect: "none",
    };

    const getReportLabel = (bill) => {
        if (!bill) return null;

        if (bill.reportType === 1) {
            return (
                <div title="Отчёт Z" style={{ ...iconStyle, backgroundColor: "#2563eb" }}>
                    Z
                </div>
            );
        }
        if (bill.reportType === 2) {
            return (
                <div title="Отчёт X" style={{ ...iconStyle, backgroundColor: "#16a34a" }}>
                    X
                </div>
            );
        }
        if (bill.type === 2 && bill.reportType === 0) {
            return (
                <div title="Отчёт S" style={{ ...iconStyle, backgroundColor: "#7c3aed" }}>
                    S
                </div>
            );
        }

        return null;
    };

    const getDeviceTypeText = (value) => {
        const type = Object.values(FiscalDeviceTypeEnum).find((t) => t.value === value);
        return type?.label || "-";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("ru-RU");
    };

    const columnsShifts = [
        { key: "shiftID", label: "ID", width: "100px" },
        { key: "createDate", label: t("CreateDate"), width: "" },
    ];

    const decoratedShifts = shifts.map((s) => ({
        ...s, id: s.shiftID,
        createDate: formatDate(s.createDate),
    }));

    const priorityOrder = (bill) => {
        if (bill.reportType === 1) return 1;    // Z - самый высокий приоритет
        if (bill.reportType === 2) return 2;    // X
        if (bill.type === 2 && bill.reportType === 0) return 3;  // S
        return 4;                               // остальные
    };

    const decoratedBills = bills
        .slice()
        .sort((a, b) => priorityOrder(a) - priorityOrder(b))
        .map((bill) => ({
            ...bill,
            reportTypeDisplay: bill.reportType,
            totalAmountDisplay: `${bill.totalAmount.toFixed(2)} MDL`
        }));

    const columnsBills = [
        { key: "reportTypeDisplay", label: "", width: "16%", render: (value, row) => getReportLabel(row), },
        { key: "fiscalReceiptID", label: t("ID"), width: "18%" },
        { key: "totalAmountDisplay", label: t("TotalAmount"), width: "35%" },
        {
            key: "type",
            label: t("Type"),
            filterable: true,
            width: "32%",
            render: (value) => (
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                    {getDeviceTypeText(value)}
                </span>
            ),
        },
    ];

    return (
        <>
            <style>{`
        .receipt-text {
        font-family: 'Courier Prime', monospace;
        text-align: center;
        }
      `}</style>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)_400px] gap-4">
                        <div>
                            <DataTable
                                title={t("Shifts")}
                                columns={columnsShifts}
                                data={decoratedShifts}
                                onRowClick={(row) => setSelectedShiftId(row.id)}
                                selectedRowId={selectedShiftId}
                                selectableRow={true}
                            />
                        </div>
                        <div>
                            <DataTable
                                title={t("Bills")}
                                columns={columnsBills}
                                data={decoratedBills}
                                onRowClick={(row) => setSelectedBill(row)}
                                selectedRowId={selectedBill?.id}
                                selectableRow={true}
                            />
                        </div>
                        <div>
                            <div className="dark:bg-gray-800 dark:text-white rounded-xl shadow-md p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="space-x-4">
                                        <button
                                            className={`text-sm font-medium px-3 py-1 rounded border transition ${viewMode === "receipt"
                                                ? " text-black bg-gradient-to-r from-[#72b827] to-green-600"
                                                : "text-white bg-gradient-to-r from-[#72b827] to-green-600"}`}
                                            onClick={() => setViewMode("receipt")}
                                            disabled={viewMode === "receipt"}
                                        >
                                            <h5 className="text-lg font-semibold">{t("FiscalReceipt")}</h5>
                                        </button>

                                        {selectedBill?.reportType == 1 && (
                                            <button
                                                className={`text-sm font-medium px-3 py-1 rounded border transition ${viewMode === "report"
                                                    ? "bg-gradient-to-r from-[#72b827] to-green-600"
                                                    : "text-white bg-gradient-to-r from-[#72b827] to-green-600"}`}
                                                onClick={() => setViewMode("report")}
                                                disabled={viewMode === "report"}
                                            >
                                                <h5 className="text-lg font-semibold">{t("LongZReport")}</h5>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-sm whitespace-pre-wrap break-words min-h-[200px] dark:bg-gray-800 dark:text-white">
                                    {viewMode === "report" && reportModel ? (
                                        <LongZReport className="dark:bg-gray-800 dark:text-white" model={reportModel} />
                                    ) : (
                                            <pre className="receipt-text dark:bg-gray-800 dark:text-white" >{receiptText || t("SelectBill")}</pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </>
    );
}
