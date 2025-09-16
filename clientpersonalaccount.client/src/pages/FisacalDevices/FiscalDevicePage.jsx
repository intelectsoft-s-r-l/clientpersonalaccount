import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { DataTable } from "../../components/DataTable";
import LongZReport from "./LongZReport";
import "../../styles/receipt.css";
import "../../styles/receiptTypes.css";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import { FiscalDeviceTypeEnum } from "../../enums/Enums";
import QRCode from "qrcode";
import printJS from 'print-js';
import { ShiftMenu } from "../../components/ShiftMenu";
import { exportToExcel } from '../../services/excelService';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "react-modal";
import Datepicker from "react-tailwindcss-datepicker";
import { useParams } from "react-router-dom";

Modal.setAppElement("#root");

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
    const [mevURi, setMevURi] = useState(null);
    const [qr, setQr] = useState(null);
    const { t } = useTranslation();
    const [reportData, setReportData] = useState({
        ReportByPeriod: [],
        ReceiptForPeriod: [],
        ReceiptForPeriodGrouped: [],
        PrintFiscalReportByPeriod: []
    });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentReportType, setCurrentReportType] = useState(null);
    const today = new Date();
    const [period, setPeriod] = useState({
        startDate: today,
        endDate: today,
        startNum: 0,
        endNum: 0,
        detailed: false,
        mode: "date"
    });
    const [selectedReportForShift, setSelectedReportForShift] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [fiscalSummaryText, setFiscalSummaryText] = useState("");
    const [isOpenFiscalSummary, setIsOpenFiscalSummary] = useState(false);

    const printReceipt = () => {
        printJS({
            printable: 'receiptDiv',
            type: 'html',
            scanStyles: false,
            targetStyles: ['*'],
            css: '/path/to/tailwind.css'
        });
    };

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
            if (!deviceId) {
                setShifts([]);
                return;
            }

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
            if (!deviceId || !shiftId) {
                setBills([]);
                return;
            }

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

    async function copyQr(qrText) {
        try {
            // Генерация QR-кода в формате Data URL (PNG)
            const qrUri = await QRCode.toDataURL(qrText, { width: 240, margin: 1 });
            return qrUri;
        } catch (err) {
            console.error("Ошибка при генерации QR:", err);
            return null;
        }
    }

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

                if (standardJson.mevURI) {
                    try {
                        const qrReceipt = await copyQr(standardJson.mevURI);
                        setQr(qrReceipt);
                    } catch (err) {
                        console.error("Ошибка при копировании QR:", err);
                    }
                }

                setMevURi(standardJson.mevURI);
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
        const type = Object.values(FiscalDeviceTypeEnum(t)).find((t) => t.value === value);
        return type?.label || "-";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
            totalAmountDisplay: `${bill.totalAmount.toFixed(2)} MDL`,
            date: formatDate(bill.date),
        }));

    const columnsBills = [
        { key: "reportTypeDisplay", label: "", width: "16%", render: (value, row) => getReportLabel(row), },
        { key: "date", label: t("Date"), width: "" },
        { key: "fiscalReceiptID", label: t("ID"), width: "18%" },
        { key: "totalAmountDisplay", label: t("TotalAmount"), width: "35%" },
        {
            key: "paymentType",
            label: t("Type"),
            width: "32%"
        },
    ];

    const payload = {
        startDate: period.startDate?.toISOString().split("T")[0],
        endDate: period.endDate?.toISOString().split("T")[0]
    };

    const loadReports = async () => {
        setPdfUrl(null);
        setFiscalSummaryText(null);

        if (!id) return;

        try {
            if (currentReportType === "FiscalSummary") {
                if (period.startNum > 0 && period.endNum > 0) {
                    payload.startDate = null;
                    payload.endDate = null;
                }

                payload.startNum = payload.startDate ? 0 : period.startNum || 0;
                payload.endNum = payload.endDate ? 0 : period.endNum || 0;
                payload.detailed = period.detailed || false;

                const data = await apiService.proxyRequest(
                    `/ISFiscalCloudRegister/Report/ZForPeriod?DeviceID=${id}&startDate=${payload.startDate}&endDate=${payload.endDate}&startNum=${payload.startNum}&endNum=${payload.endNum}&detailed=${payload.detailed}&printTemplate=44`,
                    { method: "GET" }
                );

                if (data?.dataToPrint) {
                    // Декодируем Base64 в текст
                    const byteCharacters = atob(data.dataToPrint);
                    const byteArrays = new Uint8Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteArrays[i] = byteCharacters.charCodeAt(i);
                    }
                    const decodedText = new TextDecoder("utf-8").decode(byteArrays);

                    setFiscalSummaryText(decodedText);
                    setIsOpenFiscalSummary(true);
                }

                exportToExcel(data || [], "FiscalSummary.xlsx");
            }
            else if (currentReportType === "KKMJournal") {
                kkmJournal();
            } else if (currentReportType == "DownloadKKMJournal") {
                handleDownloadKKMJournal();
            }
            else {
                const data = await apiService.proxyRequest(
                    `/ISFiscalCloudRegister/Report/ReportGoodsPeriod?DeviceID=${id}&startDate=${payload.startDate}&endDate=${payload.endDate}`,
                    { method: "GET" }
                );

                const reportByPeriod = data.ReportByPeriod || [];
                const receiptForPeriod = data.fiscalReceiptItems || [];

                if (currentReportType === "ReceiptForPeriod") {
                    setReportData({ ReceiptForPeriod: receiptForPeriod });
                    exportToExcel(receiptForPeriod, "ReceiptForPeriod.xlsx");
                } else if (currentReportType === "ReceiptForPeriodGrouped") {
                    const receiptGrouped = receiptForPeriod.reduce((acc, item) => {
                        const date = new Date(item.receiptDate).toLocaleDateString("ru-RU");
                        const key = `${date}-${item.name}`;
                        if (!acc[key]) {
                            acc[key] = {
                                ReceiptDate: date,
                                Name: item.name,
                                TotalQuantity: 0,
                                TotalAmount: 0,
                                BasePrice: item.basePrice,
                                TotalDiscount: 0,
                                TotalTax: 0
                            };
                        }
                        acc[key].TotalQuantity += item.quantity;
                        acc[key].TotalAmount += item.totalCost;
                        acc[key].TotalDiscount += item.discount?.amount || 0;
                        acc[key].TotalTax += item.tax?.amount || 0;
                        return acc;
                    }, {});

                    const groupedData = Object.values(receiptGrouped).map(item => ({
                        ReceiptDate: String(item.ReceiptDate || ""),
                        Name: String(item.Name || ""),
                        TotalQuantity: Number(item.TotalQuantity || 0),
                        TotalAmount: Number((item.TotalAmount || 0).toFixed(2)),
                        BasePrice: Number(item.BasePrice || 0),
                        TotalDiscount: Number((item.TotalDiscount || 0).toFixed(2)),
                        TotalTax: Number((item.TotalTax || 0).toFixed(2))
                    }));

                    setReportData({ ReceiptForPeriodGrouped: groupedData });

                    exportToExcel(groupedData, "ReceiptForPeriodGrouped.xlsx");
                }
            }
            closeReportModal();
        } catch (err) {
            console.error("Ошибка загрузки отчетов:", err);
            setReportData({
                ReportByPeriod: [],
                ReceiptForPeriod: [],
                ReceiptForPeriodGrouped: [],
                PrintFiscalReportByPeriod: []
            });
        }
    };

    const handleDownloadKKMJournal = async () => {
        if (!id) return;

        try {
            // Загружаем данные KKMJournal
            const data = await apiService.proxyRequest(
                `/ISFiscalCloudRegister/Report/RegisterForPeriod?DeviceID=${id}&startDate=${payload.startDate}&endDate=${payload.endDate}`,
                { method: "GET" }
            );

            if (!data) {
                return;
            }

            // Генерируем PDF
            const doc = generateKKMJournalPDF(data, payload.startDate, payload.endDate);
            doc.save(`KKMJournal_${payload.startDate}_${payload.endDate}.pdf`);
        } catch (err) {
            console.error("Ошибка при скачивании KKMJournal:", err);
        }
    };

    const generateKKMJournalPDF = (data, startDate, endDate) => {
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;

        pdf.setFontSize(10);
        pdf.text(`${data.company}, Cod Fiscal: ${data.companyIDNO}`, pageWidth / 2, 30, { align: "center" });
        pdf.text(
            `Registrul electronic MCC/IF de la ${new Date(startDate).toLocaleDateString("ro-RO")} pana la ${new Date(endDate).toLocaleDateString("ro-RO")}`,
            pageWidth / 2,
            45,
            { align: "center" }
        );
        pdf.text(`Numarul de inregistrare: ${data.registrationNumber}, Adresa: ${data.salesPointAddress}`, pageWidth / 2, 60, { align: "center" });

        // Dynamic headers
        const dynamicTaxHeaders = data.taxesMapping?.map((tax) => {
            return {
                content: `Valoarea rulajului pe cota ${tax.taxCode} / Valoarea T.V.A. pe cota ${tax.taxCode}`,
                styles: {
                    cellWidth: 60
                }
            };
        }) || [];

        const head = [
            [
                {
                    content: "Nr. / curent al inscrierii", styles: {
                        cellWidth: 30
                    }, rowSpan: 2
                },
                {
                    content: "Nr. raportului de inchidere zilnica / Data raportului de inchidere zilnica", styles: {
                        cellWidth: 70
                    }, rowSpan: 2
                },
                {
                    content: "Valoare totala a rulajului inregistrat de la inceputul anului gestionar(lei)/ Valoarea totala a T.V.A. inregistrate de la inceputul anului gestionar(lei)", styles: {
                        cellWidth: 70
                    }, rowSpan: 2
                },
                {
                    content: "Rulajul (lei) inregistrat, conform cu raportul de inchidere zilnica emis la sfarsitul perioadei de gestiune / Valorile T.V.A. (lei) pe cotele aferente", colSpan: dynamicTaxHeaders.length
                },
                {
                    content: "Suma predata in casierie / incasatorului in timpul perioadei de gestiune", styles: {
                        cellWidth: 70
                    }, rowSpan: 2
                },
                {
                    content: "Suma restituita consumatorilor in timpul perioadei de gestiune", styles: {
                        cellWidth: 70
                    }, rowSpan: 2
                },
                {
                    content: "Suma achitata (confirmata) cu (prin) alte instrumente (documente) de plata", styles: {
                        cellWidth: 70
                    }, rowSpan: 2
                },
                {
                    content: "Suma achitata (confirmata) cu (prin) tichet de masa pe suport de hârtie /pe suport electronic", styles: {
                        cellWidth: 70
                    }, rowSpan: 2
                },
                {
                    content: "Soldul de numerar din caseta de bani a MCC/IF la sfarsitul perioadei de gestiune /Suma totala a restului nerambursat din valoarea nominala a tichetului de masa pe suport de hartie ('rest TMH')", styles: {
                        cellWidth: 120
                    }, rowSpan: 2
                }
            ],
            dynamicTaxHeaders
        ];

        const body = data.reports?.flatMap((report, idx) => {
            const brutRow = [
                idx + 1,
                report.reportNumber ?? "",
                Number(report.grandTotalBrut ?? 0).toFixed(2),
                Number(report.totalBrut ?? 0).toFixed(2),
                ...(data.taxesMapping?.map((tax) => {
                    const taxItem = report.taxes?.find((t) => t.taxCode === tax.taxCode);
                    return Number(taxItem?.brut ?? 0).toFixed(2);
                }) || []),
                Number(report.cashIn ?? 0).toFixed(2),
                Number(report.cashOutCollect ?? 0).toFixed(2),
                Number(report.cashOutRefund ?? 0).toFixed(2),
                Number(report.totalOther ?? 0).toFixed(2),
                Number(report.totalTME ?? 0).toFixed(2),
                Number(report.totalInBox ?? 0).toFixed(2)
            ];

            const taxRow = [
                "", // empty for rowspan
                new Date(report.reportDate).toLocaleString("ro-RO"),
                Number(report.grandTotalTax ?? 0).toFixed(2),
                Number(report.totalTax ?? 0).toFixed(2),
                ...(data.taxesMapping?.map((tax) => {
                    const taxItem = report.taxes?.find((t) => t.taxCode === tax.taxCode);
                    return Number(taxItem?.tax ?? 0).toFixed(2);
                }) || []),
                "", "", "", "", "", "" // empty fields for the rest of the row
            ];

            return [brutRow, taxRow];
        }) || [];

        // Table styles
        autoTable(pdf, {
            head: head,
            body: body,
            startY: 80,
            theme: "grid",
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 8,
                halign: "center",
                valign: "top",
                cellPadding: 3,
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
                overflow: "linebreak",
            },
            headStyles: {
                fontStyle: "bold",
                fillColor: [255, 255, 255], // Серый фон для заголовков
                minCellHeight: 80, // Увеличиваем высоту ячеек заголовка для многострочного текста
            },
        });

        return pdf;
    };

    const kkmJournal = async () => {
        const data = await apiService.proxyRequest(
            `/ISFiscalCloudRegister/Report/RegisterForPeriod?DeviceID=${id}&startDate=${payload.startDate}&endDate=${payload.endDate}`,
            { method: "GET" }
        );

        if (!data) return;

        const pdf = generateKKMJournalPDF(data, payload.startDate, payload.endDate);

        const pdfBlob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(blobUrl);
        setIsOpenFiscalSummary(true);
    };

    const openReportModal = (reportType) => {
        setCurrentReportType(reportType);
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
        setPeriod({ startDate: today, endDate: today });
    };

    return (
        <>
            <style>{`
        .receipt-text {
        font-family: 'Courier Prime', monospace;
        text-align: center;
        }
      `}</style>
            <div className="p-6 overflow-y-auto">
                <div className="flex flex-wrap gap-4">
                    <div className="w-full md:w-[300px]">
                        <DataTable
                            title={t("Shifts")}
                            columns={columnsShifts}
                            data={decoratedShifts}
                            onRowClick={(row) => setSelectedShiftId(row.id)}
                            selectedRowId={selectedShiftId}
                            selectableRow={true}
                            onRefresh={() => fetchShifts(id)}
                            customHeader={() => (
                                <ShiftMenu openReportModal={openReportModal} t={t} />
                            )}
                        />
                    </div>
                    <div className="w-full md:flex-1">
                        <DataTable
                            title={t("Bills")}
                            columns={columnsBills}
                            data={decoratedBills}
                            onRowClick={(row) => setSelectedBill(row)}
                            selectedRowId={selectedBill?.id}
                            selectableRow={true}
                            onRefresh={() => fetchBills(id, selectedShiftId)}
                        />
                    </div>
                    <div className="w-full md:w-[400px]">
                        <div className="dark:bg-gray-800 dark:text-white rounded-xl shadow-md p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="space-x-4">
                                    <button
                                        className={`text-white text-sm font-medium px-3 py-1 rounded border transition ${viewMode === "receipt"
                                            ? " text-black bg-gradient-to-r from-[#72b827] to-green-600"
                                            : "text-white bg-gradient-to-r from-[#72b827] to-green-600"}`}
                                        onClick={() => setViewMode("receipt")}
                                        disabled={viewMode === "receipt"}
                                    >
                                        <h5 className="text-lg font-semibold">{t("FiscalReceipt")}</h5>
                                    </button>
                                    {selectedBill?.reportType == 1 && (
                                        <button
                                            className={` text-white text-sm font-medium px-3 py-1 rounded border transition ${viewMode === "report"
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
                                    <div className="billStyle PrintArea">
                                        <input id="dId" value={id} type="hidden" />
                                        <input id="Id" value={selectedBill?.id || ""} type="hidden" />

                                        <div className="receipt" id="receiptDiv">
                                            <div className="receiptBody flex flex-col items-center">
                                                <div className="contentReceipt flex flex-col items-center">
                                                    <pre className="receipt-text text-center">{receiptText || t("SelectBill")}</pre>

                                                    {mevURi && (
                                                        <div className="mt-2 text-center" style={{ fontSize: "87.5%" }}>
                                                            Copie a bonului fiscal
                                                            <br />
                                                            Verificați aici:
                                                            <br />
                                                            <img
                                                                src={qr || ""}
                                                                width="100px"
                                                                height="100px"
                                                                alt="QR Code"
                                                                className="mx-auto mt-1"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="noPrint text-center mt-3">
                                            {mevURi && (
                                                <div>
                                                    <a
                                                        href={mevURi}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ textDecoration: "underline", color: "black" }}
                                                    >
                                                        {t("CheckMEV")}
                                                    </a>
                                                </div>
                                            )}
                                            <div className="mt-3">
                                                <button
                                                    id="printNext"
                                                    className="btn btn-contained"
                                                    style={{ width: 140 }}
                                                    onClick={() => printReceipt()}
                                                >
                                                    {t("Print")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {isReportModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeReportModal}>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[400px]" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold mb-4">{t("SelectPeriod")}</h3>
                                {/* Для FiscalSummary показываем переключатель */}
                                {currentReportType === "FiscalSummary" && (
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="mode"
                                                checked={period.mode === "date"}
                                                onChange={() => setPeriod((prev) => ({ ...prev, mode: "date" }))}
                                            />
                                            <span>{t("Date")}</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="mode"
                                                checked={period.mode === "range"}
                                                onChange={() => setPeriod((prev) => ({ ...prev, mode: "range" }))}
                                            />
                                            <span>{t("Range")}</span>
                                        </label>
                                    </div>
                                )}

                                {/* Если выбран режим по датам */}
                                {(!currentReportType || period.mode === "date" || period.mode === undefined) && (
                                    <div className="flex flex-col gap-3 mb-4">
                                        <label className="text-sm font-medium">{t("StartDate")}:</label>
                                        <Datepicker
                                            asSingle
                                            value={{ startDate: period.startDate, endDate: period.startDate }}
                                            onChange={(val) =>
                                                setPeriod((prev) => ({ ...prev, startDate: val.startDate }))
                                            }
                                            primaryColor="cyan"
                                            displayFormat="DD.MM.YYYY"
                                            maxDate={period?.endDate || new Date()}
                                            minDate={new Date(2000, 0, 1)}
                                            inputClassName="w-full px-4 py-2 text-sm border rounded"
                                        />

                                        <label className="text-sm font-medium">{t("DateEnd")}:</label>
                                        <Datepicker
                                            asSingle
                                            value={{ startDate: period.endDate, endDate: period.endDate }}
                                            onChange={(val) =>
                                                setPeriod((prev) => ({ ...prev, endDate: val.startDate }))
                                            }
                                            primaryColor="cyan"
                                            displayFormat="DD.MM.YYYY"
                                            minDate={period?.startDate || new Date()}
                                            maxDate={new Date()}
                                            inputClassName="w-full px-4 py-2 text-sm border rounded"
                                        />
                                    </div>
                                )}

                                {/* Если выбран режим по диапазону (только для FiscalSummary) */}
                                {currentReportType === "FiscalSummary" && period.mode === "range" && (
                                    <div className="flex flex-col gap-3 mb-4">
                                        <label className="text-sm font-medium">{t("RangeStart")}:</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={period.startNum || ""}
                                            onChange={(e) =>
                                                setPeriod((prev) => ({ ...prev, startNum: Number(e.target.value) }))
                                            }
                                            className="w-full px-4 py-2 text-sm border rounded"
                                        />

                                        <label className="text-sm font-medium">{t("RangeEnd")}:</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={period.endNum || ""}
                                            onChange={(e) =>
                                                setPeriod((prev) => ({ ...prev, endNum: Number(e.target.value) }))
                                            }
                                            className="w-full px-4 py-2 text-sm border rounded"
                                        />
                                    </div>

                                )}

                                {/* Чекбокс "детально" только для FiscalSummary */}
                                {currentReportType === "FiscalSummary" && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="checkbox"
                                            checked={period.detailed || false}
                                            onChange={(e) =>
                                                setPeriod((prev) => ({ ...prev, detailed: e.target.checked }))
                                            }
                                        />
                                        <span>{t("Detailed")}</span>
                                    </div>
                                )}

                                {/* Кнопки */}
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={closeReportModal}
                                        className="px-4 py-2 rounded border"
                                    >
                                        {t("Cancel")}
                                    </button>
                                    <button
                                        onClick={loadReports}
                                        className="px-4 py-2 rounded bg-green-600 text-white"
                                    >
                                        {t("Load")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    <Modal
                        isOpen={isOpenFiscalSummary}
                        onRequestClose={() => setIsOpenFiscalSummary(false)}
                        contentLabel="Сводный отчет"
                        style={{
                            content: {
                                top: "5%",
                                left: "15%",
                                right: "15%",
                                bottom: "5%",
                                width: "70%",
                                height: "80%",
                                padding: "20px",
                                overflow: "auto"
                            },
                        }}
                    >
                        <button
                            className="mb-3 px-3 py-1 bg-red-600 text-white rounded"
                            onClick={() => setIsOpenFiscalSummary(false)}
                        >
                            {t("Close")}
                        </button>
                        {pdfUrl && (
                            <iframe
                                src={pdfUrl}
                                title="KKM Journal PDF"
                                width="100%"
                                height="100%"
                                style={{ border: "none" }}
                            />
                        )}

                        {fiscalSummaryText && (
                            <pre className="whitespace-pre-wrap font-mono text-center">{fiscalSummaryText}</pre>
                        )}
                    </Modal>
                </div>
            </div>
        </>
    );
}