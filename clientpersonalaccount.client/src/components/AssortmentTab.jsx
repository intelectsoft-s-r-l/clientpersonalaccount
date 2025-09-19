import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { DataTable } from "./DataTable";
import { tableDefinitions } from "../config/tableDefinitions";
import { useTranslation } from "react-i18next";
import ValidationModal from "./ValidationModal";
import { validateProducts } from "../validation/validationSchemas";

const AssortmentTab = forwardRef(({ tableKey, data = [], extraData = {}, onDataChange, usersPin = [], onResetPayments, checkDuplicate, loading }, ref) => {
    const [tableData, setTableData] = useState(data);
    const [usersPinData, setUsersPinData] = useState(usersPin);
    const [pinData, setPinData] = useState([]);
    const { t } = useTranslation();
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);

    useImperativeHandle(ref, () => ({
        getData: () => tableData,
    }));

    useEffect(() => {
        setTableData(data);
        setUsersPinData(usersPin);

        if (tableKey == "users" && extraData && extraData.users) {
            let userPins = [];
            extraData.users.forEach(u => userPins.push(u.Pin));
            setPinData(userPins);
        }
    }, [data, usersPin]);

    const table = tableDefinitions(t, data);
    const tableDef = table.find((t) => t.key === tableKey);
    if (!tableDef) return null;

    // Добавляем для select колонок опции для выбора (value + label)
    const columns = tableDef.columns.map((col) => {
        if (col.key === "Group" && extraData.groups) {
            var gr = {
                ...col,
                options: extraData.groups.map((g) => ({ value: g.ID.toString(), label: g.Name })),
                filterOptions: extraData.groups.map((g) => ({ value: g.ID.toString(), label: g.Name })),
            };
            return gr;
        }
        if (col.key === "Assortment" && extraData.products) {
            var as = {
                ...col,
                options: typeof col.options === "function"
                    ? col.options
                    : extraData.products.map((p) => ({ value: p.ID, label: p.Name })),
                filterOptions: extraData.products.map((p) => ({ value: p.ID, label: p.Name })),
            };
            return as;
        }
        return col;
    });

    const handleCellUpdate = (rowId, columnKey, newValue) => {
        setTableData((prevData) => {
            const newData = prevData.map((row) =>
                row.ID === rowId ? { ...row, [columnKey]: newValue } : row
            );
            if (onDataChange) {
                onDataChange(tableKey, newData);
            }

            return newData;
        });
    };

    const handleAddRow = () => {
        if (tableKey === "products" && tableData.length >= 1000) {
            const generalError = { general: [t("validation.maxRows", { count: 1000 })] };
            setValidationErrors(generalError);
            setShowErrors(true);
            return;
        }

        if (tableKey === "departments" && tableData.length >= 30) {
            const generalError = { general: [t("validation.maxRowsDepartments", { count: 30 })] };
            setValidationErrors(generalError);
            setShowErrors(true);
            return;
        }

        if (tableData.length > 0) {
            const prevRow = tableData[0];
            const errors = validateProducts(prevRow, tableKey, usersPin, pinData, t, tableData);
            if (Object.keys(errors).length > 0) {
                setValidationErrors(errors);
                setShowErrors(true);
                return; // блокируем добавление новой строки
            }
        }

        const maxId = tableData.reduce((max, row) => {
            const id = Number(row.ID);
            return !isNaN(id) && id > max ? id : max;
        }, 0);

        const emptyFields = tableDef.columns.reduce((acc, col) => {
            if (col.key !== 'ID') {
                acc[col.key] = '';
            }
            return acc;
        }, {});

        const newRow = {
            ID: maxId + 1 || 1,
            ...emptyFields
        };

        setValidationErrors(prev => {
            const updated = { ...prev };
            delete updated[newRow.ID];
            return updated;
        });

        setTableData(prev => [...prev, newRow]);
    };

    const handleDeleteRow = (rowId) => {
        const newData = tableData.filter((row) => row.ID !== rowId);

        setTableData(newData);
        if (onDataChange) {
            onDataChange(tableKey, newData);
        }

        if (onDataChange) {
            // groups → products
            if (tableKey === "groups" && extraData.products) {
                const updatedProducts = extraData.products.map((p) =>
                    p.Group?.toString() === rowId.toString()
                        ? { ...p, Group: null }
                        : p
                );
                onDataChange("products", updatedProducts);
            }

            // products → departments
            if (tableKey === "products" && extraData.departments) {
                const updatedDepartments = extraData.departments.map((d) => {
                    if (Array.isArray(d.Products) && d.Products.includes(rowId)) {
                        return {
                            ...d,
                            Products: d.Products.filter(pid => pid !== rowId)
                        };
                    }
                    return d;
                });
                onDataChange("departments", updatedDepartments);
            }
        }
    };

    return (
        <div>
            <DataTable
                title={tableDef.title}
                columns={columns}
                data={tableData}
                editable={true}
                onCellUpdate={handleCellUpdate}
                onAddRow={tableKey === "payments" ? undefined : handleAddRow}
                onDeleteRow={handleDeleteRow}
                extraData={extraData}
                onResetPayments={tableKey === "payments" ? onResetPayments : undefined}
                tableClassName="min-w-[1600px]"
                checkDuplicate={tableKey === "departments" ? checkDuplicate : undefined}
                loading={loading}
            />
            <ValidationModal
                errors={validationErrors}
                visible={showErrors}
                onClose={() => setShowErrors(false)}
            />
        </div>
    );
});

export default AssortmentTab;
