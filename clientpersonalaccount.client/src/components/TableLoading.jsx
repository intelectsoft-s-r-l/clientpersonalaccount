import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
export function TableLoading() {
    const [showLoader, setShowLoader] = useState(true);
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoader(false);
        }, 10000); // 3000 мс = 3 секунды

        return () => clearTimeout(timer);
    }, []);

    if (!showLoader) return null;

    return (
        <td
            colSpan={columns.length}
            className="text-center py-8 text-gray-400 dark:bg-gray-800 dark:text-white border-solid"
        >
            {t("NothingToDisplay")}
        </td>
    );
}
