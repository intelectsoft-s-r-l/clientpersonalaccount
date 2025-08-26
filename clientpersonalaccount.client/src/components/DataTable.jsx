import React, { useState, useMemo, useEffect } from "react";
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from "react-i18next";

export const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "0,00";

    // Преобразуем значение в строку и заменяем запятую на точку
    const num = Number(String(value).replace(",", "."));

    // Если не число, возвращаем 0,00
    if (isNaN(num)) return "0,00";

    // Форматируем число в формате "0,00"
    return new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export function DataTable({
    title,
    columns,
    data,
    loading,
    editable,
    onCellUpdate,
    onRowDoubleClick,
    selectedRowId,
    onRowClick,
    onAddRow,
    onDeleteRow,
    extraData,
    errors = {},
    onRefresh,
    customHeader
}) {
    const [editCell, setEditCell] = useState({ rowId: null, columnKey: null });
    const [editValue, setEditValue] = useState("");
    const [filters, setFilters] = useState({});
    const [globalFilter, setGlobalFilter] = useState(""); // Состояние для глобального поиска
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { t } = useTranslation();

    const [activeFilter, setActiveFilter] = useState(null);

    const handleClick = (key) => {
        setActiveFilter(key);
    };

    const startEdit = (rowId, columnKey, currentValue) => {
        if (!editable) return;
        setEditCell({ rowId, columnKey });
        setEditValue(currentValue);
    };

    const saveEdit = () => {
        if (
            onCellUpdate &&
            editCell.rowId !== null &&
            editCell.columnKey !== null
        ) {
            onCellUpdate(editCell.rowId, editCell.columnKey, editValue);
        }
        setEditCell({ rowId: null, columnKey: null });
        setEditValue("");
    };

    const cancelEdit = () => {
        setEditCell({ rowId: null, columnKey: null });
        setEditValue("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") saveEdit();
        else if (e.key === "Escape") cancelEdit();
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleGlobalFilterChange = (value) => {
        setGlobalFilter(value);
        setCurrentPage(1);
    };

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return {
                    key,
                    direction: prev.direction === "asc" ? "desc" : "asc",
                };
            }
            return { key, direction: "asc" };
        });
    };

    function extractTextFromReactElement(element) {
        if (typeof element === "string") return element;
        if (typeof element === "number") return element.toString();
        if (Array.isArray(element))
            return element.map(extractTextFromReactElement).join(" ");
        if (element && typeof element === "object" && element.props)
            return extractTextFromReactElement(element.props.children);
        return "";
    }

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter((row) => {
            // Фильтрация по колонкам
            const columnFiltered = columns.every((col) => {
                if (!filters[col.key]) return true;
                const filterValue = filters[col.key].toLowerCase();
                const cellRaw = row[col.key];
                let cellValue = "";

                if (Array.isArray(cellRaw)) {
                    cellValue = cellRaw.map(extractTextFromReactElement).join(" ");
                } else if (
                    typeof cellRaw === "string" ||
                    typeof cellRaw === "number"
                ) {
                    cellValue = cellRaw.toString();
                } else if (cellRaw && typeof cellRaw === "object" && cellRaw.props) {
                    cellValue = extractTextFromReactElement(cellRaw);
                } else {
                    cellValue = String(cellRaw);
                }

                cellValue = cellValue.toLowerCase();
                return col.filterOptions
                    ? cellValue === filterValue
                    : cellValue.includes(filterValue);
            });

            // Глобальный поиск
            if (!globalFilter) return columnFiltered;
            const globalFilterValue = globalFilter.toLowerCase();
            const rowValues = columns.map(col => {
                const cellRaw = row[col.key];
                let cellValue = "";
                if (Array.isArray(cellRaw)) {
                    cellValue = cellRaw.map(extractTextFromReactElement).join(" ");
                } else if (
                    typeof cellRaw === "string" ||
                    typeof cellRaw === "number"
                ) {
                    cellValue = cellRaw.toString();
                } else if (cellRaw && typeof cellRaw === "object" && cellRaw.props) {
                    cellValue = extractTextFromReactElement(cellRaw);
                } else {
                    cellValue = String(cellRaw);
                }
                return cellValue.toLowerCase();
            }).join(" ");

            return columnFiltered && rowValues.includes(globalFilterValue);
        });
    }, [data, filters, columns, globalFilter]);

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;
        const { key, direction } = sortConfig;

        return [...filteredData].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];

            const isNumericSort =
                key.toLowerCase() === "id" || typeof aVal === "number" || typeof bVal === "number";
            if (isNumericSort) {
                const aNum = Number(aVal);
                const bNum = Number(bVal);
                return direction === "asc" ? aNum - bNum : bNum - aNum;
            }

            const isDate =
                key.toLowerCase().includes("date") ||
                aVal instanceof Date ||
                bVal instanceof Date;
            if (isDate) {
                const parseDate = (val) => {
                    if (typeof val === "string" && /^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
                        const [day, month, year] = val.split(".");
                        return new Date(`${year}-${month}-${day}`);
                    }
                    return new Date(val);
                };

                const aTime = parseDate(aVal).getTime();
                const bTime = parseDate(bVal).getTime();
                return direction === "asc" ? aTime - bTime : bTime - aTime;
            }

            if (typeof aVal !== "string" && aVal?.props?.children)
                aVal = String(aVal.props.children);
            if (typeof bVal !== "string" && bVal?.props?.children)
                bVal = String(bVal.props.children);

            aVal = aVal ? String(aVal).toLowerCase() : "";
            bVal = bVal ? String(bVal).toLowerCase() : "";

            if (aVal < bVal) return direction === "asc" ? -1 : 1;
            if (aVal > bVal) return direction === "asc" ? 1 : -1;
            if (aVal === bVal && typeof a.ID === 'number' && typeof b.ID === 'number') {
                return a.ID - b.ID;
            }
            return 0;
        });
    }, [filteredData, sortConfig]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const pagedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(start, start + itemsPerPage);
    }, [sortedData, currentPage]);

    useEffect(() => {
        // Таймер для автоматического скрытия через 5 секунд
        if (activeFilter) {
            const timer = setTimeout(() => {
                setActiveFilter(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [activeFilter]);

    useEffect(() => {
        // Функция обработки клика по документу
        const handleClickOutside = (event) => {
            // Если activeFilter открыт и клик не по элементу фильтра
            if (
                activeFilter &&
                !document.getElementById(`filter-${activeFilter}`)?.contains(event.target)
            ) {
                setActiveFilter(null);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [activeFilter]);

    const getAlignment = (col) => {
        // ID-шки всегда по левому краю
        if (col.key.toLowerCase().includes("id")) return "text-left";
        // Булевы значения по центру
        if (col.type === "boolean") return "text-center";
        // Числовые типы по правому краю
        if (["int", "decimal", "float", "number", "price"].includes(col.type)) return "text-right";
        // Строки и даты по левому краю по умолчанию
        return "text-left";
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-visible select-none dark:bg-gray-800 dark:text-white">
            {/* Заголовок и кнопки */}
            <div className="p-4 border-b border-[#787f88] flex flex-wrap justify-between items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold truncate max-w-[70%]">
                    {title}
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                    {customHeader && (
                        <div className="mr-2">
                            {typeof customHeader === "function" ? customHeader() : customHeader}
                        </div>
                    )}

                    {onAddRow && (
                        <button
                            onClick={onAddRow}
                            className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm rounded text-white"
                        >
                            <img
                                src="/icons/AddRow.svg"
                                className="w-6 h-6 sm:w-8 sm:h-8 transform transition-transform duration-200 ease-in-out hover:scale-125"
                                alt={t("Add Row")}
                            />
                        </button>
                    )}

                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            title={t("Refresh")}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-transparent text-blue-600 hover:text-blue-800 transition hover:scale-125"
                        >
                            <ArrowPathIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    )}

                    <div className="text-xs sm:text-sm text-gray-600 dark:text-white">
                        {t("Page")} {currentPage} {t("Of")} {totalPages}
                    </div>
                </div>
            </div>

            {/* Поиск */}
            <div className="overflow-x-auto w-full">
                <div className="flex justify-end p-2 sm:p-4">
                    <input
                        type="text"
                        placeholder={t("Search")}
                        className="w-full sm:w-64 border border-[#787f88] rounded px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-right dark:bg-gray-700 dark:text-white"
                        value={globalFilter}
                        onChange={(e) => handleGlobalFilterChange(e.target.value)}
                    />
                </div>

                {/* Таблица */}
                <table className="w-full border border-[#787f88] border-solid border-collapse table-auto text-xs sm:text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            {columns.map((col) => {
                                const isActions = col.key === "actions"; // ⭐ определяем столбец действий
                                return (
                                    <th
                                        key={col.key}
                                        style={{ width: col.width || "auto" }}
                                        className={`relative font-bold uppercase tracking-wider p-1 sm:p-2 border border-[#787f88] ${getAlignment(col)} dark:text-white ${isActions
                                                ? "sticky right-0 bg-white dark:bg-gray-800 z-20 w-[84px] sm:w-[96px] text-center" // ⭐ фиксируем справа + ширина
                                                : ""
                                            }`}
                                        onClick={() =>
                                            col.sortable !== false && handleSort(col.key)
                                        }
                                    >
                                        <div
                                            className={`flex items-center space-x-1 ${getAlignment(col).includes("right")
                                                    ? "justify-end"
                                                    : getAlignment(col).includes("center")
                                                        ? "justify-center"
                                                        : "justify-start"
                                                } ${isActions ? "justify-center" : ""}`} // ⭐ центруем actions
                                        >
                                            <span className="flex-grow min-w-0 overflow-hidden whitespace-nowrap text-ellipsis">
                                                {col.label}
                                            </span>
                                            {sortConfig.key === col.key && (
                                                <span className="ml-1 text-[10px] sm:text-xs flex-shrink-0">
                                                    {sortConfig.direction === "asc" ? "▲" : "▼"}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                            {onDeleteRow && <th className="w-10 sm:w-12 border border-[#787f88] flex-shrink-0"></th>}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-center py-8 text-gray-500 dark:bg-gray-800 dark:text-white border border-[#787f88] border-solid"
                                >
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : pagedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="text-center py-8 text-gray-400 dark:bg-gray-800 dark:text-white border border-[#787f88] border-solid"
                                >
                                    {t("No data to display")}
                                </td>
                            </tr>
                        ) : (
                            pagedData.map((row, index) => {
                                const isSelected =
                                    selectedRowId !== undefined && selectedRowId === row.ID;
                                return (
                                    <tr
                                        key={row.ID || index}
                                        className={`${onRowClick ? "cursor-pointer" : ""} ${isSelected
                                                ? "bg-blue-100 dark:bg-blue-700"
                                                : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                            } border-b border-[#787f88]`}
                                        onClick={
                                            onRowClick
                                                ? () => {
                                                    window.getSelection()?.removeAllRanges();
                                                    onRowClick(row);
                                                }
                                                : undefined
                                        }
                                        onDoubleClick={
                                            onRowDoubleClick ? () => onRowDoubleClick(row) : undefined
                                        }
                                        style={{ userSelect: "none" }}
                                    >
                                        {columns.map((col) => {
                                            const isEditing =
                                                editCell.rowId === row.ID &&
                                                editCell.columnKey === col.key;

                                            const rawValue = row[col.key];
                                            const cellValue =
                                                typeof rawValue === "object" &&
                                                    rawValue !== null &&
                                                    col.type !== "select"
                                                    ? rawValue.Price ?? JSON.stringify(rawValue)
                                                    : rawValue;

                                            const isActions = col.key === "actions"; // ⭐

                                            if (isEditing) {
                                                if (col.dateEditor) {
                                                    const EditorComponent = col.dateEditor;
                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className={`p-2 border border-[#787f88] text-sm text-gray-900 ${getAlignment(
                                                                col
                                                            )} dark:bg-gray-800 dark:text-white ${isActions
                                                                    ? "sticky right-0 bg-white dark:bg-gray-800 z-10 w-[84px] sm:w-[96px] text-center"
                                                                    : ""
                                                                }`}
                                                        >
                                                            <EditorComponent
                                                                value={String(editValue ?? "")}
                                                                onChange={(value) => {
                                                                    setEditValue(value);
                                                                }}
                                                                onBlur={saveEdit}
                                                            />
                                                        </td>
                                                    );
                                                }

                                                if (col.options) {
                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className={`p-2 border border-[#787f88] text-sm text-gray-900 ${getAlignment(
                                                                col
                                                            )} dark:bg-gray-800 dark:text-white ${isActions
                                                                    ? "sticky right-0 bg-white dark:bg-gray-800 z-10 w-[84px] sm:w-[96px] text-center"
                                                                    : ""
                                                                }`}
                                                        >
                                                            <select
                                                                autoFocus
                                                                className="w-full p-1 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                                                                value={String(editValue ?? "")}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onBlur={saveEdit}
                                                                onKeyDown={handleKeyDown}
                                                            >
                                                                <option value="">--</option>
                                                                {col.options.map((opt) => (
                                                                    <option
                                                                        key={
                                                                            typeof opt === "object" ? opt.value : opt
                                                                        }
                                                                        value={String(
                                                                            typeof opt === "object" ? opt.value : opt
                                                                        )}
                                                                    >
                                                                        {typeof opt === "object" ? opt.label : opt}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                }
                                            }

                                            if (col.type === "boolean") {
                                                return (
                                                    <td
                                                        key={col.key}
                                                        className={`p-2 border border-[#787f88] text-sm text-gray-900 ${getAlignment(
                                                            col
                                                        )} dark:bg-gray-800 dark:text-white ${isActions
                                                                ? "sticky right-0 bg-white dark:bg-gray-800 z-10 w-[84px] sm:w-[96px] text-center"
                                                                : ""
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row[col.key]}
                                                            onChange={(e) =>
                                                                onCellUpdate(row.ID, col.key, e.target.checked)
                                                            }
                                                            className="m-2"
                                                        />
                                                    </td>
                                                );
                                            }

                                            if (isEditing) {
                                                const inputType =
                                                    col.type === "boolean"
                                                        ? "checkbox"
                                                        : col.type === "price"
                                                            ? "text"
                                                            : col.type || "text";

                                                return (
                                                    <td
                                                        key={col.key}
                                                        className={`p-2 border border-[#787f88] text-sm text-gray-900 ${getAlignment(
                                                            col
                                                        )} dark:bg-gray-800 dark:text-white ${isActions
                                                                ? "sticky right-0 bg-white dark:bg-gray-800 z-10 w-[84px] sm:w-[96px] text-center"
                                                                : ""
                                                            }`}
                                                    >
                                                        <input
                                                            type={inputType}
                                                            value={editValue || ""}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={saveEdit}
                                                            onKeyDown={handleKeyDown}
                                                            autoFocus
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`p-2 border border-[#787f88] text-sm text-gray-900 ${getAlignment(
                                                        col
                                                    )} overflow-hidden whitespace-nowrap text-ellipsis dark:bg-gray-800 dark:text-white ${isActions
                                                            ? "sticky right-0 bg-white dark:bg-gray-800 z-10 w-[84px] sm:w-[96px] text-center"
                                                            : ""
                                                        }`}
                                                    onClick={() =>
                                                        col.editable && startEdit(row.ID, col.key, cellValue)
                                                    }
                                                    title={col.editable ? t("Click to edit") : undefined}
                                                    style={{
                                                        cursor: col.editable ? "pointer" : "default",
                                                        userSelect: "text",
                                                    }}
                                                >
                                                    {col.render
                                                        ? col.render(cellValue, row, extraData)
                                                        : col.type === "select" && col.options
                                                            ? (() => {
                                                                const selectedOption = col.options.find(
                                                                    (opt) =>
                                                                        (typeof opt === "object" ? opt.value : opt) ===
                                                                        cellValue
                                                                );
                                                                return selectedOption
                                                                    ? typeof selectedOption === "object"
                                                                        ? selectedOption.label
                                                                        : selectedOption
                                                                    : cellValue;
                                                            })()
                                                            : col.type === "price"
                                                                ? formatPrice(cellValue)
                                                                : cellValue}
                                                </td>
                                            );
                                        })}

                                        {onDeleteRow && (
                                            <td className="text-center border border-[#787f88] dark:bg-gray-800 dark:text-white flex-shrink-0">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteRow(row.ID);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 dark:text-white"
                                                    title={t("Delete row")} /* Используем t() */
                                                >
                                                    <img
                                                        src="/icons/Trash.svg"
                                                        className="w-6 h-6 hover:scale-125"
                                                        alt={t("Delete")} /* Добавлен alt */
                                                    />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2 p-2 sm:p-4 border-t border-[#787f88]">
                    {/* Кнопка назад */}
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 sm:p-2 disabled:opacity-50"
                    >
                        <img
                            src="https://www.svgrepo.com/show/533620/arrow-sm-left.svg"
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            alt={t("Previous Page")}
                        />
                    </button>

                    {/* Пагинация */}
                    {(() => {
                        const pages = [];
                        const maxVisible = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                        let endPage = startPage + maxVisible - 1;

                        if (endPage > totalPages - 1) {
                            endPage = totalPages - 1;
                            startPage = Math.max(1, endPage - maxVisible + 1);
                        }

                        for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${currentPage === i
                                            ? "bg-blue-500 text-white"
                                            : "border border-gray-300 dark:border-gray-600 dark:text-white"
                                        }`}
                                >
                                    {i}
                                </button>
                            );
                        }

                        // Добавляем последнюю страницу, если она не в видимом диапазоне
                        if (totalPages > maxVisible) {
                            if (endPage < totalPages - 1) {
                                pages.push(<span key="dots" className="px-2">...</span>);
                            }
                            pages.push(
                                <button
                                    key={totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${currentPage === totalPages
                                            ? "bg-blue-500 text-white"
                                            : "border border-gray-300 dark:border-gray-600 dark:text-white"
                                        }`}
                                >
                                    {totalPages}
                                </button>
                            );
                        }

                        return pages;
                    })()}

                    {/* Кнопка вперед */}
                    <button
                        onClick={() =>
                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="p-1 sm:p-2 disabled:opacity-50"
                    >
                        <img
                            src="https://www.svgrepo.com/show/533621/arrow-sm-right.svg"
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            alt={t("Next Page")}
                        />
                    </button>
                </div>
            )}
        </div>
    );

}
