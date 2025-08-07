import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { DataTable } from "./DataTable";
import { tableDefinitions } from "../config/tableDefinitions";
import { useTranslation } from "react-i18next";
import ValidationModal from "./ValidationModal";
import { validateProducts } from "../validation/validationSchemas";

const AssortmentTab = forwardRef(({ tableKey, data = [], extraData = {}, onDataChange, usersPin = []}, ref) => {
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

    const table = tableDefinitions(t);
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
                options: extraData.products.map((p) => ({ value: p.ID, label: p.Name })),
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

            const editedRow = newData.find(row => row.ID === rowId);

            let errors = {};
            if (tableKey === "users")
                errors = validateProducts([editedRow], tableKey, usersPinData, pinData);
            else
                errors = validateProducts([editedRow], tableKey);

            if (Object.keys(errors).length > 0) {
                setValidationErrors(prev => ({ ...prev, [rowId]: errors }));
                setShowErrors(true);
            } else {
                setValidationErrors(prev => {
                    const updated = { ...prev };
                    delete updated[rowId];
                    return updated;
                });

                // если строка валидна и это новая — снимаем isNew и сохраняем
                if (editedRow.isNew) {
                    editedRow.isNew = false;
                    if (onDataChange) onDataChange(tableKey, newData.filter(r => !r.isNew));
                }
            }

            return newData;
        });
    };

    const handleAddRow = () => {
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
            ...emptyFields,
            isNew: true,
        };

        setTableData(prev => [...prev, newRow]);
    };

    const handleDeleteRow = (rowId) => {
        const newData = tableData.filter((row) => row.ID !== rowId);
        setTableData(newData);
        if (onDataChange) {
            onDataChange(tableKey, newData.filter(r => !r.isNew));
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
