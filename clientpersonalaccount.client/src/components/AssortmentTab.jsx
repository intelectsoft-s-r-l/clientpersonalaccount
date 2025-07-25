import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { DataTable } from "./DataTable";
import { tableDefinitions } from "../config/tableDefinitions";
import { useTranslation } from "react-i18next";

const AssortmentTab = forwardRef(({ tableKey, data = [], extraData = {}, onDataChange }, ref) => {
  const [tableData, setTableData] = useState(data);
  const { t } = useTranslation();

  useImperativeHandle(ref, () => ({
    getData: () => tableData,
  }));

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const table = tableDefinitions(t);
  const tableDef = table.find((t) => t.key === tableKey);
  if (!tableDef) return null;

  // Добавляем для select колонок опции для выбора (value + label)
  const columns = tableDef.columns.map((col) => {
    if (col.key === "Group" && extraData.groups) {
      var gr =  {
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
      if (onDataChange) {
        onDataChange(tableKey, newData);
      }
      return newData;
    });
  };

  const handleAddRow = () => {
    const maxId = tableData.reduce((max, row) => {
      const id = Number(row.ID);
      return !isNaN(id) && id > max ? id : max;
    }, 0);

    const newRow = {
      ID: maxId + 1 || 1,
      ...tableDef.defaultRow,
    };
    const newData = [...tableData, newRow];
    setTableData(newData);
    if (onDataChange) {
      onDataChange(tableKey, newData);
    }
  };

  const handleDeleteRow = (rowId) => {
    const newData = tableData.filter((row) => row.ID !== rowId);
    setTableData(newData);
    if (onDataChange) {
      onDataChange(tableKey, newData);
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
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        extraData={extraData}
      />
    </div>
  );
});

export default AssortmentTab;
