// services/excelService.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = (data, fileName = "report.xlsx") => {
    // data — массив объектов, например: reportData.ReceiptForPeriod
    if (!data || !data.length) return;

    // Конвертируем JSON в лист Excel
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // Генерируем бинарный файл
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // Сохраняем файл
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
};
