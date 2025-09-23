import React from "react";

export default function ConfirmDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    t
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[400px] max-w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="mb-4">
                    {t("AreYouSureDelete")} <span className="font-bold">{itemName}</span>?
                </p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded border"
                    >
                        {t("Cancel")}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 text-white"
                    >
                        {t("Delete")}
                    </button>
                </div>
            </div>
        </div>
    );
}
