import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function SuccessModal({ message, visible, onClose }) {
    const { t } = useTranslation();

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-green-700">{t("Success")}</h2>
                <p className="text-l mb-4">{message}</p>
            </div>
        </div>
    );
}
