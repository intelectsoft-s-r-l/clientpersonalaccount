import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from "react-i18next";
import Select from "react-select";
import Pagination from "../components/Pagination";

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

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName, t }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onMouseDown={(e) => {
                // Закрываем только если клик по самому фону (а не дочерним элементам)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pl-4 pr-4"
                onClick={onClose}
            >
                <div
                    className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        &times;
                    </button>
                    <p className="mb-4">
                        {t("AreYouSureDelete")} <span className="font-bold">{itemName}</span>?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded border mr-auto">
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
        </div>
    );
}

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
    customHeader,
    onResetPayments,
    rowClassName,
    tableClassName,
    checkDuplicate,
    onVisibleRowsChange
}) {
    const [editCell, setEditCell] = useState({ rowId: null, columnKey: null });
    const [editValue, setEditValue] = useState("");
    const [filters, setFilters] = useState({});
    const [globalFilter, setGlobalFilter] = useState(""); // Состояние для глобального поиска
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem("itemsPerPage");
        return saved ? Number(saved) : 20;
    });
    const { t } = useTranslation();
    const [selectSearch, setSelectSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState(null);
    const thRef = useRef(null);
    const [filterWidth, setFilterWidth] = useState(undefined);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
    const inputRef = React.useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            const el = inputRef.current;
            el.focus();
            const length = el.value.length;
            // ставим курсор в конец
            el.setSelectionRange(length, length);
        }
    }, []);

    useEffect(() => {
        if (!thRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (thRef.current) {
                setFilterWidth(thRef.current.offsetWidth);
            }
        });

        resizeObserver.observe(thRef.current);
        setFilterWidth(thRef.current.offsetWidth); // сразу при монтировании

        return () => resizeObserver.disconnect();
    }, [thRef.current]);

    const handleClick = (key) => {
        setActiveFilter(key);
    };

    const handleDeleteClick = (row) => {
        setDeleteItem(row);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (onDeleteRow && deleteItem) {
            onDeleteRow(deleteItem.ID);
        }
        setDeleteModalOpen(false);
        setDeleteItem(null);
    };

    const startEdit = (rowId, columnKey, currentValue) => {
        if (!editable) return;
        setEditCell({ rowId, columnKey });
        setEditValue(currentValue);
        setSelectSearch("");
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

    useEffect(() => {
        if (onVisibleRowsChange) {
            onVisibleRowsChange(filteredData.length);
        }
    }, [filteredData, onVisibleRowsChange]);

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
    }, [sortedData, currentPage, itemsPerPage]);

    const handleItemsPerPageChange = (e) => {
        const value = Number(e.target.value);
        setItemsPerPage(value);
        localStorage.setItem("itemsPerPage", value); // сохраняем выбор
    };

    useEffect(() => {
        if (sortedData.length === 0) {
            setCurrentPage(0);  // ✅ если пусто, страница = 0
        } else if (currentPage === 0) {
            setCurrentPage(1);  // если появились данные, возвращаемся на 1
        } else {
            const maxPage = Math.ceil(sortedData.length / itemsPerPage);
            if (currentPage > maxPage) {
                setCurrentPage(maxPage);
            }
        }
    }, [sortedData, itemsPerPage, currentPage]);

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

    const getAlignmentFlex = (col) => {
        // ID-шки всегда по левому краю
        if (col.key.toLowerCase().includes("id")) return "justify-start";
        // Булевы значения по центру
        if (col.type === "boolean") return "justify-center";
        // Числовые типы по правому краю
        if (["int", "decimal", "float", "number", "price"].includes(col.type)) return "justify-end";
        // Строки и даты по левому краю по умолчанию
        return "justify-start";
    };

    const showDeleteColumn = !!onDeleteRow && pagedData.length > 0;

    const handleKeyDown = (e, rowId, currentColumnKey) => {
        if (e.key === "Tab") {
            e.preventDefault();

            const currentIndex = columns.findIndex(col => col.key === currentColumnKey);

            const editableColumns = columns.filter(col => col.editable && col.key !== "actions");
            const editableKeys = editableColumns.map(col => col.key);

            const currentEditableIndex = editableKeys.findIndex(key => key === currentColumnKey);

            let nextColumnKey = null;

            if (e.shiftKey) {
                if (currentEditableIndex > 0) {
                    nextColumnKey = editableKeys[currentEditableIndex - 1];
                } else {
                    // Если это первая редактируемая ячейка, можно перейти на последнюю редактируемую ячейку в предыдущем ряду (опционально)
                    // Для простоты оставим фокус на первой ячейке.
                }
            } else {
                if (currentEditableIndex < editableKeys.length - 1) {
                    nextColumnKey = editableKeys[currentEditableIndex + 1];
                }
            }

            saveEdit();

            if (nextColumnKey) {
                const nextRow = pagedData.find(r => r.ID === rowId);
                const nextColumn = columns.find(c => c.key === nextColumnKey);
                const nextCellValue = nextRow ? nextRow[nextColumnKey] : "";
                startEdit(rowId, nextColumnKey, nextCellValue);
            } else if (!e.shiftKey) {
                const deleteButton = document.querySelector(`button[data-delete-id="${rowId}"]`);

                if (deleteButton) {
                    deleteButton.focus();
                }
            }
        }

        if (e.key === "Enter") {
            e.preventDefault();
            saveEdit();
        }
        else if (e.key === "Escape") cancelEdit();
    };

    // Определите эту функцию в вашем компоненте
    const handleTabFromDelete = (e, currentRowId) => {
        if (e.key === 'Tab' && !e.shiftKey) { // Tab (не Shift+Tab)
            e.preventDefault();

            // 1. Находим индекс текущего ряда
            const currentRowIndex = pagedData.findIndex(r => r.ID === currentRowId);
            const nextRow = pagedData[currentRowIndex + 1];

            // 2. Если есть следующий ряд
            if (nextRow) {
                // Находим ключ первой редактируемой колонки
                const editableColumns = columns.filter(col => col.editable && col.key !== "actions");
                const firstEditableKey = editableColumns.length > 0 ? editableColumns[0].key : null;

                if (firstEditableKey) {
                    const nextCellValue = nextRow[firstEditableKey];

                    // Начинаем редактирование первой ячейки следующего ряда
                    startEdit(nextRow.ID, firstEditableKey, nextCellValue);
                }
            }
            // Если следующего ряда нет, фокус просто покинет таблицу.
        } else if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();

            // Shift+Tab: Переход обратно на последнюю редактируемую ячейку текущего ряда
            const editableColumns = columns.filter(col => col.editable && col.key !== "actions");
            const lastEditableKey = editableColumns.length > 0 ? editableColumns[editableColumns.length - 1].key : null;

            if (lastEditableKey) {
                const currentRow = pagedData.find(r => r.ID === currentRowId);
                const currentCellValue = currentRow ? currentRow[lastEditableKey] : "";

                // Начинаем редактирование последней ячейки текущего ряда
                startEdit(currentRowId, lastEditableKey, currentCellValue);
            }
        }
    };

    return (
        <>
            <style>{`
            table {
                border-collapse: collapse;
                }
                
            td, th {
                padding: 8px;
            }
                
            /* Применяет рамки только к нужным сторонам ячеек */
            td, th {
                border-right: 1px solid #ddd;
            }

            th {
                border-bottom: 1px solid #ddd;
            }
            
            /* Убирает правую рамку с последней ячейки в каждой строке */
            tr td:last-child, tr th:last-child {
                border-right: none;
                }
            `}</style>
            <div className="bg-white rounded-3xl">
                {/* Заголовок и кнопки */}
                <div className="flex flex-wrap justify-between items-center gap-1 p-3">
                    <h2 className="text-lg sm:text-xl font-semibold truncate max-w-[70%] font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent leading-normal">
                        {title}
                    </h2>

                    <div className="flex items-center gap-2 flex-wrap">

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

                        {onResetPayments && (
                            <button
                                onClick={onResetPayments}
                                className="p-2 hover:bg-gray-100 hover:scale-110 rounded-full transition flex items-center justify-center"
                            >
                                {/* Простой SVG иконки ластика */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-red-600"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    {/* Рисуем более реалистичный ластик */}
                                    <path d="M16.24 3.56a2 2 0 0 0-2.83 0L4 13.97a2 2 0 0 0 0 2.83l3.17 3.17a2 2 0 0 0 2.83 0l9.41-9.41a2 2 0 0 0 0-2.83l-3.17-3.17zM6.5 18.5l-2.5-2.5 7.59-7.59 2.5 2.5L6.5 18.5z" />
                                </svg>
                            </button>
                        )}
                        <div className="flex justify-end p-0 sm:p-4">
                            {customHeader && (<div>{typeof customHeader === "function" ? customHeader() : customHeader}</div>)}
                            <input
                                type="text"
                                placeholder={t("Search")}
                                className="w-full sm:w-64 border border-[#dbdbdb] rounded px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm text-right dark:bg-gray-700 dark:text-white"
                                value={globalFilter}
                                onChange={(e) => handleGlobalFilterChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Поиск */}
                <div className="w-full">
                    {/* Таблица */}
                    <div className="overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent rounded-b-3xl border border-[#dbdbdb] scrollbar-rounded">
                        <div className="overflow-x-auto">
                            <table className={`w-full border-collapse ${tableClassName}`}>
                                <thead>
                                    <tr className="bg-gray-100">
                                        {columns.map((col) => {
                                            const isActions = col.key === "actions";
                                            const isFiltered = (filters[col.key]?.toString().trim() || "") !== ""; // фильтр активен
                                            return (
                                                <th
                                                    key={col.key}
                                                    ref={thRef}
                                                    style={{ width: col.width || "auto", minWidth: col.minWidth || "15px", whiteSpace: "nowrap" }}
                                                    className="px-2 py-1 text-sm font-semibold text-center relative"
                                                >
                                                    <div className={`flex items-center ${getAlignmentFlex(col)} space-x-1`}>
                                                        <span
                                                            className="pl-1 cursor-pointer"
                                                            onClick={() => col.sortable !== false && handleSort(col.sortField ?? col.key)}
                                                        >
                                                            {col.label}
                                                        </span>

                                                        {/* Маленький зелёный кружок для активного фильтра */}
                                                        {isFiltered && <span className="inline-block w-2 h-2 rounded-full bg-green-500" />}

                                                        {sortConfig.key === (col.sortField ?? col.key) && (
                                                            <span className="ml-1 text-xs">
                                                                {sortConfig.direction === "asc" ? "▲" : "▼"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Фильтр под названием колонки */}
                                                    {col.filterable && (
                                                        <div className="mt-1">
                                                            {col.type === "boolean" ? (
                                                                <select
                                                                    value={filters[col.key] ?? ""}
                                                                    onChange={(e) => handleFilterChange(col.key, e.target.value.trim())}
                                                                    className="w-full h-8 p-1 border border-gray-300 rounded text-xs dark:bg-gray-800 dark:text-white"
                                                                >
                                                                    <option value="">{t("All")}</option>
                                                                    <option value="true">{t("True")}</option>
                                                                    <option value="false">{t("False")}</option>
                                                                </select>
                                                            ) : col.filterOptions ? (
                                                                <Select
                                                                    value={col.filterOptions.find(
                                                                        (opt) => String(opt.value ?? opt) === String(filters[col.key])
                                                                    ) || null}
                                                                    onChange={(selected) => handleFilterChange(col.key, selected?.value ?? "")}
                                                                    options={col.filterOptions.map((opt) => ({
                                                                        value: typeof opt === "object" ? opt.value : opt,
                                                                        label: typeof opt === "object" ? opt.label : opt,
                                                                    }))}
                                                                    isClearable
                                                                    placeholder={t("Filter") + "..."}
                                                                    menuPortalTarget={document.body}
                                                                    styles={{
                                                                        container: (base) => ({ ...base, minWidth: "100%", height: '32px' }), // h-8 = 32px
                                                                        control: (base) => ({
                                                                            ...base,
                                                                            minHeight: '32px',
                                                                            height: '32px',
                                                                            fontSize: window.innerWidth < 640 ? "14px" : "12px",
                                                                        }),
                                                                        valueContainer: (base) => ({
                                                                            ...base,
                                                                            height: '32px',
                                                                            padding: '0 6px',
                                                                        }),
                                                                        singleValue: (base) => ({
                                                                            ...base,
                                                                            lineHeight: '32px',
                                                                            marginLeft: 0,
                                                                        }),
                                                                        placeholder: (base) => ({
                                                                            ...base,
                                                                            lineHeight: '32px',
                                                                            marginLeft: 0,
                                                                        }),
                                                                        indicatorsContainer: (base) => ({
                                                                            ...base,
                                                                            height: '32px',
                                                                        }),
                                                                        option: (base) => ({
                                                                            ...base,
                                                                            fontSize: window.innerWidth < 640 ? "14px" : "12px",
                                                                            padding: '4px 8px',
                                                                        }),
                                                                    }}
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="text"
                                                                    value={filters[col.key] || ""}
                                                                    onChange={(e) => handleFilterChange(col.key, e.target.value.trim())}
                                                                    placeholder={`${t("Filter")}...`}
                                                                    className="w-full h-8 p-1 border border-gray-300 rounded text-xs dark:bg-gray-800 dark:text-white"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </th>

                                            );
                                        })}
                                        {showDeleteColumn && <th className="sticky right-0 dark:bg-gray-800 z-20 font-semibold text-center relative " style={{ width: 35, minWidth: 35, whiteSpace: "nowrap" }}></th>}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={columns.length}
                                                className="text-center py-8 text-gray-500 dark:bg-gray-800 dark:text-white border-solid"
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
                                                className="text-center py-8 text-gray-400 dark:bg-gray-800 dark:text-white border-solid"
                                            >
                                                {t("NothingToDisplay")}
                                            </td>
                                        </tr>
                                    ) : (
                                        pagedData.map((row, index) => {
                                            if (row === undefined) return;

                                            const isSelected =
                                                selectedRowId !== undefined && selectedRowId === row.id;
                                            return (
                                                <tr
                                                    key={row.ID || index}
                                                    className={`${onRowClick ? "cursor-pointer" : ""} ${isSelected
                                                        ? "bg-gray-100 dark:bg-gray-700"
                                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        } border-b border-[#dbdbdb]`}
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
                                                            editCell.rowId === row?.ID &&
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
                                                                        className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                            col
                                                                        )} dark:bg-gray-800 dark:text-white`}
                                                                    >
                                                                        <EditorComponent
                                                                            value={String(editValue ?? "")}
                                                                            onChange={(value) => {
                                                                                setEditValue(value);
                                                                            }}
                                                                            onBlur={saveEdit}
                                                                            onKeyDown={(e) => handleKeyDown(e, row?.ID, col.key)}
                                                                        />
                                                                    </td>
                                                                );
                                                            }

                                                            if (col.options) {
                                                                const optionsList = typeof col.options === "function"
                                                                    ? col.options(row, extraData) ?? []
                                                                    : col.options ?? [];

                                                                // находим label текущего выбранного значения
                                                                const selectedOption = optionsList.find(
                                                                    opt => String(opt.value ?? opt) === String(editValue)
                                                                );

                                                                const selectOptions = optionsList
                                                                    .filter(opt => String(opt.value ?? opt) !== String(editValue)) // скрываем выбранный
                                                                    .map(opt => ({
                                                                        value: typeof opt === "object" ? opt.value : opt,
                                                                        label: typeof opt === "object" ? opt.label : opt,
                                                                    }));
                                                                return (
                                                                    <td
                                                                        key={col.key}
                                                                        className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                            col
                                                                        )} dark:bg-gray-800 dark:text-white`}
                                                                    >
                                                                        <Select
                                                                            value={selectedOption ?? ""}
                                                                            onKeyDown={(e) => handleKeyDown(e, row?.ID, col.key)}
                                                                            onChange={(e) => {
                                                                                if (!e) {
                                                                                    setEditValue(null);
                                                                                    return;
                                                                                }

                                                                                const newValue = e.value;
                                                                                if (checkDuplicate) {
                                                                                    const isDuplicate = checkDuplicate(newValue, row);

                                                                                    if (isDuplicate) return; // не сохраняем дубликат
                                                                                }
                                                                                setEditValue(newValue);
                                                                            }}
                                                                            options={selectOptions}
                                                                            onBlur={saveEdit}
                                                                            isClearable
                                                                            placeholder="Выберите..."
                                                                            menuPlacement="auto"
                                                                            menuPortalTarget={document.body}
                                                                            styles={{
                                                                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                                                                control: (base) => ({
                                                                                    ...base,
                                                                                    fontSize: window.innerWidth < 640 ? "14px" : "12px", // уменьшение шрифта на маленьких экранах
                                                                                }),
                                                                                option: (base) => ({
                                                                                    ...base,
                                                                                    fontSize: window.innerWidth < 640 ? "14px" : "12px",
                                                                                }),
                                                                                singleValue: (base) => ({
                                                                                    ...base,
                                                                                    fontSize: window.innerWidth < 640 ? "14px" : "12px",
                                                                                }),
                                                                            }}
                                                                        />
                                                                    </td>
                                                                );
                                                            }

                                                        }

                                                        if (col.type === "price" && isEditing && editCell.columnKey === col.key && editCell.rowId === row?.ID) {
                                                            return (
                                                                <td
                                                                    key={col.key}
                                                                    className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                        col
                                                                    )} dark:bg-gray-800 dark:text-white`}
                                                                >
                                                                    <input
                                                                        ref={inputRef}
                                                                        type="text"
                                                                        value={editValue || ""}
                                                                        autoFocus
                                                                        style={{ width: "100%" }}
                                                                        maxLength={10}
                                                                        onBeforeInput={(e) => {
                                                                            if (!/[0-9,]/.test(e.data)) e.preventDefault();
                                                                        }}
                                                                        onPaste={(e) => {
                                                                            const paste = e.clipboardData.getData("text");
                                                                            if (/[^0-9,]/.test(paste)) e.preventDefault();
                                                                        }}
                                                                        onChange={(e) => {
                                                                            const newValue = e.target.value.replace(/[^0-9,]/g, "");
                                                                            const maxPrice = process.env.NODE_ENV === "development" ? 3000000 : 100000;
                                                                            
                                                                            if (!isNaN(newValue) && newValue > maxPrice) return;

                                                                            setEditValue(newValue);
                                                                            onCellUpdate(row?.ID, col.key, newValue);
                                                                        }}
                                                                        onBlur={saveEdit}
                                                                        onKeyDown={(e) => handleKeyDown(e, row?.ID, col.key)}
                                                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                                                                    />
                                                                </td>
                                                            );
                                                        }

                                                        if (col.type === "boolean") {
                                                            return (
                                                                <td
                                                                    key={col.key}
                                                                    className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                        col
                                                                    )} dark:bg-gray-800 dark:text-white`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!row[col.key]}
                                                                        onChange={(e) =>
                                                                            onCellUpdate(row?.ID, col.key, e.target.checked)
                                                                        }
                                                                        className="m-2"
                                                                        onKeyDown={(e) => handleKeyDown(e, row?.ID, col.key)}
                                                                    />
                                                                </td>
                                                            );
                                                        }

                                                        if (isEditing) {
                                                            const inputType = col.type ? col.type : "text";

                                                            return (
                                                                <td
                                                                    key={col.key}
                                                                    className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                        col
                                                                    )} dark:bg-gray-800 dark:text-white`}
                                                                >
                                                                    <input
                                                                        ref={inputRef}
                                                                        type={inputType}
                                                                        value={editValue || ""}
                                                                        onChange={(e) => {
                                                                            let val = e.target.value.trim();
                                                                            if (col.type === "number")
                                                                                val = val.replace(/[^0-9.]/g, "");
                                                                            if (col.maxLength) val = val.slice(0, col.maxLength);
                                                                            setEditValue(val);

                                                                            // Авто-рост textarea
                                                                            e.target.style.height = "auto"; // сбрасываем высоту
                                                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                                                        }}
                                                                        onBlur={saveEdit}
                                                                        onKeyDown={(e) => handleKeyDown(e, row.ID, col.key)}
                                                                        autoFocus
                                                                        rows={1}
                                                                        className=" w-full border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white resize-none"
                                                                        style={{ minHeight: "1.5rem", overflow: "hidden" }}
                                                                    />
                                                                </td>
                                                            );
                                                        }

                                                        return (
                                                            <td
                                                                key={col.key}
                                                                className={`p-2 border-r border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                    col
                                                                )} dark:bg-gray-800 dark:text-white`}
                                                                onClick={() =>
                                                                    col.editable && startEdit(row.ID, col.key, cellValue)
                                                                }
                                                                title={col.editable ? t("Click to edit") : undefined}
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
                                                    {showDeleteColumn && (
                                                        <td key="actions-col" className="text-center dark:bg-gray-800 dark:text-white flex-shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(row);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 dark:text-white"
                                                                title={t("Delete")} /* Используем t() */
                                                                data-delete-id={row.ID}
                                                                onKeyDown={(e) => handleTabFromDelete(e, row.ID)}
                                                            >
                                                                <img
                                                                    src="/icons/Trash.svg"
                                                                    className="w-5 h-5 hover:scale-125"
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
                        <div className="flex items-center justify-between p-2 text-sm">
                            <div className="relative flex-shrink-0 flex mr-auto">
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="block w-full py-1 pl-3 pr-8 text-sm border border-gray-300 rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 appearance-none cursor-pointer"
                                >
                                    {[5, 10, 20, 50, 100].map(size => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                                {/* Стрелка кастомная */}
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-300">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4 4.7a.75.75 0 01-1.14 0l-4-4.7a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                setCurrentPage={setCurrentPage}
                                onRefresh={onRefresh}
                                t={t}
                            />
                        </div>
                    </div>
                </div>
                <ConfirmDeleteModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    itemName={deleteItem?.Name || deleteItem?.Title || deleteItem?.ID}
                    t={t}
                />
            </div>
        </>
    );
}
