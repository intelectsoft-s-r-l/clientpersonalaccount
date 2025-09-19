import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useTranslation } from "react-i18next";
import Select from "react-select";

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
    customHeader,
    onResetPayments,
    rowClassName,
    tableClassName,
    checkDuplicate
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
    }, [sortedData, currentPage, itemsPerPage]);

    const handleItemsPerPageChange = (e) => {
        const value = Number(e.target.value);
        setItemsPerPage(value);
        localStorage.setItem("itemsPerPage", value); // сохраняем выбор
    };

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

    return (
        <>
            <div className="bg-white rounded-3xl">
                {/* Заголовок и кнопки */}
                <div className="flex flex-wrap justify-between items-center gap-1 p-3">
                    <h2 className="text-lg sm:text-xl font-semibold truncate max-w-[70%] font-bold bg-gradient-to-r from-[#72b827] to-green-600 bg-clip-text text-transparent leading-normal">
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
                            <table className={`w-full table-fixed border-collapse ${tableClassName}`}>
                                <thead>
                                    <tr className="bg-gray-100">
                                        {columns.map((col) => {
                                            const isActions = col.key === "actions";
                                            const isFiltered = (filters[col.key]?.toString().trim() || "") !== ""; // фильтр активен
                                            return (
                                                <th
                                                    key={col.key}
                                                    ref={thRef}
                                                    style={{ width: col.width || "auto", minWidth: isActions ? "120px" : undefined, whiteSpace: "pre-line" }}
                                                    className={`"px-2 py-1 border text-sm font-semibold text-center relative "`}
                                                    onClick={() => col.sortable !== false && handleSort(col.sortField ?? col.key)}
                                                >
                                                    <div className={`flex items-center ${getAlignmentFlex(col)} space-x-1`}>
                                                        <span className="break-words pl-2">{col.label}</span>

                                                        {/* Маленький зелёный кружок для активного фильтра */}
                                                        {isFiltered && (
                                                            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                                                        )}

                                                        {sortConfig.key === (col.sortField ?? col.key) && (
                                                            <span className="ml-1 text-xs">
                                                                {sortConfig.direction === "asc" ? "▲" : "▼"}
                                                            </span>
                                                        )}

                                                        {col.filterable && !activeFilter && (
                                                            <div
                                                                className="w-6 h-6 cursor-pointer flex items-center justify-center"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleClick(col.key);
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Поле фильтра */}
                                                    {col.filterable && activeFilter === col.key && (
                                                        <div
                                                            id={`filter-${col.key}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute top-full left-0 mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-300 rounded shadow-lg"
                                                        >
                                                            {col.type === "boolean" ? (
                                                                <select
                                                                    value={filters[col.key] ?? ""}
                                                                    onChange={(e) => handleFilterChange(col.key, e.target.value.trim())}
                                                                    className="w-full p-1 border-gray-300 rounded text-xs dark:bg-gray-800 dark:text-white"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <option value="">{t("All")}</option>
                                                                    <option value="true">{t("True")}</option>
                                                                    <option value="false">{t("False")}</option>
                                                                </select>
                                                            ) : col.filterOptions ? (
                                                                <select
                                                                    value={filters[col.key] ?? ""}
                                                                    onChange={(e) => handleFilterChange(col.key, e.target.value.trim())}
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
                                                                    onChange={(e) => handleFilterChange(col.key, e.target.value.trim())}
                                                                    placeholder={`${t("Filter")}...`}
                                                                    className="w-full p-1 border border-gray-300 rounded text-xs dark:bg-gray-800 dark:text-white"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </th>
                                            );
                                        })}
                                        {showDeleteColumn && <th className="sticky right-0 dark:bg-gray-800 z-20 border font-semibold text-center relative " style={{ width: "3%", whiteSpace: "nowrap" }}></th>}
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
                                            const isSelected =
                                                selectedRowId !== undefined && selectedRowId === row.id;
                                            return (
                                                <tr
                                                    key={row.ID || index}
                                                    className={`${onRowClick ? "cursor-pointer" : ""} ${isSelected
                                                        ? "bg-gray-100 dark:bg-gray-700"
                                                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        } break-words border border-[#dbdbdb]`}
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
                                                                            styles={{
                                                                                menu: (provided) => ({
                                                                                    ...provided,
                                                                                    maxHeight: 200, // максимум высоты меню
                                                                                }),
                                                                            }}
                                                                        />
                                                                    </td>
                                                                );
                                                            }
                                                        }

                                                        if (col.type === "price" && isEditing && editCell.columnKey === col.key && editCell.rowId === row.ID) {
                                                            return (
                                                                <td
                                                                    key={col.key}
                                                                    className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                        col
                                                                    )} break-words dark:bg-gray-800 dark:text-white`}
                                                                >
                                                                    <input
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
                                                                            setEditValue(newValue);
                                                                            handleCellUpdate(row.ID, col.key, newValue);
                                                                        }}
                                                                        onBlur={saveEdit}
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
                                                                    className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                        col
                                                                    )} break-words dark:bg-gray-800 dark:text-white`}
                                                                >
                                                                    <textarea
                                                                        type={inputType}
                                                                        value={editValue || ""}
                                                                        onChange={(e) => {
                                                                            let val = e.target.value.trim();
                                                                            // Для чисел и цены фильтруем только цифры и запятую/точку
                                                                            if (col.type === "price")
                                                                                val = val.replace(/[^0-9.,]/g, "");

                                                                            if (col.type === "number")
                                                                                val = val.replace(/[^0-9.]/g, "");

                                                                            setEditValue(val);

                                                                            // Авто-рост textarea
                                                                            e.target.style.height = "auto"; // сбрасываем высоту
                                                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                                                        }}
                                                                        onBlur={saveEdit}
                                                                        onKeyDown={handleKeyDown}
                                                                        autoFocus
                                                                        rows={1}
                                                                        className="break-words w-full border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white resize-none"
                                                                        style={{ minHeight: "1.5rem", overflow: "hidden" }}
                                                                    />
                                                                </td>
                                                            );
                                                        }

                                                        return (
                                                            <td
                                                                key={col.key}
                                                                className={`p-2 border border-[#dbdbdb] text-sm text-gray-900 ${getAlignment(
                                                                    col
                                                                )} break-words dark:bg-gray-800 dark:text-white`}
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
                                                    {showDeleteColumn && (
                                                        <td className="text-center border border-[#dbdbdb] dark:bg-gray-800 dark:text-white flex-shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteRow(row.ID);
                                                                }}
                                                                className="text-red-600 hover:text-red-800 dark:text-white"
                                                                title={t("Delete")} /* Используем t() */
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
                        <div className="flex flex-col sm:flex-row justify-between items-center p-1 text-sm">
                            {/* Левая часть: select и информация о странице */}
                            <div className="relative inline-block w-20 sm:w-auto p-2">
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

                            {/* Правая часть: кнопки пагинации */}
                            <div className="flex flex-wrap justify-center items-center space-x-1 p-2">
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
                                    {t("Page")} {totalPages ? currentPage : 0} {t("Of")} {totalPages}
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex flex-wrap justify-center gap-1 p-2">
                                        {/* Назад */}
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-1 py-1 rounded disabled:opacity-50 hover:bg-gray-200"
                                        >
                                            &lt;
                                        </button>

                                        {(() => {
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
                                                    <button
                                                        key={1}
                                                        onClick={() => setCurrentPage(1)}
                                                        className={`px-1 py-1 rounded ${currentPage === 1 ? "bg-gray-200 text-black" : "hover:bg-gray-200"
                                                            }`}
                                                    >
                                                        1
                                                    </button>
                                                );
                                                if (startPage > 2) {
                                                    pages.push(<span key="start-dots" className="px-0">...</span>);
                                                }
                                            }

                                            // Основные страницы
                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i)}
                                                        className={`px-2 py-1 rounded ${currentPage === i ? "bg-gray-200 text-black" : "hover:bg-gray-200"
                                                            }`}
                                                    >
                                                        {i}
                                                    </button>
                                                );
                                            }

                                            // Последняя страница и "..."
                                            if (endPage < totalPages) {
                                                if (endPage < totalPages - 1) {
                                                    pages.push(<span key="end-dots" className="px-0">...</span>);
                                                }
                                                pages.push(
                                                    <button
                                                        key={totalPages}
                                                        onClick={() => setCurrentPage(totalPages)}
                                                        className={`px-1 py-1 rounded ${currentPage === totalPages ? "bg-gray-200 text-black" : "hover:bg-gray-200"
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
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-2 py-1 rounded disabled:opacity-50 hover:bg-gray-200"
                                        >
                                            &gt;
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
