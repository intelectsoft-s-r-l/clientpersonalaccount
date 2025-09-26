import React from "react";
import { useTranslation } from "react-i18next";

export default function ValidationModal({ errors, visible, onClose, rowNames = {} }) {
    const { t } = useTranslation();

    if (!visible) return null;

    const isNumericKey = (key) => !isNaN(parseInt(key));

    const parseErrors = (rowId, value, path = "") => {
        const messages = [];

        if (typeof value === "string") {
            const shouldShowRowPrefix = rowId && isNumericKey(rowId) && rowId !== "general";

            const rowLabel = shouldShowRowPrefix ? (rowNames[rowId] || rowId) : null;

            if (rowLabel) {
                messages.push(`${t("Row")} ${rowLabel}: ${value}`);
            } else {
                messages.push(value);
            }
        } else if (Array.isArray(value)) {
            value.forEach((item, idx) => {
                messages.push(...parseErrors(rowId, item, `${path}[${idx}]`));
            });
        } else if (typeof value === "object" && value !== null) {
            Object.entries(value).forEach(([key, val]) => {
                const nestedRowId = isNumericKey(key) ? key : rowId;
                messages.push(...parseErrors(nestedRowId, val, path ? `${path}.${key}` : key));
            });
        }

        return messages;
    };

    const hasErrors = errors && Object.keys(errors).length > 0;

    // Собираем сначала general ошибки
    const generalMessages = errors.general
        ? errors.general.map((msg, idx) => <li key={`general-${idx}`}>{msg}</li>)
        : [];

    // Затем все остальные ошибки
    const rowMessages = Object.entries(errors)
        .filter(([key]) => key !== "general")
        .flatMap(([key, value]) =>
            parseErrors(key, value).map((msg, idx) => <li key={`${key}-${idx}`}>{msg}</li>)
        );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg overflow-y-auto max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4 text-red-700">{t("ErrorValidate")}</h2>

                {!hasErrors && <p>{t("NotError")}</p>}

                {hasErrors && (
                    <ul className="list-disc list-inside space-y-2 max-h-60 overflow-y-auto">
                        {generalMessages}
                        {rowMessages}
                    </ul>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                >
                    {t("Close")}
                </button>
            </div>
        </div>
    );
}
