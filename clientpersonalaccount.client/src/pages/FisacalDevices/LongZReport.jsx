import React from "react";
import "../../styles/receipt.css";

export default function LongZReport({ model }) {
    if (!model) return null;
    console.log(model.fiscalReceiptItems);
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
    return (
        <div className="billStyle dark:bg-gray-800 dark:text-white">
            <div className="receipt">
                <div className="receiptBody">
                    <div className="contentReceipt d-flex flex-column">
                        <div style={{ flex: "0 0 auto", width: "100%" }}>
                            <div style={{ textAlign: "center" }}>
                                <span style={{ wordBreak: "break-word" }}>{model.company}</span>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                Cod Fiscal: {model.companyIDNO}
                            </div>
                            <div style={{ textAlign: "center" }}>{model.salesPointAddress}</div>
                            <div style={{ textAlign: "center" }}>
                                Numărul de înregistrare: {model.registrationNumber}
                            </div>

                            <hr />

                            <div style={{ textAlign: "center" }}>
                                <b>RAPORT INFORMATIV VÂNZĂRI ARTICOLE DETALIAT</b>
                            </div>

                            <hr />
                        </div>

                        {model.fiscalReceiptItems && model.fiscalReceiptItems.length > 0 && (
                            model.fiscalReceiptItems.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div className="row">
                                        <div
                                            className="col-10 pe-0 text-center"
                                            style={{ wordBreak: "break-word", float: "left" }}
                                        >
                                            {item.name}
                                        </div>
                                        <div
                                            className="col-2 ps-0 text-end"
                                            style={{ wordBreak: "break-word", float: "right" }}
                                        >
                                            TVA {item.tax?.code || ""}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div
                                            className="col-6 pe-0"
                                            style={{ wordBreak: "break-word", float: "left" }}
                                        >
                                            Cant: {item.quantity}
                                        </div>
                                        <div
                                            className="col-6 ps-0 text-end"
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
                                                className="col-6 pe-0"
                                                style={{ wordBreak: "break-word", float: "left" }}
                                            >
                                                Reducere
                                            </div>
                                            <div
                                                className="col-6 ps-0 text-end"
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
                                className="col-6 pe-0"
                                style={{ wordBreak: "break-word", float: "left" }}
                            >
                                Vânzări
                            </div>
                            <div
                                className="col-6 ps-0 text-end"
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
                                className="col-6 pe-0"
                                style={{ wordBreak: "break-word", float: "left" }}
                            >
                                NUMĂRUL RAPORTULUI
                            </div>
                            <div
                                className="col-6 ps-0 text-end"
                                style={{ wordBreak: "break-word", float: "right" }}
                            >
                                {model.reportNumber}
                            </div>
                        </div>

                        <hr />

                        <div className="row">
                            <div
                                className="col-6 pe-0"
                                style={{ wordBreak: "break-word", float: "left" }}
                            >
                                Data {formattedDate}
                            </div>
                            <div
                                className="col-6 ps-0 text-end"
                                style={{ wordBreak: "break-word", float: "right" }}
                            >
                                Ora {formattedTime}
                            </div>
                        </div>

                        <div className="row">
                            <div
                                className="col-6 pe-0"
                                style={{ wordBreak: "break-word", float: "left" }}
                            >
                                NUMĂRUL FABRICĂRII
                            </div>
                            <div
                                className="col-6 ps-0 text-end"
                                style={{ wordBreak: "break-word", float: "right" }}
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
    );
}
