import React from "react";
import "../../styles/receipt.css";

export default function LongZReport({ model, t }) {
    if (!model) return null;
    // Подсчёт TOTAL_BRUT
    const totalBrut = model.fiscalReceiptItems
        ? model.fiscalReceiptItems.reduce((sum, item) => sum + (item.tax?.brut || 0), 0)
        : 0;

    // Форматирование даты и времени (если это строки - можешь использовать date-fns или moment)
    const reportDate = new Date(model.reportDate);
    // дата в формате dd.MM.yyyy
    const formattedDate = reportDate.toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    // время в формате HH:mm
    const formattedTime = reportDate.toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const printReport = () => {
        // Если нужно печатать Z-подробный чек через системную печать
        const reportDiv = document.getElementById("reportDiv");
        if (reportDiv) {
            printJS({
                printable: "reportDiv",
                type: "html",
                scanStyles: true,
                targetStyles: ["*"],
                css: [
                    "/styles/receipt.css",
                    "/path/to/tailwind.css"
                ]
            });
        }
    };


    return (
        <div className="billStyle dark:bg-gray-800 dark:text-white">
            <div className="receipt PrintArea rounded">
                <div className="receiptBody" id="reportDiv">
                    <div className="contentReceipt d-flex flex-column">
                        <div className="receipt-text">
                            <div>
                                <div>
                                    <span>{model.company}</span>
                                </div>
                                <div>
                                    Cod Fiscal: {model.companyIDNO}
                                </div>
                                <div>{model.salesPointAddress}</div>
                                <div>
                                    Numărul de înregistrare: {model.registrationNumber}
                                </div>

                                <hr />

                                <div style={{ textAlign: "center" }}>
                                    <b>RAPORT INFORMATIV VÂNZĂRI ARTICOLE DETALIAT</b>
                                </div>
                            </div>

                            {model.fiscalReceiptItems && model.fiscalReceiptItems.length > 0 && (
                                model.fiscalReceiptItems.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <hr />
                                        <div className="row">
                                            <div
                                                className="col-10 text-center"
                                                style={{ wordBreak: "break-word", float: "left" }}
                                            >
                                                {item.name}
                                            </div>
                                            <div
                                                className="col-2 text-end"
                                                style={{ wordBreak: "break-word", float: "right" }}
                                            >
                                                TVA {item.tax?.code || ""}
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div
                                                className="col-6 text-start"
                                                style={{ wordBreak: "break-word", float: "left" }}
                                            >
                                                Cant: {item.quantity}
                                            </div>
                                            <div
                                                className="col-6 text-end"
                                                style={{ wordBreak: "break-word", float: "right" }}
                                            >
                                                Total: {item.totalCost.toLocaleString("fr-FR", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </div>
                                        </div>

                                        {item.Discount && (
                                            <div className="row">
                                                <div
                                                    className="col-6 text-start"
                                                    style={{ wordBreak: "break-word", float: "left" }}
                                                >
                                                    Reducere
                                                </div>
                                                <div
                                                    className="col-6 text-end"
                                                    style={{ wordBreak: "break-word", float: "right" }}
                                                >
                                                    - {item.discount.amount} {item.tax?.code || ""}
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))
                            )}

                            <hr />

                            <div className="row">
                                <div
                                    className="col-6 text-start"
                                    style={{ wordBreak: "break-word", float: "left" }}
                                >
                                    Vânzări
                                </div>
                                <div
                                    className="col-6 text-end"
                                    style={{
                                        wordBreak: "break-word",
                                        float: "right",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {totalBrut.toLocaleString("fr-FR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </div>
                            </div>

                            <hr />

                            <div className="row">
                                <div
                                    className="col-6 text-start"
                                    style={{ whiteSpace: "nowrap", float: "left" }}
                                >
                                    NUMĂRUL RAPORTULUI
                                </div>
                                <div
                                    className="col-6 text-end"
                                    style={{ wordBreak: "break-word", float: "right" }}
                                >
                                    {model.reportNumber}
                                </div>
                            </div>

                            <hr />

                            <div className="row">
                                <div
                                    className="col-6 text-start"
                                    style={{ wordBreak: "break-word", float: "left" }}
                                >
                                    Data {formattedDate}
                                </div>
                                <div
                                    className="col-6 text-end"
                                    style={{ wordBreak: "break-word", float: "right" }}
                                >
                                    Ora {formattedTime}
                                </div>
                            </div>

                            <div className="row">
                                <div
                                    className="col-6 text-start"
                                    style={{ whiteSpace: "nowrap", float: "left" }}
                                >
                                    NUMĂRUL FABRICĂRII
                                </div>
                                <div
                                    className="col-6 text-end"
                                    style={{ float: "right" }}
                                >
                                    {model.factoryNumber}
                                </div>
                            </div>

                            <hr />

                            <div className="text-center">--- BON DE SERVICIU ---</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-3 text-center">
                <button
                    id="printNext"
                    className="btn btn-contained border rounded border-gray-900"
                    style={{ width: 140 }}
                    onClick={() => printReport()}
                >
                    {t("Print")}
                </button>
            </div>
        </div>
    );
}
