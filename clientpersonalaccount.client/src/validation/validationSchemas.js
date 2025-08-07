import * as yup from "yup";

export const commonValidation = {
    username: yup.string().required("Имя пользователя обязательно"),
    password: yup
        .string()
        .min(6, "Минимум 6 символов")
        .required("Пароль обязателен"),
};

export const loginSchema = yup.object({
    ...commonValidation,
});

export const registerSchema = yup.object({
    ...commonValidation,
    email: yup.string().email("Неверный email").required("Email обязателен"),
});

export function validateProducts(data, tableKey, usersPin, pins) {
    const errors = {};

    data.forEach((item, idx) => {
        const rowErrors = {};
        if (!item.Name || item.Name.trim() === "" || item.Name === "undefined") {
            rowErrors.Name = "Наименование обязательно";
        }

        if (tableKey == "users") {
            const seenPins = new Set(pins);
            const usersPinList = new Set(usersPin);

            const pin = item.Pin?.toString();

            // Проверка обязательного заполнения PIN
            if (!pin || pin.trim() === "" || pin === "undefined") {
                rowErrors.PIN = "PIN обязателен";
            } else {
                // Если PIN заполнен, проверяем формат: только 5 цифр
                if (!/^\d{5}$/.test(pin)) {
                    rowErrors.PIN = "PIN должен содержать ровно 5 цифр";
                }
                // Проверка на дублирование с уже существующими PIN (из usersPin)
                if (usersPinList.has(pin)) {
                    rowErrors.PIN = "Этот PIN уже используется";
                }
                // Проверка на дублирование в текущем массиве
                if (seenPins.has(pin)) {
                    rowErrors.PIN = "Дублирующийся PIN в таблице";
                } else {
                    seenPins.add(pin);
                }
            }
        }

        if (tableKey == "products") {
            const pluSet = new Set();
            const codeSet = new Set();
            const barcodeSet = new Set();

            if (data.length > 1000) {
                errors.general = ["Максимальное количество строк — 1000"];
            }

            if ((!item.PLU || item.PLU.trim() === "")) {
                rowErrors.PLU = "PLU обязательно";
            } else if (pluSet.has(item.PLU)) {
                rowErrors.PLU = "Дублирование PLU";
            } else {
                pluSet.add(item.PLU);
            }

            if ((!item.Code || item.Code.trim() === "")) {
                rowErrors.Code = "Code обязательно";
            } else if (codeSet.has(item.Code)) {
                rowErrors.Code = "Дублирование Code";
            } else {
                codeSet.add(item.Code);
            }

            if ((item.Price === undefined || item.Price === null || isNaN(item.Price) || Number(item.Price) <= 0)) {
                rowErrors.Price = "Цена должна быть больше 0";
            }

            if ((!item.Barcode || item.Barcode.trim() === "")) {
                rowErrors.Barcode = "Barcode обязательно";
            } else if (barcodeSet.has(item.Barcode)) {
                rowErrors.Barcode = "Дублирование Barcode";
            } else {
                barcodeSet.add(item.Barcode);
            }

            if ((!item.VATCode || item.VATCode.trim() === "")) {
                rowErrors.VATCode = "VATCode обязательно";
            }
        }

        if (Object.keys(rowErrors).length > 0)
            errors[item.ID || idx] = rowErrors;
    })

    return errors;
}

export const validateDevice = (data, tableKey, prevData) => {
    const errors = {};

    if (tableKey === "vatRates") {
        data.forEach((item, idx) => {
            const rowErrors = {};
            const id = item.ID || idx;

            const vatCode = item.VatCode?.trim() ?? "";
            const vatValue = parseFloat(item.VatValue ?? "0");
            const notVat = !!item.NotVat;

            // === Валидация VatCode ===
            if (notVat) {
                if (vatCode !== "" && vatCode !== "-" && vatCode !== "_") {
                    rowErrors.VatCode = "Для неплательщика НДС код должен быть '_'";
                }
            } else {
                if (!/^[A-Z]$/.test(vatCode)) {
                    rowErrors.VatCode = "Код должен быть одной заглавной латинской буквой (A-Z)";
                } else {
                    // Проверка уникальности среди всех кроме текущей строки
                    const isDuplicate = prevData
                        .filter(p => p.ID !== item.ID) // исключаем текущую строку
                        .some(p => (p.VatCode?.trim() ?? "") === vatCode);

                    if (isDuplicate) {
                        rowErrors.VatCode = "Код НДС должен быть уникальным";
                    }
                }

                if (vatCode.includes("_")) {
                    rowErrors.VatCode = "Код не должен содержать нижнее подчеркивание";
                }
            }

            // === Валидация VatValue ===
            if (notVat) {
                if (vatValue !== 0) {
                    rowErrors.VatValue = "Значение должно быть 0.00 при включенном NotVat";
                }
            } else {
                if (isNaN(vatValue) || vatValue < 0 || vatValue > 99) {
                    rowErrors.VatValue = "Значение должно быть от 0.00 до 99.00";
                } else if (!/^\d{1,2}(\.\d{1,2})?$/.test(String(item.VatValue))) {
                    rowErrors.VatValue = "Введите значение с двумя знаками после запятой";
                }
            }

            if (Object.keys(rowErrors).length > 0) {
                errors[id] = rowErrors;
            }
        });
    }

    return errors;
};
