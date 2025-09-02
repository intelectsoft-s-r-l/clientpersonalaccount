import { jsPDF } from "jspdf";

export const generateKKMJournalPDF = (reportData, startDate, endDate) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    // Заголовок
    doc.setFontSize(10);
    doc.text(`Registrul electronic MCC/IF de la ${startDate} până la ${endDate}`, doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
    y += 20;

    // Таблица заголовков
    const headers = [
        "Nr. curent al înscrierii",
        "Nr raportului",
        "Total rulaj",
        "Total TVA",
        "Suma predată",
        "Suma restituită",
        "Suma achitată alte instrumente",
        "Suma achitată tichete masă",
        "Sold numerar",
        "Altele"
    ];

    const colWidth = (doc.internal.pageSize.getWidth() - 2 * margin) / headers.length;
    doc.setFontSize(8);
    headers.forEach((h, i) => doc.text(h, margin + i * colWidth + 2, y));
    y += 15;

    // Разделитель
    doc.setLineWidth(0.5);
    doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
    y += 10;

    // Данные
    reportData.forEach((row, index) => {
        const values = [
            index + 1,
            row.reportNumber,
            row.totalRulaj,
            row.totalTax,
            row.cashIn,
            row.cashOutRefund,
            row.totalOther,
            row.totalTME,
            row.totalInBox,
            "" // Можно расширять под количество колонок
        ];

        values.forEach((val, i) => {
            doc.text(String(val ?? ""), margin + i * colWidth + 2, y);
        });

        y += 12;

        // Новая страница если не помещается
        if (y > doc.internal.pageSize.getHeight() - 50) {
            doc.addPage();
            y = margin;
        }
    });

    return doc;
};
