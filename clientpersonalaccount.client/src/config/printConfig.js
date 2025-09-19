import { useReactToPrint } from "react-to-print";

export const isLocalhost = window.location.hostname === "localhost";

let baseUrl;
if (isLocalhost) {
    baseUrl = null;
} else if (window.location.hostname.includes("edi.md")) {
    baseUrl = "https://freceipt.edi.md/ReceiptPrint";
} else {
    baseUrl = "https://freceipt.eservicii.md/ReceiptPrint";
}

export const getFiscalPrintUrl = (deviceId, shiftId) => {
    if (!baseUrl) return null;
    return `${baseUrl}/${deviceId}/${shiftId}`;
};

export const usePrintService = ({ deviceId, shiftId, contentRef }) => {
    const handleLocalPrint = useReactToPrint({
        content: () => contentRef.current,
        documentTitle: "Receipt",
        onPrintError: (error) => console.error("Ошибка при локальной печати:", error),
    });

    const print = () => {
        const url = getFiscalPrintUrl(deviceId, shiftId);
        if (url) {
            // Боевой режим – печать через URL
            window.open(url, "_blank");
        } else {
            if (!contentRef.current) {
                console.warn("Контент для печати не готов.");
                return;
            }
            handleLocalPrint();
        }
    };

    return { print };
};
