export const tableDefinitions = (t, data) => [
    {
        key: "payments",
        title: t("Tabs.Payments"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "25%", filterable: true, align: "left" },
            { key: "Name", label: t("Name"), width: "25%", filterable: true, align: "left" },
            { key: "IsActive", label: t("IsActive"), type: "boolean", width: "25%", editable: true, filterable: true },
            { key: "MaxPaymentAmount", label: t("MaxPaymentAmount"), type: "price", editable: true, filterable: true, align: "right" },
        ],
    },
    {
        key: "products",
        title: `${t("Tabs.Products")} (${data?.length || 0})`,
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "5%", editable: false, filterable: true, align: "left" },
            { key: "PLU", label: "Plu", editable: true, type: "number", width: "10%", filterable: true, align: "left" },
            { key: "Code", label: t("Code"), editable: true, type: "number", width: "5%", filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, width: "25%", filterable: true, align: "left" },
            { key: "Price", label: t("Price"), editable: true, type: "price", width: "15%", filterable: true, align: "right" },
            { key: "Barcode", label: t("Barcode"), editable: true, type: "number", width: "15%", filterable: true, align: "left" },
            { key: "VATCode", label: t("VATCode"), editable: true, width: "10%", filterable: true, align: "left" },
            {
                key: "Group",
                label: t("Group"),
                editable: true,
                type: "select",
                width: "15%",
                // options будут подставлены динамически в AssortmentTab из extraData.groups
                render: (value, row, extraData) => {
                    const option = extraData.groups.find(g => g.ID.toString() === value || g.ID === value);
                    return option ? option.Name : "-";
                },
                filterable: true, align: "left"
            },
            { key: "TME", label: "Tme", editable: true, type: "boolean", width: "15%", filterable: true, align: "left" }
        ],
    },
    {
        key: "groups",
        title: t("Tabs.Groups"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "50%", editable: false, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, filterable: true, align: "left" },
        ],
    },
    {
        key: "departments",
        title: t("Tabs.Departments"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "33%", editable: false, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, width: "33%", filterable: true, align: "left" },
            {
                key: "Assortment",
                label: t("Assortment"),
                editable: true,
                type: "select",
                filterable: true,
                // Опции будут подставлены динамически из extraData.products
                render: (value, row, extraData) => {
                    const option = extraData.products?.find(p => p.ID === value);
                    return option ? option.Name : value;
                }, align: "left"

            },
        ],
    },
    {
        key: "users",
        title: t("Tabs.Users"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "33%", editable: false, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, width: "33%", filterable: true, align: "left" },
            { key: "PIN", label: "PIN", editable: true, type: "number", filterable: true, align: "left" },
        ],
    },
    {
        key: "vatHistory",
        title: t("VATHistory"),
        idField: "ID",
        columns: [
            { key: "VatValue", label: t("VatValue"), width: "33%", editable: false },
            { key: "VatCode", label: t("VatCode"), width: "33%", editable: false },
            { key: "DateOfChange", label: t("DateOfChange"), width: "36%", editable: false },
        ],
    },
    {
        key: "vatRates",
        title: t("VatSetting"),
        idField: "ID",
        columns: [
            { key: "VatValue", label: t("VatValue"), width: "30%", type: "number", editable: true },
            { key: "VatCode", label: t("VatCode"), width: "30%", editable: true },
            { key: "NoVat", label: t("NotVat"), width: "30%", type: "boolean", editable: true },
        ],
    },
    {
        key: "taxiTariffs",
        title: t("TaxiTariff"),
        idField: "ID",
        columns: [
            { key: "Name", label: t("Name"), width: "20%", editable: true, align: "left" },
            { key: "Number", label: t("Number"), type: "number", width: "10%", editable: true },
            { key: "PricePerHour", label: t("PricePerHour"), type: "number", width: "12%", editable: true },
            { key: "PricePerKm", label: t("PricePerKm"), type: "number", width: "12%", editable: true },
            { key: "PriceStart", label: t("PriceStart"), type: "number", width: "12%", editable: true },
            { key: "VatCode", label: t("VatCode"), width: "8%", editable: true },
            { key: "StartOfPeriod", label: t("StartOfPeriod"), width: "12%", editable: true },
            { key: "EndOfPeriod", label: t("EndOfPeriod"), width: "12%", editable: true },
        ],
    }
];
