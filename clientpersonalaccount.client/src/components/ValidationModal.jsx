import React from "react";
import { useTranslation } from "react-i18next";

export default function ValidationModal({ errors, visible, onClose }) {
    const { t } = useTranslation();
    if (!visible) return null;

    const parseErrors = (rowId, value, path = "") => {
        const messages = [];

        if (typeof value === "string") {
            messages.push(`${t("Row")} ${rowId}: ${value}`);
        } else if (Array.isArray(value)) {
            value.forEach((item, idx) => {
                messages.push(...parseErrors(rowId, item, `${path}[${idx}]`));
            });
        } else if (typeof value === "object" && value !== null) {
            Object.entries(value).forEach(([key, val]) => {
                messages.push(...parseErrors(rowId, val, path ? `${path}.${key}` : key));
            });
        }

        return messages;
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg overflow-y-auto max-h-[80vh]">
                <h2 className="text-xl font-bold mb-4">{t("ErrorValidate")}</h2>

                {!hasErrors && <p>{t("NotError")}</p>}

                {hasErrors && (
                    <ul className="list-disc list-inside space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(errors).flatMap(([rowId, errorValue]) =>
                            parseErrors(rowId, errorValue).map((msg, idx) => (
                                <li key={`${rowId}-${idx}`}>{msg}</li>
                            ))
                        )}
                    </ul>
                )}

                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                    {t("Close")}
                </button>
            </div>
        </div>
    );
}
