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

    const TimeSelectEditor = ({ value, onChange, onBlur }) => {

        const generateHalfHourOptions = () => {
            const times = [];
            for (let h = 0; h < 24; h++) {
                for (let m = 0; m < 60; m += 30) {
                    const hour = h.toString().padStart(2, "0");
                    const minute = m.toString().padStart(2, "0");
                    times.push(`${hour}:${minute}`);
                }
            }
            return times;
        };

        const options = generateHalfHourOptions();

        return (
            <select
                className="border border-gray-300 rounded px-2 py-1 w-full"
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                onBlur={(e) => onBlur(e.target.value)}
            >
                <option value="">--:--</option>
                {options.map((time) => (
                    <option key={time} value={time}>
                        {time}
                    </option>
                ))}
            </select>
        );
    };

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
        editable: col.editable ?? true,
        dateEditor: col.key === "StartOfPeriod" || col.key === "EndOfPeriod" ? TimeSelectEditor : undefined,
    }));

    const handleCellUpdate = (rowId, columnKey, newValue, callback) => {
        setTableData((prevData) => {
            if (!Array.isArray(prevData)) return prevData;

            const newData = prevData.map((row) => {
                if (row.ID !== rowId) return row;

                const updatedRow = { ...row };
                if (columnKey === "NoVat") {
                    updatedRow.NoVat = !!newValue;
                    if (updatedRow.NoVat) {
                        updatedRow.VatValue = 0;
                        updatedRow.VatCode = "-";
                    }
                } else {
                    updatedRow[columnKey] = newValue;
                    if (updatedRow.NoVat) {
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

            if (onDataChange)
                onDataChange(newData);

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
            ...emptyFields
        };

        setTableData((prev) => [newRow, ...prev]);
    };

    const handleDeleteRow = (rowId) => {
        setTableData((prevData) => {
            const newData = prevData.map(row => {
                if (row.ID === rowId) {
                    return {
                        ...row,
                        VatValue: 0,
                        NotVat: false,
                        VatCode: "-",
                    };
                }
                return row;
            });

            onDataChange && onDataChange(newData);
            return newData;
        });
    };

    return (
        <div className="overflow-x-auto">
            <DataTable
                title={tableDef.title}
                columns={columns}
                data={tableData}
                editable={true}
                onCellUpdate={handleCellUpdate}
                onAddRow={tableKey === "vatHistory" ? undefined : handleAddRow}
                onDeleteRow={tableKey === "vatHistory" ? undefined : handleDeleteRow}
                tableClassName="min-w-[1200px] xl:min-w-[100px]"
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
