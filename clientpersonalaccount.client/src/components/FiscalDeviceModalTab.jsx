// FiscalDeviceModalTab.jsx
import React, { useEffect, useState, forwardRef, useImperativeHandle, callback } from "react";
import { DataTable } from "./DataTable";
import { tableDefinitions } from "../config/tableDefinitions";
import { useTranslation } from "react-i18next";
import { validateDevice } from "../validation/validationSchemas";
import ValidationModal from "./ValidationModal";
import Toast from "../components/Toast";

const FiscalDeviceModalTab = forwardRef(({ tableKey, data = [], onDataChange }, ref) => {
    const [tableData, setTableData] = useState(data);
    const { t } = useTranslation();
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(null);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(null);

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
    const columns = tableDef.columns.map((col) => {
        if (col.key === "DateOfChange") {
            return {
                ...col,
                editable: col.editable ?? true,
                render: (value) => {
                    if (!value) return "";
                    const date = new Date(value);
                    const pad = (n) => n.toString().padStart(2, "0");
                    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                },
            };
        }

        return {
            ...col,
            editable: col.editable ?? true,
            dateEditor: col.key === "StartOfPeriod" || col.key === "EndOfPeriod" ? TimeSelectEditor : undefined,
        };
    });

    const handleCellUpdate = (rowId, columnKey, newValue, callback) => {
        setTableData((prevData) => {
            const newData = prevData.map((row) => {
                if (row.ID !== rowId) return row;

                const updatedRow = { ...row };
                if (columnKey === "NoVat") {
                    updatedRow.NoVat = !!newValue;
                    if (updatedRow.NoVat) {
                        updatedRow.VatValue = 0;

                        if (!updatedRow.VatCode)
                            updatedRow.VatCode = "_";
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
        // Проверяем, есть ли строки с незаполненными полями (кроме ID)
        const hasEmptyRow = tableData.some(row =>
            tableDef.columns.some(col => {
                if (col.key === "ID") return false; // пропускаем ID
                if (tableKey === "vatRates" && col.key === "NoVat") return false; // пропускаем NoVat
                const val = row[col.key];
                return val === null || val === undefined || val.toString().trim() === "";
            })
        );

        if (hasEmptyRow) {
            setShowErrorMessage(t("FieldsControlerForNull"));
            setIsErrorModalVisible(true);
            return;
        }

        // Находим максимальный ID
        const maxId = tableData.reduce((max, row) => {
            const id = Number(row.ID);
            return !isNaN(id) && id > max ? id : max;
        }, 0);

        // Создаём пустые поля для новой строки
        const emptyFields = tableDef.columns.reduce((acc, col) => {
            if (col.key === "ID") return acc; // пропускаем ID

            if (col.key === "StartOfPeriod" || col.key === "EndOfPeriod") {
                acc[col.key] = "00:00:00"; // время по умолчанию
            } else {
                acc[col.key] = ""; // текстовое поле
            }

            return acc;
        }, {});

        const newRow = {
            ID: maxId + 1 || 1,
            ...emptyFields
        };
        const updatedData = [newRow, ...tableData];
        setTableData(updatedData);
        onDataChange(updatedData);
    };

    const handleDeleteRow = (rowId) => {
        setTableData((prevData) => {
            let newData = null;
            if (tableKey === "vatRates")
                newData = prevData.map(row => {
                    console.log(rowId, row, prevData);
                    if (row?.ID === rowId) {
                        return {
                            ...row,
                            VatValue: 0,
                            NotVat: false,
                            VatCode: "-",
                        };
                    }
                    return row;
                });
            else
                newData = tableData.filter((row) => row.ID !== rowId);
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
                tableClassName="min-w-[100px]"
            />
            <Toast
                visible={isSuccessModalVisible}
                message={showSuccessMessage}
                onClose={() => setIsSuccessModalVisible(false)}
                type="success"
            />
            <Toast
                visible={isErrorModalVisible}
                message={showErrorMessage}
                onClose={() => setIsErrorModalVisible(false)}
                type="error"
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
