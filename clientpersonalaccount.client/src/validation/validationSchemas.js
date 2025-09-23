import * as yup from "yup";

export const commonValidation = (t) => ({
    username: yup.string().required(t("validation.usernameRequired")),
    password: yup
        .string()
        .min(6, t("validation.passwordMin"))
        .required(t("validation.passwordRequired")),
});

export const loginSchema = (t) => yup.object({ ...commonValidation(t) });

export const registerSchema = (t) => yup.object({
    ...commonValidation(t),
    email: yup.string().email(t("validation.invalidEmail")).required(t("validation.emailRequired")),
});

export const validateProducts = (item, tableKey, usersPin, pins, t, data) => {
    if (tableKey === "products" && data.length > 1000) {
        return { general: [t("validation.maxRows", { count: 1000 })] };
    }

    const errors = {};
    const pluSet = new Set();
    const codeSet = new Set();
    const barcodeSet = new Set();
    const seenPins = new Set(pins);
    const usersPinList = new Set(usersPin);

    const rowErrors = {};
    const id = item.ID || idx;

    if (!item.Name || item.Name.trim() === "" || item.Name === "undefined") {
        rowErrors.Name = t("validation.nameRequired");
    }

    if (tableKey === "users") {
        const pin = item.PIN?.toString();
        if (!pin || pin.trim() === "" || pin === "undefined") {
            rowErrors.PIN = t("validation.pinRequired");
        } else {
            if (!/^\d{5}$/.test(pin)) rowErrors.PIN = t("validation.pinFiveDigits");
            if (usersPinList.has(pin)) rowErrors.PIN = t("validation.pinUsed");
            if (seenPins.has(pin)) rowErrors.PIN = t("validation.pinDuplicate");
            else seenPins.add(pin);
        }
    }

    if (tableKey === "products") {
        const pluCount = data.filter(x => x.PLU === item.PLU).length;
        if (!item.PLU || item.PLU.trim() === "") rowErrors.PLU = t("validation.pluRequired");
        else if (pluCount > 1) rowErrors.PLU = t("validation.pluDuplicate");

        const codeCount = data.filter(x => x.Code === item.Code).length;
        if (!item.Code || item.Code.trim() === "") rowErrors.Code = t("validation.codeRequired");
        else if (codeCount > 1) rowErrors.Code = t("validation.codeDuplicate");

        const normalizedPrice = Number(item.Price?.toString().replace(",", "."));
        if (!normalizedPrice || normalizedPrice <= 0) rowErrors.Price = t("validation.pricePositive");

        const barcodeCount = data.filter(x => x.Barcode === item.Barcode).length;
        if (!item.Barcode || item.Barcode.trim() === "") rowErrors.Barcode = t("validation.barcodeRequired");
        else if (barcodeCount > 1) rowErrors.Barcode = t("validation.barcodeDuplicate");

        if (!item.VATCode || item.VATCode.trim() === "") {
            rowErrors.VATCode = t("validation.vatRequired");
        } else if (!/^[A-Z_]+$/.test(item.VATCode)) {
            rowErrors.VATCode = t("validation.vatCodeLetter"); // ��������, "������ A-Z ��� _"
        }
    }

    if (tableKey === "payments") {
        const amount = item.MaxPaymentAmount?.toString() || "";
        if (!/^\d+$/.test(amount)) {
            rowErrors.MaxPaymentAmount = t("validation.onlyNumbers");
        } else if (amount.length > 20) { // ����������� �� �����
            rowErrors.MaxPaymentAmount = t("validation.maxLength", { count: 20 });
        }
    }

    if (Object.keys(rowErrors).length > 0) {
        errors[id] = rowErrors;
    }

    return errors;
};

export const validateDevice = (data, tableKey, t) => {
    const errors = {};

    if (tableKey === "vatRates") {
        data.forEach((item, idx) => {
            const rowErrors = {};
            const id = item.ID || idx;

            const vatCode = item.VatCode?.trim() ?? "";
            const vatValue = parseFloat(item.VatValue ?? "0");
            const notVat = !!item.NoVat;

            if (notVat) {
                if (vatCode !== "" && vatCode !== "-" && vatCode !== "_") {
                    rowErrors.VatCode = t("validation.notVatCodeUnderscore");
                }
            } else {
                if (!/^[A-Z]$/.test(vatCode)) rowErrors.VatCode = t("validation.vatCodeLetter");
                const isDuplicate = data.filter(p => p.ID !== item.ID)
                    .some(p => (p.VatCode?.trim() ?? "") === vatCode);
                if (isDuplicate) rowErrors.VatCode = t("validation.vatCodeUnique");
                if (vatCode.includes("_")) rowErrors.VatCode = t("validation.vatCodeNoUnderscore");
            }

            if (notVat) {
                if (vatValue !== 0) rowErrors.VatValue = t("validation.vatValueZero");
            } else {
                if (isNaN(vatValue) || vatValue < 0 || vatValue > 99) rowErrors.VatValue = t("validation.vatValueRange");
                else if (!/^\d{1,2}(\.\d{1,2})?$/.test(String(item.VatValue))) rowErrors.VatValue = t("validation.vatValueTwoDecimals");
            }

            if (Object.keys(rowErrors).length > 0) errors[id] = rowErrors;
        });
    }

    if (tableKey === "taxiTariffs") {
        data.forEach((item, idx) => {
            const rowErrors = {};
            const id = item.ID || idx;

            if (!item.Name || item.Name.trim() === "")
                rowErrors.Name = t("validation.nameRequired");

            if (!item.VatCode || item.VatCode.trim() === "") {
                rowErrors.VATCode = t("validation.vatRequired");
            } else if (!/^[A-Z_]+$/.test(item.VatCode)) {
                rowErrors.VATCode = t("validation.vatCodeLetter"); // ��������, "������ A-Z ��� _"
            }

            if (Object.keys(rowErrors).length > 0) errors[id] = rowErrors;
        });
    }

    return errors;
};
