// FiscalDeviceModalTab.jsx
import React, { useEffect, useState, forwardRef, useImperativeHandle, callback } from "react";
import { DataTable } from "./DataTable";
import { tableDefinitions } from "../config/tableDefinitions";
import { useTranslation } from "react-i18next";
import { validateDevice } from "../validation/validationSchemas";
import ValidationModal from "./ValidationModal";

const FiscalDeviceModalTab = forwardRef(({ tableKey, data = [], onDataChange }, ref) => {
    const [tableData, setTableData] = useState(data);
    const { t } = useTranslation();
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);

    useImperativeHandle(ref, () => ({
        getData: () => tableData,
    }));

    useEffect(() => {
        setTableData(data);
    }, [data]);

    const table = tableDefinitions(t);
    const tableDef = table.find((t) => t.key === tableKey);
    if (!tableDef) return null;

    // Правильно мапим колонки
    const columns = tableDef.columns.map((col) => ({
        ...col,
        label: t(col.labelKey || col.key),
        editable: col.editable ?? true,
    }));

    const handleCellUpdate = (rowId, columnKey, newValue, callback) => {
        setTableData((prevData) => {
            if (!Array.isArray(prevData)) return prevData;
            console.log('rowId:', rowId);
            console.log('IDs:', prevData.map(row => row.ID));
            const newData = prevData.map((row) => {
                if (row.ID !== rowId) return row;

                const updatedRow = { ...row };

                if (columnKey === "NotVat") {
                    updatedRow.NotVat = !!newValue;
                    if (updatedRow.NotVat) {
                        updatedRow.VatValue = 0;
                        updatedRow.VatCode = "";
                    }
                } else {
                    updatedRow[columnKey] = newValue;
                    if (updatedRow.NotVat) {
                        updatedRow.VatValue = 0;
                        updatedRow.VatCode = "";
                    }
                }

                // Снимаем флаг isNew, если строка была новой и прошла валидацию
                if (updatedRow.isNew) {
                    updatedRow.isNew = false;
                }

                return updatedRow;
            });

            const editedRow = newData.find((row) => row.ID === rowId);

            // Валидируем
            let errors = {};
            errors = validateDevice([editedRow], tableKey, prevData);

            if (Object.keys(errors).length > 0) {
                setValidationErrors(prev => ({ ...prev, [rowId]: errors }));
                setShowErrors(true);
            } else {
                setValidationErrors(prev => {
                    const updated = { ...prev };
                    delete updated[rowId];
                    return updated;
                });

                // Если строка валидна и новая — снимаем isNew
                if (editedRow.isNew)
                    editedRow.isNew = false;
                console.log(newData);
                if (onDataChange)
                    onDataChange(newData);
            }

            if (callback) callback();
            return newData;
        });
    };

    const handleAddRow = () => {
        const maxId = tableData.reduce((max, row) => {
            const id = Number(row.ID);
            return !isNaN(id) && id > max ? id : max;
        }, 0);

        const emptyFields = tableDef.columns.reduce((acc, col) => {
            if (col.key !== "ID") {
                acc[col.key] = "";
            }
            return acc;
        }, {});

        const newRow = {
            ID: maxId + 1 || 1,
            ...emptyFields,
            isNew: true,
        };

        setTableData((prev) => [...prev, newRow]);
    };

    const handleDeleteRow = (rowId) => {
        setTableData((prevData) => {
            const newData = prevData.map(row => {
                if (row.ID === rowId) {
                    return {
                        ...row,
                        VatValue: 0,
                        NotVat: false,
                        VatCode: "",
                    };
                }
                return row;
            });

            onDataChange && onDataChange(newData.filter(r => !r.isNew));
            return newData;
        });
    };

    return (
        <div>
            <DataTable
                title={tableDef.title}
                columns={columns}
                data={tableData}
                editable={true}
                onCellUpdate={handleCellUpdate}
                onAddRow={tableKey === "vatHistory" ? undefined : handleAddRow}
                onDeleteRow={tableKey === "vatHistory" ? undefined : handleDeleteRow}
            />
            <ValidationModal
                errors={validationErrors}
                visible={showErrors}
                onClose={() => setShowErrors(false)}
            />
        </div>
    );
});

export default FiscalDeviceModalTab;
