import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FiscalReports = ({ data }) => {
    const [loading, setLoading] = useState(false);

    const generateExcel = (reportType) => {
        if (!data || data.length === 0) {
            alert("Нет данных для отчета");
            return;
        }

        setLoading(true);
        const workbook = XLSX.utils.book_new();
        let worksheet;

        if (reportType === "ReportByPeriod") {
            // Таблица как в ReportByPeriod
            const sheetData = data.map((item) => ({
                "Device ID": item.DeviceID,
                "Start Date": item.StartDate,
                "End Date": item.EndDate,
                "Start Num": item.StartNum,
                "End Num": item.EndNum,
                "Detailed": item.Detailed,
            }));
            worksheet = XLSX.utils.json_to_sheet(sheetData);

        } else if (reportType === "ReceiptForPeriod") {
            // Детальный отчет по чекам
            const sheetData = data.map((item) => ({
                "Număr de înregistrare": item.DeviceNumber,
                "Numărul SFS": item.DeviceFactory,
                "Data": new Date(item.ReceiptDate).toLocaleDateString("ro-RO"),
                "Ora": new Date(item.ReceiptDate).toLocaleTimeString("ro-RO"),
                "Nr Raport": item.ReportNumber,
                "Nr Bon": item.ReceiptNumber,
                "Denumire marfa": item.Name,
                "Cantitate": item.Quantity,
                "Pret": item.BasePrice,
                "Suma cu TVA fără reducere": item.TotalCost,
                "Reducere": item.Discount?.Amount ?? 0,
                "Suma TVA": item.Tax.Amount,
                "TVA%": item.Tax.Percent,
                "Tip achitare": item.Payments?.map(p => p.Type).join(", ") ?? "",
                "Banca": item.Payments?.find(p => p.Type === "CARD" && p.BankResponse)?.BankResponse || ""
            }));
            worksheet = XLSX.utils.json_to_sheet(sheetData);

        } else if (reportType === "ReceiptForPeriodGrouped") {
            // Группировка по дате и товару
            const groupedData = data.reduce((acc, item) => {
                const key = `${new Date(item.ReceiptDate).toDateString()}_${item.Name}`;
                if (!acc[key]) acc[key] = { ...item, TotalQuantity: 0, TotalAmount: 0, TotalDiscount: 0, TotalTax: 0 };
                acc[key].TotalQuantity += item.Quantity;
                acc[key].TotalAmount += item.TotalCost;
                acc[key].TotalDiscount += item.Discount?.Amount ?? 0;
                acc[key].TotalTax += item.Tax.Amount;
                return acc;
            }, {});
            const sheetData = Object.values(groupedData).map(item => ({
                Data: new Date(item.ReceiptDate).toLocaleDateString("ro-RO"),
                "Denumire marfa": item.Name,
                Cantitate: item.TotalQuantity,
                Pret: item.BasePrice,
                "Suma cu TVA fără reducere": item.TotalAmount,
                Reducere: item.TotalDiscount,
                "Suma TVA": item.TotalTax
            }));
            worksheet = XLSX.utils.json_to_sheet(sheetData);

        } else if (reportType === "PrintFiscalReportByPeriod") {
            // Отчет для печати
            const sheetData = data.map((item) => ({
                DeviceId: item.DeviceId,
                StartDate: item.StartDate,
                EndDate: item.EndDate,
                StartNum: item.StartNum,
                EndNum: item.EndNum,
                Detailed: item.Detailed
            }));
            worksheet = XLSX.utils.json_to_sheet(sheetData);
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileName = `${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
        setLoading(false);
    };

    return (
        <div className="p-4">
            <h2>Фискальные отчеты</h2>
            <div className="flex flex-col gap-2 mt-2">
                <button onClick={() => generateExcel("ReportByPeriod")} disabled={loading} className="btn btn-primary">
                    Отчет по периоду
                </button>
                <button onClick={() => generateExcel("ReceiptForPeriod")} disabled={loading} className="btn btn-primary">
                    Детальный отчет по чекам
                </button>
                <button onClick={() => generateExcel("ReceiptForPeriodGrouped")} disabled={loading} className="btn btn-primary">
                    Группированный отчет
                </button>
                <button onClick={() => generateExcel("PrintFiscalReportByPeriod")} disabled={loading} className="btn btn-primary">
                    Отчет для печати
                </button>
            </div>
        </div>
    );
};

export default FiscalReports;
