import React, { useState, useRef, useEffect } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";

export function ShiftMenu({ handleDownloadKKMJournal, openReportModal, t }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    // useFloating возвращает ref-объекты
    const { x, y, strategy, update } = useFloating({
        placement: "bottom-end",
        middleware: [offset(24), flip(), shift()],
        whileElementsMounted: autoUpdate,
    });

    const toggleMenu = () => {
        setIsOpen((prev) => !prev);
        setTimeout(() => update?.(), 0);
    };

    // Закрытие при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block">
            <button
                ref={buttonRef} // <-- Передаем ref напрямую, НЕ вызываем как функцию
                onClick={toggleMenu}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   transition ease-in-out duration-150"
                aria-label={t("Actions")}
            >
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>

            {isOpen && (
                <div
                    ref={menuRef} // <-- Передаем ref напрямую
                    style={{
                        position: strategy,
                        top: y ?? 0,
                        left: x ?? 0,
                        minWidth: "18rem",
                        maxWidth: "28rem",
                        zIndex: 50,
                    }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                >
                    <div className="py-2">
                        <button
                            onClick={() => { openReportModal("FiscalSummary"); setIsOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            {t("FiscalSummary")}
                        </button>
                        <button
                            onClick={() => { openReportModal("ReceiptForPeriod"); setIsOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            {t("ReceiptForPeriod")}
                        </button>
                        <button
                            onClick={() => { openReportModal("ReceiptForPeriodGrouped"); setIsOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            {t("ReceiptForPeriodGrouped")}
                        </button>
                        <button
                            onClick={() => { openReportModal("KKMJournal"); setIsOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            {t("KKMJournal")}
                        </button>
                        <button
                            onClick={() => { handleDownloadKKMJournal(); setIsOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            {t("DownloadKKMJournal")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
