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
import CourierPrime from '../../fonts/CourierPrime-Regular-BpSU6fVE.ttf';
import Toast from "../../components/Toast";

Modal.setAppElement("#root");

function formatPricesInReceipt(text) {
    return text.replace(/(\d+)[.,](\d{2})(?=\s|$)/g, (_, intPart, decPart) => {
        const num = parseFloat(intPart.replace(/\s/g, '') + '.' + decPart);
        return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
}

export default function FiscalDevicePage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [bills, setBills] = useState([]);
    const [selectedShiftId, setSelectedShiftId] = useState(null);
    const [selectedShiftGuid, setSelectedShiftGuid] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);
    const [receiptText, setReceiptText] = useState("");
    const [reportModel, setReportModel] = useState(null);
    const [viewMode, setViewMode] = useState(() => {
        // Инициализация при первом рендере
        if (receiptText) return "receipt";
        if (selectedBill?.reportType === 1 && reportModel) return "report";
        return null; // ничего не показываем пока нет данных
    });
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
    const [currentReportName, setCurrentReportName] = useState(null);
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
    const [isOpenKkmJournal, setIsOpenKkmJournal] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(null);
    const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
    const [showWarningMessage, setShowWarningMessage] = useState(null);
    const [modalHeight, setModalHeight] = useState("auto");

    const printReceipt = () => {
        // проверка режима (vite)
        const mode = import.meta.env.MODE;

        let baseUrl = null;
        switch (mode) {
            case "devrelease": // аналог DEVRELEASE
                baseUrl = "https://freceipt.edi.md";
                break;
            case "production": // аналог RELEASE
            default:
                baseUrl = "https://freceipt.edi.md";
                break;
        }

        const receiptUrl = `${baseUrl}/ReceiptPrint/${selectedShiftGuid}/${id}`;
        // Если нужно печатать Z-подробный чек через системную печать
        const receiptDiv = document.getElementById("receiptDiv");

        if (receiptDiv && mode == "development") {
            printJS({
                printable: receiptDiv,
                type: "html",
                scanStyles: false,
                targetStyles: ["*"]
            });
        } else {
            // если нужно просто открыть URL печати для чека
            window.open(receiptUrl, "_blank");
        }
    };

    useEffect(() => {
        // Автоматическое переключение, если receiptText появился или пропал
        if (!receiptText && selectedBill?.reportType === 1 && reportModel) {
            setViewMode("report");
        } else if (receiptText && viewMode !== "receipt") {
            setViewMode("receipt");
        }
    }, [receiptText, reportModel, selectedBill]);

    useEffect(() => {
        if (!id) return;
        fetchShifts(id);
    }, [id]);

    useEffect(() => {
        setSelectedBill(null);
        if (selectedShiftId) fetchBills(id, selectedShiftId);
    }, [selectedShiftId]);

    useEffect(() => {
        if (bills.length > 0) setSelectedBill(bills[0]);
    }, [bills]);

    useEffect(() => {
        if (selectedBill) {
            loadTexts(id, selectedBill);
        }
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
            if (data.shifts?.length) { setSelectedShiftId(data.shifts[0].shiftID); setSelectedShiftGuid(data.shifts[0].id); }
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

            if (standardJson && standardJson.dataToPrint == '') {
                setMevURi(null);
                setReceiptText(null);
            }

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
                decodedText = formatPricesInReceipt(decodedText);
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

    const getReportLabel = (reportType, type) => {
        if (reportType === 1) {
            return (
                <div className="flex justify-center items-center" style={{ ...iconStyle, backgroundColor: "#2563eb" }}>
                    Z
                </div>
            );
        } else
            if (reportType === 2) {
                return (
                    <div style={{ ...iconStyle, backgroundColor: "#16a34a" }}>
                        X
                    </div>
                );
            } else
                if (type === 2 && reportType === 0) {
                    return (
                        <div style={{ ...iconStyle, backgroundColor: "#7c3aed" }}>
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
        { key: "shiftID", label: "ID", minWidth: 10 },
        { key: "createDate", label: t("CreateDate"), minWidth: 10 },
    ];

    const decoratedShifts = shifts
        .slice()
        .sort((a, b) => new Date(b.createDate) - new Date(a.createDate)) // самые новые сверху
        .map((s) => ({
            ...s,
            createDate: formatDate(s.createDate),
        }));

    const priorityOrder = (bill) => {
        if (bill.reportType === 1) return 1;    // Z - самый высокий приоритет
        if (bill.reportType === 2) return 2;    // X
        if (bill.type === 2 && bill.reportType === 0) return 3;  // S    
        return 4;// остальные
    };

    const decoratedBills = bills
        .slice()
        .sort((a, b) => priorityOrder(a) - priorityOrder(b))
        .map((bill) => ({
            ...bill,
            totalAmountDisplay: `${bill.totalAmount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })} MDL`,
            date: formatDate(bill.date)
        }));

    const columnsBills = [
        { key: "reportType", label: "", width: 40, render: (value, row) => getReportLabel(row.reportType, row.type), },
        { key: "date", label: t("Date"), width: 140 },
        { key: "fiscalReceiptID", label: t("ID"), width: 50 },
        { key: "totalAmountDisplay", label: t("TotalAmount"), width: 120 },
        {
            key: "paymentType",
            label: t("Type"),
            width: 100
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
                else {
                    setShowWarningMessage(t("NothingToDisplay"));
                    setIsWarningModalVisible(true);
                    return;
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

                if (!receiptForPeriod) {
                    setShowWarningMessage(t("NothingToDisplay"));
                    setIsWarningModalVisible(true);
                    return;
                }

                if (currentReportType === "ReceiptForPeriod") {
                    receiptForPeriodExcel(receiptForPeriod);
                } else if (currentReportType === "ReceiptForPeriodGrouped") {
                    receiptForPeriodGroupedExcel(receiptForPeriod);
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

    const receiptForPeriodExcel = (receiptForPeriod) => {
        const paymentTypeMap = {
            1: "NUMERAR",
            2: "CARD",
            31: "VAUCHER",
            32: "CEC_CERTIFICAT_VALORIC",
            33: "TICHET",
            5: "TME",
            6: "ABONAMENT",
            7: "ALT_IP",
            81: "CREDIT",
            82: "LEASING",
            83: "AVANS",
            84: "ARVUNA",
            85: "GAJ",
            86: "CARD_VALORIC_CORPORATIV",
            87: "TESTARE_METROLOGICA",
            88: "ALT_MOD",
        };

        const formattedData = receiptForPeriod.map(item => {
            const date = new Date(item.receiptDate);

            // Собираем строку всех типов платежей
            const paymentsTypes = item.payments
                ?.map(p => paymentTypeMap[p.type] || p.type)
                .join(", ") || "";

            // Ищем CARD платеж с BankResponse
            let paymentCardOwner = "";
            if (item.payments) {
                const cardPayment = item.payments.find(p => p.type === 2 && p.bankResponse);
                if (cardPayment) {
                    try {
                        const bankResponse = JSON.parse(cardPayment.bankResponse);
                        paymentCardOwner = bankResponse.bank_owner || "";
                    } catch {
                        paymentCardOwner = "";
                    }
                }
            }

            return {
                ...item,
                formattedDate: date.toLocaleDateString("ro-RO"),
                formattedTime: date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false }),
                discountAmount: item.discount?.amount,
                taxAmount: item.tax.amount,
                taxPercent: item.tax.percent,
                paymentsTypes,
                paymentCardOwner
            };
        });

        formattedData.sort((a, b) => {
            const dateA = new Date(`${a.formattedDate} ${a.formattedTime}`);
            const dateB = new Date(`${b.formattedDate} ${b.formattedTime}`);
            return dateA - dateB; // возрастание
        });

        const hasPaymentCardOwner = formattedData.some(item => item.paymentCardOwner);

        const columns = [
            { key: "deviceNumber", header: "Număr de înregistrare", width: 20, alignment: "center", bgColor: "#a0a0a0" },
            { key: "deviceFactory", header: "Numărul SFS", width: 15, alignment: "center", bgColor: "#a0a0a0" },
            { key: "formattedDate", header: "Data", width: 15, alignment: "center", numFormat: "dd.mm.yyyy", bgColor: "#a0a0a0" },
            { key: "formattedTime", header: "Ora", width: 10, alignment: "center", bgColor: "#a0a0a0" },
            { key: "reportNumber", header: "Nr Raport", width: 15, bgColor: "#a0a0a0" },
            { key: "receiptNumber", header: "Nr Bon", width: 15, bgColor: "#a0a0a0" },
            { key: "name", header: "Denumire marfa", width: 20, bgColor: "#a0a0a0" },
            { key: "quantity", header: "Cantitate", width: 15, alignment: "right", bgColor: "#a0a0a0" },
            { key: "basePrice", header: "Pret", width: 10, alignment: "right", bgColor: "#a0a0a0" },
            { key: "totalCost", header: "Suma cu TVA fără reducere", width: 25, alignment: "right", bgColor: "#a0a0a0" },
            { key: "discountAmount", header: "Reducere", width: 10, alignment: "right", bgColor: "#a0a0a0" },
            { key: "taxAmount", header: "Suma TVA", width: 10, alignment: "right", bgColor: "#a0a0a0" },
            { key: "taxPercent", header: "TVA%", width: 10, alignment: "right", bgColor: "#a0a0a0" },
            { key: "paymentsTypes", header: t("PaymentsTypes"), width: 35, alignment: "left", bgColor: "#a0a0a0" }
        ];

        if (hasPaymentCardOwner) {
            columns.push({ key: "paymentCardOwner", header: t("PaymentCardOwner"), width: 20, alignment: "center", bgColor: "#a0a0a0" });
        }

        exportToExcel(formattedData, "ReceiptForPeriod.xlsx", columns);
    }

    const receiptForPeriodGroupedExcel = (receiptForPeriod) => {
        // Группировка по дате и имени товара
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

        // Сортировка: по дате возрастание, потом по имени
        groupedData.sort((a, b) => {
            const dateA = new Date(a.ReceiptDate);
            const dateB = new Date(b.ReceiptDate);
            if (dateA - dateB !== 0) return dateA - dateB;
            return a.Name.localeCompare(b.Name);
        });

        const columns = [
            { key: "ReceiptDate", header: "Data", width: 15, alignment: "center", bgColor: "#a0a0a0" },
            { key: "Name", header: "Denumire marfa", width: 25, alignment: "left", bgColor: "#a0a0a0" },
            { key: "TotalQuantity", header: "Cantitate", width: 15, alignment: "right", bgColor: "#a0a0a0" },
            { key: "BasePrice", header: "Pret", width: 15, alignment: "right", bgColor: "#a0a0a0" },
            { key: "TotalAmount", header: "Suma cu TVA fără reducere", width: 25, alignment: "right", bgColor: "#a0a0a0" },
            { key: "TotalDiscount", header: "Reducere", width: 15, alignment: "right", bgColor: "#a0a0a0" },
            { key: "TotalTax", header: "Suma TVA", width: 20, alignment: "right", bgColor: "#a0a0a0" }
        ];

        exportToExcel(groupedData, "ReceiptForPeriodGrouped.xlsx", columns);
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
                setShowWarningMessage(t("NothingToDisplay"));
                setIsWarningModalVisible(true);
                return;
            }
            // Генерируем PDF
            const doc = generateKKMJournalPDF(data, payload.startDate, payload.endDate);
            doc.save(`Registrul mașinii de casă și control al aparatului fiscal al companiei ${data.company} pe perioada de la ${payload.startDate} până la ${payload.endDate}.pdf`);
        } catch (err) {
            console.error("Ошибка при скачивании KKMJournal:", err);
        }
    };

    const generateKKMJournalPDF = (data, startDate, endDate) => {
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 12;
        pdf.setFontSize(7);
        pdf.text(`${data.company}, Cod Fiscal: ${data.companyIDNO}`, pageWidth / 2, 30, { align: "center" });
        pdf.text(
            `Registrul electronic MCC/IF de la ${new Date(startDate).toLocaleDateString("ro-RO")} pana la ${new Date(endDate).toLocaleDateString("ro-RO")}`,
            pageWidth / 2,
            45,
            { align: "center" }
        );
        pdf.text(`Numarul de inregistrare: ${data.registrationNumber}, Adresa: ${data.salesPointAddress}`, pageWidth / 2, 60, { align: "center" });

        // Dynamic headers
        console.log(data.taxesMapping);
        const dynamicTaxHeaders = data.taxesMapping?.map((tax) => {
            return {
                content: `Valoarea rulajului pe cota ${tax.taxCode} / Valoarea T.V.A. pe cota ${tax.taxCode}`,
                styles: {
                    minCellWidth: 35
                }
            };
        }) || [];

        dynamicTaxHeaders.unshift({
            content: "Valoarea totala a rulajului/ Valoarea totala a T.V.A.",
            styles: {
                cellWidth: 35
            }
        });

        dynamicTaxHeaders.push({
            content: "Varsamint de serviciu de numerar in caseta de bani a MCC/ IF la inceputul perioadei de gestiune",
            styles: {
                cellWidth: 45
            }
        });

        const head = [
            [
                {
                    content: "Nr. / curent al inscrierii", styles: {
                        cellWidth: 30
                    }, rowSpan: 2
                },
                {
                    content: "Nr. raportului de inchidere zilnica / Data raportului de inchidere zilnica", styles: {
                        cellWidth: 50
                    }, rowSpan: 2
                },
                {
                    content: "Valoare totala a rulajului inregistrat de la inceputul anului gestionar(lei)/ Valoarea totala a T.V.A. inregistrate de la inceputul anului gestionar(lei)", styles: {
                        cellWidth: 60
                    }, rowSpan: 2
                },
                {
                    content: "Rulajul (lei) inregistrat, conform cu raportul de inchidere zilnica emis la sfarsitul perioadei de gestiune / Valorile T.V.A. (lei) pe cotele aferente", styles: { cellWidth: 0, valign: 'middle' }, colSpan: dynamicTaxHeaders.length
                },
                {
                    content: "Suma predata in casierie / incasatorului in timpul perioadei de gestiune", styles: {
                        cellWidth: 60
                    }, rowSpan: 2
                },
                {
                    content: "Suma restituita consumatorilor in timpul perioadei de gestiune", styles: {
                        cellWidth: 60
                    }, rowSpan: 2
                },
                {
                    content: "Suma achitata (confirmata) cu (prin) alte instrumente (documente) de plata", styles: {
                        cellWidth: 60
                    }, rowSpan: 2
                },
                {
                    content: "Suma achitata (confirmata) cu (prin) tichet de masa pe suport de hârtie /pe suport electronic", styles: {
                        cellWidth: 60
                    }, rowSpan: 2
                },
                {
                    content: "Soldul de numerar din caseta de bani a MCC/IF la sfarsitul perioadei de gestiune /Suma totala a restului nerambursat din valoarea nominala a tichetului de masa pe suport de hartie ('rest TMH')", styles: {
                        cellWidth: 60
                    }, rowSpan: 2
                }
            ],
            dynamicTaxHeaders
        ];

        const thirdRow = [];
        let counter = 1; // общий счетчик для основных колонок

        head[0].forEach((col, index) => {
            if (col.colSpan) {
                // динамические колонки
                for (let i = 0; i < col.colSpan - 1; i++) {
                    if (i >= 5) {
                        // последние колонки (E, F) — через прошлое значение
                        const prevNum = String(thirdRow[thirdRow.length - 1]?.content).split(".")[0];
                        thirdRow.push({ content: `${prevNum}.${i - 4}`, styles: { halign: "center", valign: 'middle' } });
                    } else {
                        thirdRow.push({ content: counter, styles: { halign: "center", valign: 'middle' } });

                        counter++;
                    }
                }
            } else {
                thirdRow.push({ content: counter, styles: { halign: "center", valign: 'middle' } });
                counter++;
            }
        });

        head.push(thirdRow);

        const body = data.reports?.flatMap((report, idx) => {
            const brutRow = [
                { content: idx + 1, rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
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
                new Date(report.reportDate).toLocaleString("ro-RO"),
                Number(report.grandTotalTax ?? 0).toFixed(2),
                Number(report.totalTax ?? 0).toFixed(2),
                ...(data.taxesMapping?.map((tax) => {
                    const taxItem = report.taxes?.find((t) => t.taxCode === tax.taxCode);
                    return Number(taxItem?.tax ?? 0).toFixed(2);
                }) || []),
                "", "", "", "", "", "","", // empty for rowspan // empty fields for the rest of the row
            ];

            return [brutRow, taxRow];
        }) || [];

        // Table styles
        autoTable(pdf, {
            head,
            body,
            startY: 80,
            theme: "grid",
            margin: { left: margin, right: margin },
            styles: {
                fontSize: 7,
                fontStyle: "normal",
                halign: "center",
                valign: "top",
                cellPadding: 2,
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
                textColor: [0, 0, 0],
                overflow: "linebreak",
            },
            headStyles: {
                fillColor: [255, 255, 255],
                fontStyle: "normal"
            },
            tableWidth: "auto" // растягиваем таблицу равномерно по странице
        });

        return pdf;
    };

    const kkmJournal = async () => {
        const data = await apiService.proxyRequest(
            `/ISFiscalCloudRegister/Report/RegisterForPeriod?DeviceID=${id}&startDate=${payload.startDate}&endDate=${payload.endDate}`,
            { method: "GET" }
        );

        if (!data) {
            setShowWarningMessage(t("NothingToDisplay"));
            setIsWarningModalVisible(true);
            return;
        };

        const pdf = generateKKMJournalPDF(data, payload.startDate, payload.endDate);

        const pdfBlob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(blobUrl);
        setIsOpenKkmJournal(true);
    };

    const openReportModal = (reportType) => {
        setCurrentReportType(reportType);

        switch (reportType) {
            case "FiscalSummary":
                setCurrentReportName(t("FiscalSummary"));
                break;
            case "ReceiptForPeriod":
                setCurrentReportName(t("ReceiptForPeriod"));
                break;
            case "ReceiptForPeriodGrouped":
                setCurrentReportName(t("ReceiptForPeriodGrouped"));
                break;
            case "KKMJournal":
                setCurrentReportName(t("KKMJournal"));
                break;
            case "DownloadKKMJournal":
                setCurrentReportName(t("DownloadKKMJournal"));
                break;
            default:
                setCurrentReportName("");
                break;
        }

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
        white-space: pre-wrap;
        max-width: 100%; 
        }
      `}</style>
            <div className="p-2  overflow-x-auto">
                <div className="flex flex-wrap gap-4 justify-center">
                    <div className="w-full xl:w-[490px]">
                        <DataTable
                            title={t("Shifts")}
                            columns={columnsShifts}
                            data={decoratedShifts}
                            onRowClick={(row) => { setSelectedShiftId(row.shiftID); setSelectedShiftGuid(row.id); }}
                            selectedRowId={selectedShiftId}
                            selectableRow={true}
                            onRefresh={() => fetchShifts(id)}
                            customHeader={() => (
                                <ShiftMenu openReportModal={openReportModal} t={t} />
                            )}
                            rowClassName={(row) =>
                                row.shiftID === selectedRowId ? "bg-gray-200" : ""
                            }
                            tableClassName="min-w-[400px] table-auto"
                        />
                    </div>
                    <div className="w-full xl:w-[490px]">
                        <DataTable
                            title={t("Bills")}
                            columns={columnsBills}
                            data={decoratedBills}
                            onRowClick={(row) => { setSelectedBill(row); }}
                            selectedRowId={selectedBill?.id}
                            selectableRow={true}
                            onRefresh={() => fetchBills(id, selectedShiftId)}
                            rowClassName={(row) =>
                                row.id === selectedRowId ? "bg-gray-200" : ""
                            }
                            tableClassName="table-auto min-w-[400px] xl:w-full"
                        />
                    </div>
                    {(receiptText || (selectedBill?.reportType == 1 && reportModel)) && (
                        <div className="flex w-full xl:w-[490px] xl:justify-between justify-center">
                            <div className="bg-white rounded-xl shadow-md p-4">
                                <div className="flex items-center justify-between mb-3 w-full">
                                    {/* Левая кнопка: FiscalReceipt */}
                                    {receiptText && (
                                        <button
                                            className={`text-black text-sm px-1 pt-1 pb-0 py-1 hover:bg-gray-200 rounded transition ${viewMode === "receipt"
                                                ? "bg-gray-200"
                                                : ""}`}
                                            onClick={() => setViewMode("receipt")}
                                            disabled={viewMode === "receipt"}
                                        >
                                            <h5 className="text-center font-semibold">{t("FiscalReceipt")}</h5>
                                        </button>
                                    )}

                                    {/* Правая кнопка: LongZReport */}
                                    {selectedBill?.reportType === 1 && (
                                        <button
                                            className={`text-black text-sm px-1 pt-1 pb-0 py-1 hover:bg-gray-200 rounded transition ${viewMode === "report"
                                                ? "bg-gray-200"
                                                : ""}`}
                                            onClick={() => setViewMode("report")}
                                            disabled={viewMode === "report"}
                                        >
                                            <h5 className="text-center font-semibold">{t("LongZReport")}</h5>
                                        </button>
                                    )}
                                </div>
                                <div className="text-sm whitespace-pre-wrap break-words bg-white">
                                    {viewMode === "report" ? (
                                        <LongZReport className="bg-white text-sm" model={reportModel} t={t} />
                                    ) : (
                                        <div className="billStyle">
                                            <input id="dId" value={id} type="hidden" />
                                            <input id="Id" value={selectedBill?.id || ""} type="hidden" />

                                            <div className="receipt" id="receiptDiv">
                                                <div className="receiptBody flex flex-col items-center PrintArea rounded">
                                                    <div className="contentReceipt flex flex-col items-center">
                                                        <pre className="receipt-text text-center">{receiptText || t("SelectBill")}</pre>

                                                        {mevURi && (
                                                            <div className="mt-2 text-center items-center" style={{ fontSize: "87.5%" }}>
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
                                                {(selectedBill?.type == 2 && selectedBill?.reportType == 0) != true && (
                                                    <div className="mt-3">
                                                        <button
                                                            id="printNext"
                                                            className="btn btn-contained border rounded border-gray-900"
                                                            style={{ width: 140 }}
                                                            onClick={() => printReceipt()}
                                                        >
                                                            {t("Print")}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    )}
                    {isReportModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeReportModal}>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[450px]" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold mb-2">{`${currentReportName}`}</h3>
                                <h3 className="text-lg font-semibold mb-2">{`${t("SelectPeriod")}`}</h3>
                                {/* Для FiscalSummary показываем переключатель */}
                                {currentReportType === "FiscalSummary" && (
                                    <div className="flex gap-4 mb-2">
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
                                    <div className="flex flex-col gap-3 mb-2 relative z-50">
                                        <label className="text-sm font-medium">{t("StartDate")}:</label>
                                        <Datepicker
                                            asSingle
                                            value={{ startDate: period.startDate, endDate: period.startDate }}
                                            onChange={(val) => {
                                                const selectedDate = new Date(val.startDate);
                                                selectedDate.setHours(12, 0, 0, 0);
                                                setPeriod((prev) => ({ ...prev, startDate: selectedDate }));
                                            }}
                                            primaryColor="cyan"
                                            displayFormat="DD.MM.YYYY"
                                            maxDate={period?.endDate || new Date()}
                                            minDate={new Date(2000, 0, 1)}
                                            inputClassName="w-full px-4 py-2 text-sm border rounded"
                                            useRange={false}
                                            withPortal={true}
                                        />

                                        <label className="text-sm font-medium">{t("DateEnd")}:</label>
                                        <Datepicker
                                            asSingle
                                            value={{ startDate: period.endDate, endDate: period.endDate }}
                                            onChange={(val) => {
                                                const selectedDate = new Date(val.startDate);
                                                selectedDate.setHours(12, 0, 0, 0);
                                                setPeriod((prev) => ({ ...prev, endDate: selectedDate }));
                                            }}
                                            primaryColor="cyan"
                                            displayFormat="DD.MM.YYYY"
                                            minDate={period?.startDate || new Date()}
                                            maxDate={new Date()}
                                            inputClassName="w-full px-4 py-2 text-sm border rounded"
                                            useRange={false}
                                            withPortal={true}
                                        />
                                    </div>
                                )}

                                {/* Если выбран режим по диапазону (только для FiscalSummary) */}
                                {currentReportType === "FiscalSummary" && period.mode === "range" && (
                                    <div className="flex flex-col gap-3 mb-2">
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
                                left: "50%",
                                right: "auto",
                                bottom: "auto",
                                transform: "translateX(-50%)",
                                width: "450px",
                                maxHeight: "90%",       // ограничиваем по экрану
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                position: "relative",
                                overflow: "hidden"
                            },
                        }}
                    >
                        {/* Крестик закрытия */}
                        <button
                            onClick={() => setIsOpenFiscalSummary(false)}
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                background: "transparent",
                                border: "none",
                                fontSize: "20px",
                                cursor: "pointer"
                            }}
                            aria-label="Close"
                        >
                            &times;
                        </button>

                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {fiscalSummaryText && (
                                <pre className="whitespace-pre-wrap font-mono text-center">{fiscalSummaryText}</pre>
                            )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 justify-end sm:justify-between">
                            <button
                                className="px-3 py-1 bg-red-600 text-white rounded"
                                onClick={() => setIsOpenFiscalSummary(false)}
                            >
                                {t("Close")}
                            </button>
                            <button
                                id="printNext"
                                className="px-3 py-1 bg-gray-600 text-white rounded w-[140px]"
                                style={{ width: 140 }}
                                onClick={() => printReceipt()}
                            >
                                {t("Print")}
                            </button>
                        </div>
                    </Modal>

                    <Modal
                        isOpen={isOpenKkmJournal}
                        onRequestClose={() => setIsOpenKkmJournal(false)}
                        contentLabel="Сводный отчет"
                        style={{
                            content: {
                                top: "5%",
                                left: "50%",
                                right: "auto",
                                bottom: "auto",
                                transform: "translateX(-50%)",
                                width: "80%",
                                height: "92%",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                position: "relative"
                            },
                        }}
                    >
                        {/* Крестик закрытия */}
                        <button
                            onClick={() => setIsOpenKkmJournal(false)}
                            style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                background: "transparent",
                                border: "none",
                                fontSize: "20px",
                                cursor: "pointer"
                            }}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <div style={{ flexGrow: 1, minHeight: 0 }}>
                            {pdfUrl && (
                                <iframe
                                    src={pdfUrl}
                                    title="KKM Journal PDF"
                                    style={{ width: "100%", height: "100%" }} // Use 100% width/height for iframe
                                />
                            )}
                        </div>
                    </Modal>

                    <Toast
                        visible={isSuccessModalVisible}
                        message={showSuccessMessage}
                        onClose={() => setIsSuccessModalVisible(false)}
                        type="success"
                    />
                    <Toast
                        visible={isWarningModalVisible}
                        message={showWarningMessage}
                        onClose={() => setIsWarningModalVisible(false)}
                        type="warning"
                    />
                </div>
            </div>
        </>
    );
}