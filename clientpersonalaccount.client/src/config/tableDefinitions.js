export const tableDefinitions = (t) => [
  {
    key: "payments",
    title: t("Tabs.Payments"),
    idField: "ID",
    columns: [
      { key: "ID", label: "ID", width: "25%", filterable: true },
      { key: "Name", label: t("Name"), width: "25%", filterable: true },
      { key: "IsActive", label: t("IsActive"), type: "boolean", width: "25%", filterable: true },
      { key: "MaxPaymentAmount", label: t("MaxPaymentAmount"), type: "price", filterable: true },
    ],
  },
  {
    key: "products",
    title: t("Tabs.Products"),
    idField: "ID",
    columns: [
      { key: "ID", label: "ID", width: "5%", editable: false, filterable: true },
      { key: "Plu", label: "Plu", editable: true, type: "number", width: "10%", filterable: true },
      { key: "Code", label: t("Code"), editable: true, type: "number", width: "5%", filterable: true },
      { key: "Name", label: t("Name"), editable: true, width: "25%", filterable: true },
      { key: "Price", label: t("Price"), editable: true, type: "number", width: "15%", filterable: true },
      { key: "Barcode", label: t("Barcode"), editable: true, type: "number", width: "15%", filterable: true },
      { key: "VATCode", label: t("VATCode"), editable: true, width: "10%", filterable: true },
      {
        key: "Group",
        label: t("Group"),
        editable: true,
        type: "select",
        width: "15%",
        // options будут подставлены динамически в AssortmentTab из extraData.groups
        render: (value, row, extraData) => {
          const option = extraData.groups?.find(g => g.ID.toString() === value);
          return option ? option.Name : value;
        }, 
        filterable: true
      },
      { key: "Tme", label: "Tme", editable: true, type: "boolean", width: "15%", filterable: true }
    ],
  },
  {
    key: "groups",
    title: t("Tabs.Groups"),
    idField: "ID",
    columns: [
      { key: "ID", label: "ID", width: "50%", editable: false, filterable: true },
      { key: "Name", label: t("Name"), editable: true, filterable: true },
    ],
  },
  {
    key: "departments",
    title: t("Tabs.Departments"),
    idField: "ID",
    columns: [
      { key: "ID", label: "ID", width: "33%", editable: false, filterable: true },
      { key: "Name", label: t("Name"), editable: true, width: "33%", filterable: true },
      {
        key: "Assortment",
        label: t("Assortement"),
        editable: true,
        type: "select",
        filterable: true,
        // Опции будут подставлены динамически из extraData.products
        render: (value, row, extraData) => {
          const option = extraData.products?.find(p => p.ID === value);
          return option ? option.Name : value;
        },
      },
    ],
  },
  {
    key: "users",
    title: t("Tabs.Users"),
    idField: "ID",
    columns: [
      { key: "ID", label: "ID", width: "33%", editable: false, filterable: true },
      { key: "Name", label: t("Name"), editable: true, width: "33%", filterable: true },
      { key: "Pin", label: "PIN", editable: true, type: "number", filterable: true },
    ],
  },
];
