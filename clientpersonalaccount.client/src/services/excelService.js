// services/excelService.js
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = (data, fileName = "report.xlsx") => {
    // data � ������ ��������, ��������: reportData.ReceiptForPeriod
    if (!data || !data.length) return;

    // ������������ JSON � ���� Excel
    const worksheet = XLSX.utils.json_to_sheet(data);

    // ������� ������� �����
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    // ���������� �������� ����
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // ��������� ����
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
};
