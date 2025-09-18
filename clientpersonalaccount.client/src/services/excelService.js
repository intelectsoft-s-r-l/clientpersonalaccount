// services/excelService.js
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * ������������� ������� � Excel � ���������� �������
 * @param {Array} data - ������ �������� ��� ��������
 * @param {string} fileName - ��� �����
 * @param {Array} columns - �������� �������
 *  columns = [
 *    { key: "fieldName", header: "�������� �������", width: 20, alignment: "center", bgColor: "FFFF00", numFormat: "dd.mm.yyyy" }
 *  ]
 */
export const exportToExcel = async (data, fileName = "report.xlsx", columns = []) => {
    if (!data || !data.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // ����������� �������
    worksheet.columns = columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 15,
        style: {
            alignment: { horizontal: col.alignment || "left" },
            numFmt: col.numFormat || undefined,
        },
    }));

    // ��������� ������
    data.forEach(item => worksheet.addRow(item));

    // ����� ��� �����
    worksheet.getRow(1).eachCell(cell => {
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "a0a0a0" }, // ������-������� ���, ����� ������
        };
        cell.font = { bold: true, color: { argb: "000000" } }; // ����� �����
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
        };
    });

    worksheet.eachRow({ includeEmpty: true }, row => {
        row.eachCell({ includeEmpty: true }, cell => {
            cell.border = {
                top: { style: "thin", color: { argb: "FF000000" } },
                left: { style: "thin", color: { argb: "FF000000" } },
                bottom: { style: "thin", color: { argb: "FF000000" } },
                right: { style: "thin", color: { argb: "FF000000" } },
            };
        });
    });

    // ��������� ����� � ����������
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
};
