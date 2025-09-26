export const tableDefinitions = (t, data, visibleCount) => [
    {
        key: "payments",
        title: t("Tabs.Payments"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "8%", filterable: true, align: "left" },
            { key: "Name", label: t("Name"), filterable: true, align: "left" },
            { key: "IsActive", label: t("IsActive"), type: "boolean", editable: true, filterable: true },
            { key: "MaxPaymentAmount", label: t("MaxPaymentAmount"), type: "price", editable: true, filterable: true, align: "right" },
        ],
    },
    {
        key: "products",
        title: `${t("Tabs.Products")} (${visibleCount ?? (data?.length || 0)})`,
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "8%", editable: false, filterable: true, align: "left" },
            { key: "PLU", label: "PLU", editable: true, filterable: true, align: "left" },
            { key: "Code", label: t("Code"), editable: true, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, filterable: true, align: "left" },
            { key: "Price", label: t("Price"), editable: true, type: "price", filterable: true, align: "right" },
            { key: "Barcode", label: t("Barcode"), editable: true, filterable: true, align: "left" },
            { key: "VATCode", label: t("VATCode"), editable: true, filterable: true, align: "left" },
            {
                key: "Group",
                label: t("Group"),
                editable: true,
                type: "select",
                render: (value, row, extraData) => {
                    const option = extraData.groups.find(g => g.ID.toString() === value || g.ID === value);
                    return option ? option.Name : "-";
                },
                filterable: true, width: "15%", align: "left"
            },
            { key: "TME", label: "TME", editable: true, type: "boolean", filterable: true, align: "left" }
        ],
    },
    {
        key: "groups",
        title: t("Tabs.Groups"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "8%", editable: false, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, filterable: true, align: "left" },
        ],
    },
    {
        key: "departments",
        title: t("Tabs.Departments"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "8%", editable: false, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, filterable: true, align: "left" },
            {
                key: "Assortment",
                label: t("Assortment"),
                editable: true,
                type: "select",
                width: 160,
                filterable: true,
                // Опции будут подставлены динамически из extraData.products
                render: (value, row, extraData) => {

                    const option = extraData.products?.find(p => p.ID === value);
                    return option ? option.Name : value;
                }, align: "left",
                options: (row, extraData) => {
                    // Все ассортименты, которые уже назначены другим департаментам
                    const usedAssortments = extraData.departments
                        .filter(d => d.ID !== row.ID && d.Assortment)
                        .map(d => d.Assortment);

                    // Возвращаем только те, которые не используются
                    return extraData.products?.filter(p => !usedAssortments.includes(p.ID)).map((p) => ({ value: p.ID, label: p.Name }));
                },

            },
        ],
    },
    {
        key: "users",
        title: t("Tabs.Users"),
        idField: "ID",
        columns: [
            { key: "ID", label: "ID", width: "8%", editable: false, filterable: true, align: "left" },
            { key: "Name", label: t("Name"), editable: true, filterable: true, align: "left" },
            { key: "PIN", label: "PIN", editable: true, type: "number", filterable: true, align: "left", width: 80, maxLength: 5 },
        ],
    },
    {
        key: "vatHistory",
        title: t("VATHistory"),
        idField: "ID",
        columns: [
            { key: "VatValue", label: t("VatValue"), editable: false },
            { key: "VatCode", label: t("VATCode"), editable: false },
            { key: "DateOfChange", label: t("DateOfChange"), editable: false },
        ],
    },
    {
        key: "vatRates",
        title: t("VatSetting"),
        idField: "ID",
        columns: [

            { key: "VatCode", label: t("VATCode"), editable: true },
            { key: "VatValue", label: t("VatValue"), type: "number", editable: true },
            { key: "NoVat", label: t("NotVat"), type: "boolean", editable: true },
        ],
    },
    {
        key: "taxiTariffs",
        title: t("TaxiTariff"),
        idField: "ID",
        columns: [
            { key: "Name", label: t("Name"), editable: true, align: "left" },
            { key: "Number", label: t("Number"), type: "number", editable: true },
            { key: "PricePerHour", label: t("PricePerHour"), type: "number", editable: true },
            { key: "PricePerKm", label: t("PricePerKm"), type: "number", editable: true },
            { key: "PriceStart", label: t("PriceStart"), type: "number", editable: true },
            { key: "VatCode", label: t("VATCode"), editable: true },
            { key: "StartOfPeriod", label: t("StartOfPeriod"), editable: true },
            { key: "EndOfPeriod", label: t("EndOfPeriod"), editable: true },
        ],
    }
];
