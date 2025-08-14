import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowPathIcon } from '@heroicons/react/24/outline';

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
    onRefresh
}) {
    const [editCell, setEditCell] = useState({ rowId: null, columnKey: null });
    const [editValue, setEditValue] = useState("");
    const [filters, setFilters] = useState({});
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
        return data.filter((row) =>
            columns.every((col) => {
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
            })
        );
    }, [data, filters, columns]);

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

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden select-none dark:bg-gray-800 dark:text-white">
            <div className="p-4 border-b flex justify-between items-center dark:bg-gray-800 dark:text-white">
                <h2 className="text-xl font-semibold dark:bg-gray-800 dark:text-white">{title}</h2>
                <div className="flex items-center gap-2 dark:bg-gray-800 dark:text-white">
                    {onAddRow && (
                        <button
                            onClick={onAddRow}
                            className="px-3 py-1 text-sm rounded dark:bg-gray-800 dark:text-white"
                        >
                            <img
                                src="/icons/AddRow.svg"
                                className="w-6 h-6 transform transition-transform duration-200 ease-in-out hover:scale-125"
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

                    <div className="text-sm text-gray-600 dark:bg-gray-800 dark:text-white">
                        {t("Page")} {currentPage} {t("Of")} {totalPages}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto w-full dark:bg-gray-800 dark:text-white">
                <table className="w-full border-collapse table-fixed min-w-full dark:bg-gray-800 dark:text-white">
                    <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 dark:bg-gray-800 dark:text-white">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width || "auto" }}
                                    className={`relative text-xs font-bold uppercase tracking-wider p-2 border-gray-300 ${col.align === "right"
                                        ? "text-right"
                                        : col.align === "left"
                                            ? "text-left"
                                            : "text-center"} dark:text-white`}
                                >
                                    {/* Заголовок + сортировка + SVG */}
                                    <div className="flex items-center justify-center space-x-1">
                                        <span className="truncate">{col.label}</span>
                                        {sortConfig.key === col.key && (
                                            <span className="ml-1 text-xs">
                                                {sortConfig.direction === "asc" ? "▲" : "▼"}
                                            </span>
                                        )}
                                        {col.filterable && (
                                            <>
                                                {!activeFilter || activeFilter !== col.key ? (
                                                    <div
                                                        className="w-6 h-6 cursor-pointer flex items-center justify-center"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClick(col.key);
                                                        }}
                                                    >
                                                        <img
                                                            src="/icons/Filter.svg"
                                                            alt="Filter"
                                                            className="w-full h-full"
                                                        />
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                    </div>

                                    {/* Поле фильтра */}
                                    {col.filterable && activeFilter === col.key && (
                                        <div id={`filter-${col.key}`} onClick={(e) => e.stopPropagation()} className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-300 rounded shadow-lg">
                                            {col.filterOptions ? (
                                                <select
                                                    value={filters[col.key] ?? ""}
                                                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                                                    className="w-full p-1 border-gray-300 rounded text-xs dark:bg-gray-800 dark:text-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="">{t("All")}</option>
                                                    {(col.filterOptions || []).map((opt) => (
                                                        <option
                                                            key={typeof opt === "object" ? opt.value : opt}
                                                            value={typeof opt === "object" ? opt.value : opt}
                                                        >
                                                            {typeof opt === "object" ? opt.label : opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={filters[col.key] || ""}
                                                    onChange={(e) => handleFilterChange(col.key, e.target.value)}
                                                    placeholder={`${t("Filter")}...`}
                                                    className="w-full p-1 border-gray-300 rounded text-xs dark:bg-gray-800 dark:text-white"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </div>
                                    )}
                                </th>
                            ))}
                            {onDeleteRow && <th className="w-12 dark:bg-gray-800 dark:text-white"></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:bg-gray-800 dark:text-white">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="text-center py-8 text-gray-500 dark:bg-gray-800 dark:text-white"
                                >
                                    <div className="flex items-center justify-center h-64 dark:bg-gray-800 dark:text-white">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid dark:bg-gray-800 dark:text-white"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : pagedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="text-center py-8 text-gray-400 dark:bg-gray-800 dark:text-white"
                                >
                                    Нет данных для отображения
                                </td>
                            </tr>
                        ) : (
                            pagedData.map((row, index) => {
                                const isSelected =
                                    selectedRowId !== undefined && selectedRowId === row.ID;
                                return (
                                    <tr
                                        key={row.ID || index}
                                        className={`${onRowClick ? "cursor-pointer" : ""} ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"
                                            }`}
                                        onClick={
                                            onRowClick
                                                ? () => {
                                                    window.getSelection()?.removeAllRanges();
                                                    onRowClick(row);
                                                }
                                                : undefined
                                        }
                                        onDoubleClick={
                                            onRowDoubleClick
                                                ? () => onRowDoubleClick(row)
                                                : undefined
                                        }
                                        style={{ userSelect: "none" }}
                                    >
                                        {columns.map((col) => {
                                            const isEditing = editCell.rowId === row.ID && editCell.columnKey === col.key;

                                            const rawValue = row[col.key];
                                            const cellValue =
                                                typeof rawValue === "object" && rawValue !== null
                                                    ? rawValue.Price ?? JSON.stringify(rawValue)
                                                    : rawValue;

                                            // Рендер редактируемой ячейки для селекта
                                            if (isEditing) {
                                                if (col.dateEditor) {
                                                    const EditorComponent = col.dateEditor;
                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className={`p-2 border-gray-200 text-sm text-gray-900 ${col.align === "right" ? "text-right" : col.align === "left" ? "text-left" : "text-center"
                                                                } dark:bg-gray-800 dark:text-white`}
                                                        >
                                                            <EditorComponent
                                                                value={String(editValue ?? "")}
                                                                onChange={(value) => { setEditValue(value); }}
                                                                onBlur={saveEdit}
                                                            />
                                                        </td>
                                                    );
                                                }

                                                if (col.options) {
                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className={`p-2 border-gray-200 text-sm text-gray-900 ${col.align === "right" ? "text-right" : col.align === "left" ? "text-left" : "text-center"
                                                                } dark:bg-gray-800 dark:text-white`}
                                                        >
                                                            <select
                                                                autoFocus
                                                                className="w-full p-1 border border-gray-300 rounded"
                                                                value={String(editValue ?? "")}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onBlur={saveEdit}
                                                                onKeyDown={handleKeyDown}
                                                            >
                                                                <option value="">--</option>
                                                                {col.options.map((opt) => (
                                                                    <option
                                                                        key={typeof opt === "object" ? opt.value : opt}
                                                                        value={String(typeof opt === "object" ? opt.value : opt)}
                                                                    >
                                                                        {typeof opt === "object" ? opt.label : opt}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                }
                                            }

                                            // Рендер редактируемой boolean (чекбокс) — сразу интерактивный (без двойного клика)
                                            if (col.type === "boolean") {
                                                return (
                                                    <td
                                                        key={col.key}
                                                        className={`p-2 border-gray-200 text-sm text-gray-900 ${col.align === "right" ? "text-right" : col.align === "left" ? "text-left" : "text-center"
                                                            } dark:bg-gray-800 dark:text-white`}
                                                    // Без onDoubleClick — сразу интерактивный
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row[col.key]}
                                                            onChange={(e) => onCellUpdate(row.ID, col.key, e.target.checked)}
                                                            className="m-2"
                                                        />
                                                    </td>
                                                );
                                            }

                                            // Рендер редактируемой ячейки (текст/число)
                                            if (isEditing) {
                                                const inputType =
                                                    col.type === "boolean" ? "checkbox" : col.type === "price" ? "text" : col.type || "text";

                                                return (
                                                    <td
                                                        key={col.key}
                                                        className={`p-2 border-gray-200 text-sm text-gray-900 ${col.align === "right" ? "text-right" : col.align === "left" ? "text-left" : "text-center"
                                                            } dark:bg-gray-800 dark:text-white`}
                                                    >
                                                        <input
                                                            type={inputType}
                                                            value={editValue || ""}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={saveEdit}
                                                            onKeyDown={handleKeyDown}
                                                            autoFocus
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                                        />
                                                    </td>
                                                );
                                            }

                                            // Не редактируемая ячейка — запускаем редактирование по одному клику, если editable
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`p-2 border-gray-200 text-sm text-gray-900 ${col.align === "right" ? "text-right" : col.align === "left" ? "text-left" : "text-center"
                                                        } dark:bg-gray-800 dark:text-white`}
                                                    onClick={() => col.editable && startEdit(row.ID, col.key, cellValue)}
                                                    title={col.editable ? "Клик для редактирования" : undefined}
                                                    style={{
                                                        cursor: col.editable ? "pointer" : "default",
                                                        userSelect: "text",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {col.render
                                                        ? col.render(cellValue, row, extraData)
                                                        : col.type === "select" && col.options
                                                            ? (() => {
                                                                const selectedOption = col.options.find(
                                                                    (opt) => (typeof opt === "object" ? opt.value : opt) === cellValue
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
                                            <td className="text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteRow(row.ID);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 dark:bg-gray-800 dark:text-white"
                                                    title="Удалить строку"
                                                >
                                                    <img
                                                    src="/icons/Trash.svg"
                                                        className="w-6 h-6 hover:scale-125"
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
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 dark:bg-gray-800 dark:text-white">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                    >
                        ⬅
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                            if (page === 1 || page === totalPages) return true;
                            if (currentPage <= 5) return page <= 5;
                            if (currentPage >= totalPages - 4) return page >= totalPages - 4;
                            return Math.abs(currentPage - page) <= 2;
                        })
                        .map((page, i, arr) => {
                            const prevPage = arr[i - 1];
                            const showDots = prevPage && page - prevPage > 1;

                            return (
                                <React.Fragment key={page}>
                                    {showDots && (
                                        <span className="px-2 text-gray-500">...</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 text-sm rounded-full ${currentPage === page
                                            ? "bg-blue-500 text-white"
                                            : " border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-white"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                </React.Fragment>
                            );
                        })}

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-white"
                    >
                        ➡
                    </button>
                </div>
            )}
        </div>
    );
}
