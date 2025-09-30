import { useState, useEffect } from "react";

export default function Pagination({
    currentPage,
    totalPages,
    setCurrentPage,
    onRefresh,
    t
}) {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const renderPages = () => {
        // Если экран большой, показываем все кнопки
        if (windowWidth > 768) {
            const pages = [];
            const maxVisible = 3;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = startPage + maxVisible - 1;

            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            // Первая страница и "..."
            if (startPage > 1) {
                pages.push(
                    <button key={1} onClick={() => setCurrentPage(1)}
                        className={`px-1 py-1 rounded ${currentPage === 1 ? "bg-gray-200" : "hover:bg-gray-200"}`}>1</button>
                );
                if (startPage > 2) pages.push(<span key="start-dots" className="px-0">...</span>);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(
                    <button key={i} onClick={() => setCurrentPage(i)}
                        className={`px-2 py-1 rounded ${currentPage === i ? "bg-gray-200" : "hover:bg-gray-200"}`}>{i}</button>
                );
            }

            // Последняя страница и "..."
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push(<span key="end-dots" className="px-0">...</span>);
                pages.push(
                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)}
                        className={`px-1 py-1 rounded ${currentPage === totalPages ? "bg-gray-200" : "hover:bg-gray-200"}`}>{totalPages}</button>
                );
            }

            return pages;
        }

        // Компактная версия: только поле ввода + последняя страница
        return (
            <>
                <input
                    type="number"
                    value={currentPage}
                    min={1}
                    max={totalPages}
                    onChange={(e) => {
                        const value = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                        setCurrentPage(value);
                    }}
                    className="w-14 text-center border rounded px-1 py-0.5"
                />
                <span className="mx-1">/ {totalPages}</span>
            </>
        );
    };

    const renderCurrentPage = () => {
        // Если экран большой, показываем все кнопки
        if (windowWidth > 768) {
            return (
                <>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-white">
                        {t("Page")} {currentPage} {t("Of")} {totalPages}
                    </span>
                </>
            );
        }

        // Компактная версия: только поле ввода + последняя страница
        return (
            <>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-white">
                    {currentPage} {t("Of")} {totalPages}
                </span>
            </>
        );
    };

    return (
        <div className="flex items-center justify-between p-2 text-sm flex-wrap gap-2">
            <div className="flex items-center gap-2">
                {
                    onRefresh && (
                        <button
                            onClick={onRefresh}
                            title={t("Refresh")}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-transparent text-blue-600 hover:text-blue-800 transition hover:scale-125"
                        >
                            ↻
                        </button>
                    )
                }
                {renderCurrentPage()}
            </div>
            {totalPages > 1 && (<div className="flex items-center gap-1">
                <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-1 py-1 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                    &lt;
                </button>

                {renderPages()}

                <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-1 py-1 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                    &gt;
                </button>
            </div>)}
        </div>
    );
}
