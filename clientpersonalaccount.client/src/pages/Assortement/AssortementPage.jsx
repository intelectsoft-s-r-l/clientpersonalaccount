import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import AssortmentTab from "../../components/AssortmentTab";
import GlobalSettingsForm from "../../components/GlobalSettingsForm";
import { assortmentConfigs } from "../../config/assortmentConfigs";
import { useAuth } from "../../context/AuthContext";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { validateProducts } from "../../validation/validationSchemas";
import ValidationModal from "../../components/ValidationModal";
import SuccessModal from "../../components/SuccessModal";
import Toast from "../../components/Toast";
import { FaBoxOpen, FaMoneyBillWave, FaUsers, FaLayerGroup, FaBuilding, FaGlobe } from "react-icons/fa";

function Tooltip({ targetRef, children, offset = 8, onMouseEnter, onMouseLeave }) {
    const [position, setPosition] = useState({ top: 0, left: 0, visibility: "hidden" });
    const tooltipRef = useRef(null);

    const updatePosition = () => {
        if (!targetRef.current || !tooltipRef.current) return;

        const rect = targetRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + offset;

        // Не выходит за правый край
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        // Не выходит за левый край
        if (left < 0) left = 8;

        // Если не помещается снизу, показываем сверху
        if (top + tooltipRect.height > window.scrollY + window.innerHeight) {
            top = rect.top + window.scrollY - tooltipRect.height - offset;
        }

        setPosition({ top, left, visibility: "visible" });
    };

    useEffect(() => {
        updatePosition();
    }, []);

    useEffect(() => {
        if (!targetRef.current || !tooltipRef.current) return;

        const handleResize = () => updatePosition();
        window.addEventListener("resize", handleResize);

        // сразу обновляем позицию при появлении
        updatePosition();

        return () => window.removeEventListener("resize", handleResize);
    }, [targetRef.current]);

    return createPortal(
        <div
            ref={tooltipRef}
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                visibility: position.visibility,
                zIndex: 1000,
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="absolute z-50 bg-white border border-gray-200 shadow-lg rounded-2xl p-2 text-sm"
        >
            {children}
        </div>,
        document.body
    );
}

export default function AssortmentPage() {
    const [tabs, setTabs] = useState(assortmentConfigs);
    const [activeId, setActiveId] = useState(tabs[0]?.id || 1);
    const [activeTable, setActiveTable] = useState("products");
    const [dataBySetting, setDataBySetting] = useState({});
    const { getTokenFromServer } = useAuth();
    const [token, setToken] = useState(null);
    const { t } = useTranslation();
    const [usersPin, setUsersPin] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrors, setShowErrors] = useState(false);
    const tabsRefs = useRef({});
    const globalSettingsRef = useRef(null);
    const [pinData, setPinData] = useState([]);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(null);
    const [isWarningModalVisible, setIsWarningModalVisible] = useState(false);
    const [showWarningMessage, setShowWarningMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const iconRef = useRef(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const [isHoverTooltip, setIsHoverTooltip] = useState(false);
    const hideTimeout = useRef(null);

    const handleIconEnter = () => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
        }
        setShowTooltip(true);
    };

    const handleIconLeave = () => {
        hideTimeout.current = setTimeout(() => setShowTooltip(false), 200);
    };

    const handleTooltipEnter = () => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
        }
        setShowTooltip(true);
    };

    const handleTooltipLeave = () => {
        hideTimeout.current = setTimeout(() => setShowTooltip(false), 200);
    };

    useEffect(() => {
        const fetchToken = async () => {
            const result = await getTokenFromServer();
            setToken(result);
        };

        fetchToken();
    }, [token]);

    const defaultEmptySetting = {
        PaymentTypes: [
            { ID: 1, Name: "NUMERAR", MaxPaymentAmount: 100000, IsActive: true },
            { ID: 2, Name: "CARD", MaxPaymentAmount: 2000000, IsActive: true },
            { ID: 5, Name: "TME", MaxPaymentAmount: 0, IsActive: false },
            { ID: 6, Name: "ABONAMENT", MaxPaymentAmount: 0, IsActive: false },
            { ID: 7, Name: "ALT_IP", MaxPaymentAmount: 0, IsActive: false },
            { ID: 9, Name: "MIA", MaxPaymentAmount: 0, IsActive: false },
            { ID: 31, Name: "VAUCHER", MaxPaymentAmount: 0, IsActive: false },
            { ID: 32, Name: "CEC_CERTIFICAT_VALORIC", MaxPaymentAmount: 0, IsActive: false },
            { ID: 33, Name: "TICHET", MaxPaymentAmount: 0, IsActive: false },
            { ID: 34, Name: "RETURNARE_MIZE", MaxPaymentAmount: 0, IsActive: false },
            { ID: 35, Name: "IMPOZIT", MaxPaymentAmount: 0, IsActive: false },
            { ID: 36, Name: "CÂȘTIG", MaxPaymentAmount: 0, IsActive: false },
            { ID: 81, Name: "CREDIT", MaxPaymentAmount: 0, IsActive: false },
            { ID: 82, Name: "LEASING", MaxPaymentAmount: 0, IsActive: false },
            { ID: 83, Name: "AVANS", MaxPaymentAmount: 0, IsActive: false },
            { ID: 84, Name: "ARVUNA", MaxPaymentAmount: 0, IsActive: false },
            { ID: 85, Name: "GAJ", MaxPaymentAmount: 0, IsActive: false },
            { ID: 86, Name: "CARD_VALORIC_CORPORATIV", MaxPaymentAmount: 0, IsActive: false },
            { ID: 87, Name: "TESTARE_METROLOGICA", MaxPaymentAmount: 0, IsActive: false },
            { ID: 88, Name: "ALT_MOD", MaxPaymentAmount: 0, IsActive: false }
        ],
        Assortments: [],
        Groups: [],
        Departments: [
            { ID: 1, Name: "Department1", Assortment: null },
            { ID: 2, Name: "Department2", Assortment: null },
            { ID: 3, Name: "Department3", Assortment: null },
            { ID: 4, Name: "Department4", Assortment: null },
            { ID: 5, Name: "Department5", Assortment: null },
            { ID: 6, Name: "Department6", Assortment: null },
            { ID: 7, Name: "Department7", Assortment: null },
            { ID: 8, Name: "Department8", Assortment: null },
            { ID: 9, Name: "Department9", Assortment: null },
            { ID: 10, Name: "Department10", Assortment: null },
            { ID: 11, Name: "Department11", Assortment: null },
            { ID: 12, Name: "Department12", Assortment: null },
            { ID: 13, Name: "Department13", Assortment: null },
            { ID: 14, Name: "Department14", Assortment: null },
            { ID: 15, Name: "Department15", Assortment: null },
            { ID: 16, Name: "Department16", Assortment: null },
            { ID: 17, Name: "Department17", Assortment: null },
            { ID: 18, Name: "Department18", Assortment: null },
            { ID: 19, Name: "Department19", Assortment: null },
            { ID: 20, Name: "Department20", Assortment: null },
            { ID: 21, Name: "Department21", Assortment: null },
            { ID: 22, Name: "Department22", Assortment: null },
            { ID: 23, Name: "Department23", Assortment: null },
            { ID: 24, Name: "Department24", Assortment: null },
            { ID: 25, Name: "Department25", Assortment: null },
            { ID: 26, Name: "Department26", Assortment: null },
            { ID: 27, Name: "Department27", Assortment: null },
            { ID: 28, Name: "Department28", Assortment: null },
            { ID: 29, Name: "Department29", Assortment: null },
            { ID: 30, Name: "Department30", Assortment: null },
        ],
        Users: [],
        GlobalSettings: {}
    };

    useEffect(() => {
        async function fetchAndDecode() {
            try {
                setLoading(true);

                const rawData = await apiService.proxyRequest(`/MobileCashRegister/web/GetSettings`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16",
                    },
                })

                const decodedSettings = {};
                const tabsList = [];

                const forceBase64 = (str) => {
                    try {
                        // Пробуем сразу распарсить
                        JSON.parse(str);
                        // Если получилось — значит не base64, нужно кодировать
                        return btoa(encodeURIComponent(str));
                    } catch {
                        // Иначе — вероятно, уже base64
                        return str;
                    }
                };

                ["settings1", "settings2", "settings3"].forEach((key, idx) => {
                    let parsed = defaultEmptySetting;

                    if (rawData[key]) {
                        try {
                            const base64Str = forceBase64(rawData[key]);

                            // Декодируем UTF-8 корректно
                            const binaryStr = atob(base64Str);
                            const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
                            const jsonStr = new TextDecoder("utf-8").decode(bytes);

                            try {
                                parsed = JSON.parse(jsonStr);
                            } catch {
                                try {
                                    parsed = JSON.parse(decodeURIComponent(jsonStr));
                                } catch (e) {
                                    console.error("Не удалось распарсить JSON:", e);
                                }
                            }
                        } catch (e) {
                            console.error(`Ошибка декодирования ${key}`, e);
                        }
                    }

                    ["PaymentTypes", "Assortments", "Groups", "Departments", "Users"].forEach((field) => {
                        if (parsed[field] && Array.isArray(parsed[field])) {
                            parsed[field] = parsed[field].map(item => ({
                                ...item,
                                ID: item.ID !== undefined ? item.ID : Date.now() + Math.random()
                            }));
                        }
                    });

                    decodedSettings[key] = parsed;

                    tabsList.push({
                        id: key,
                        nameKey: "SettingNumber",
                        number: idx + 1
                    });
                });

                setTabs(tabsList);
                setDataBySetting(decodedSettings);

                if (tabsList.length > 0) {
                    setActiveId(tabsList[0].id);
                }
            } catch (err) {
                console.error("Ошибка при получении настроек:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAndDecode();
    }, [token]);

    useEffect(() => {
        async function fetchLicensesUsersPin() {
            const data = await apiService.proxyRequest(`/MobileCashRegister/web/GetDevices?Token=${token}`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                }
            })

            const usersPin = (data?.cashRegisters || [])
                .filter(device => device.users && device.users != "W10=" && device.users != "1")
                .flatMap(device => {
                    try {
                        const jsonStr = atob(atob(device.users));
                        const usersArray = JSON.parse(jsonStr);

                        return Array.isArray(usersArray)
                            ? usersArray.map(u => u.PIN)
                            : [];
                    } catch (error) {
                        console.error("Ошибка при декодировании пользователей:", error);
                        return [];
                    }
                });

            setUsersPin(usersPin);
        }

        if (activeTable === "users")
            fetchLicensesUsersPin();
    }, [activeTable]);

    // Функция сохранения на сервер настроек для текущей вкладки
    const saveSettingsForActiveId = useCallback(
        async (settingId, settingData) => {
            if (!token) {
                console.warn("Токен не получен, сохранение невозможно");
                return;
            }

            try {
                const jsonStr = JSON.stringify(settingData);
                const encodedSettings = utf8ToBase64(jsonStr);
                const typeMap = {
                    settings1: 1,
                    settings2: 2,
                    settings3: 3,
                };
                const type = typeMap[settingId] || 0;

                const payload = {
                    token: token,
                    settings: encodedSettings,
                    type: type,
                };

                const resp = await apiService.proxyRequest(`/MobileCashRegister/web/UpsertSettings`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16",
                    },
                    body: JSON.stringify(payload),
                })

                if (resp.errorCode != 0) {
                    console.error("Ошибка сохранения:", resp.errorMessage);
                    throw new Error(`Ошибка ${resp.errorCode}`);
                }
            } catch (err) {
                console.error("Ошибка при сохранении:", err);
            }
        },
        [token]
    );

    // Дебаунс для сохранения, чтобы не посылать слишком часто запросы
    const debouncedSave = useRef(
        debounce((settingId, settingData, saveFn) => {
            saveFn(settingId, settingData);
        }, 1000)
    ).current;

    function mapTableKeyToSettingsField(tableKey) {
        switch (tableKey) {
            case "payments":
                return "PaymentTypes";
            case "products":
                return "Assortments";
            case "groups":
                return "Groups";
            case "departments":
                return "Departments";
            case "users":
                return "Users";
            case "global":
                return "GlobalSettings";
            default:
                return null;
        }
    }

    function utf8ToBase64(str) {
        const utf8Bytes = new TextEncoder().encode(str);
        let binary = '';
        const chunkSize = 0x8000; // 32k
        for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
            const chunk = utf8Bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
        }
        return btoa(binary);
    }

    const handleSaveAll = async () => {
        if (!activeId) return;

        const currentSetting = dataBySetting[activeId] || {};

        const assortments = currentSetting.Assortments.map(item => ({
            ...item,
            TME: !!item.TME,
        }));

        const cleanAssortments = assortments.map(item => {
            const cleaned = { ...item };
            // Удаляем служебные поля
            delete cleaned.isEdited;
            delete cleaned.isNew;
            return cleaned;
        });
        console.log(cleanAssortments);
        const Settings = {
            PaymentTypes: currentSetting.PaymentTypes || [],
            Assortments: cleanAssortments || [],
            Groups: currentSetting.Groups || [],
            Departments: currentSetting.Departments || [],
            Users: currentSetting.Users || [],
            GlobalSettings: currentSetting.GlobalSettings || {},
        };

        // прогоняем валидацию
        let validationErrors = {};
        const validateAll = (rows, key) => {
            if (activeTable == "users" && currentSetting && currentSetting.Users) {
                let userPins = [];
                currentSetting.Users.forEach(u => userPins.push(u.Pin));
                setPinData(userPins);
            }

            rows.forEach(row => {
                let errors = {};
                if (key === "users")
                    errors = validateProducts(row, key, usersPin, pinData, t, rows);
                else
                    errors = validateProducts(row, key, null, null, t, rows);

                if (Object.keys(errors).length > 0) {
                    // если есть general — то сохраняем только general
                    if (errors.general) {
                        validationErrors = { general: errors.general };
                    } else {
                        validationErrors[row.ID] = errors;
                    }
                }
            });
        };

        validateAll(currentSetting.Users || [], "users");
        validateAll(currentSetting.Assortments || [], "products");

        if (Object.keys(validationErrors).length > 0) {
            setValidationErrors(validationErrors);
            setShowErrors(true);
            return;
        }

        const typeMap = {
            settings1: 1,
            settings2: 2,
            settings3: 3,
        };

        const type = typeMap[activeId] || 0;

        try {
            const jsonStr = JSON.stringify(Settings);
            const encodedSettings = utf8ToBase64(jsonStr);

            const payload = {
                token: token,
                settings: encodedSettings,
                type: type,
            };
            const resp = await apiService.proxyRequest(`/MobileCashRegister/web/UpsertSettings`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                },
                body: payload,
            })

            if (resp.errorCode != 0) {
                console.error("Ошибка сохранения:", resp.errorMessage);
                throw new Error(`Ошибка ${resp.errorCode}`);
            }
            else {
                setShowSuccessMessage(t("SaveAllSettings"));
                setIsSuccessModalVisible(true);
            }
        } catch (err) {
            throw new Error(`Ошибка ${err.message}`);
        }
    };

    // Функция для экспорта товаров (только для таблицы products)
    const handleExport = () => {
        if (activeTable !== "products") {
            return;
        }

        const currentSetting = dataBySetting[activeId] || {};
        const products = currentSetting.Assortments || [];

        if (!products || products.length === 0) {
            return;
        }

        let validationErrors = {};
        const validateAll = (rows, key) => {

            rows.forEach(row => {
                let errors = validateProducts(row, key, null, null, t, rows);

                if (Object.keys(errors).length > 0) {
                    // если есть general — то сохраняем только general
                    if (errors.general) {
                        validationErrors = { general: errors.general };
                    } else {
                        validationErrors[row.ID] = errors;
                    }
                }
            });
        };

        validateAll(currentSetting.Assortments || [], "products");

        if (Object.keys(validationErrors).length > 0) {
            setValidationErrors(validationErrors);
            setShowErrors(true);
            return;
        }

        // Убираем поля, которые не нужны в экспорте
        const cleanData = products.map(item => {
            const cleaned = { ...item };

            if (cleaned.ID !== undefined) cleaned.ID = String(cleaned.ID);

            // Приводим булевые поля к "Истина"/"Ложь"
            cleaned.TME = cleaned.TME ? "Истина" : "Ложь";
            cleaned.OnlinePay = cleaned.OnlinePay ? "Истина" : "Ложь";

            if (cleaned.Group !== "") {
                const groupId = Number(cleaned.Group);
                const group = currentSetting.Groups?.find(g => g.ID === groupId || g.ID === cleaned.Group);
                cleaned.Group = group ? group.Name : "";
            }

            // Удаляем служебные поля
            delete cleaned.id;
            delete cleaned.ProviderID;
            delete cleaned.ProviderName;
            delete cleaned.Provide;
            delete cleaned.FormData;
            delete cleaned.isEdited;
            delete cleaned.isNew;
            return cleaned;
        });

        try {
            const worksheet = XLSX.utils.json_to_sheet(cleanData);

            // Настройка ширины колонок (опционально)
            const columnWidths = Object.keys(cleanData[0] || {}).map(() => ({ wch: 15 }));
            worksheet['!cols'] = columnWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Товары");

            // Создаем файл в формате Excel 2007+ (.xlsx)
            const excelBuffer = XLSX.write(workbook, {
                bookType: "xlsx",
                type: "array",
                bookSST: false
            });

            const data = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
            saveAs(data, fileName);
        } catch (error) {
            console.error("Ошибка при экспорте:", error);
        }
    };



    // Функция для импорта товаров (только для таблицы products)
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (activeTable !== "products") {
            e.target.value = '';
            return;
        }

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, {
                    type: "binary",
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    defval: "",
                    raw: false,
                    dateNF: 'yyyy-mm-dd'
                });

                if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
                    return;
                }

                // Мап заголовков: ключи Excel → твои ключи
                const headerMap = {
                    "ID": "ID",
                    "id": "ID",
                    "PLU": "PLU",
                    "Артикул": "PLU",
                    "Code": "Code",
                    "Код": "Code",
                    "Name": "Name",
                    "Название": "Name",
                    "Наименование": "Name",
                    "Price": "Price",
                    "Цена": "Price",
                    "Barcode": "Barcode",
                    "Штрихкод": "Barcode",
                    "Штрих-код": "Barcode",
                    "VATCode": "VATCode",
                    "Код НДС": "VATCode",
                    "Группа": "Group",
                    "Group": "Group",
                    "TME": "TME",
                    "Tme": "TME"
                };

                let errors = {};

                let validationErrors = {};
                const validateAll = (rows, key) => {
                    if (activeTable == "users" && currentSetting && currentSetting.users) {
                        let userPins = [];
                        currentSetting.users.forEach(u => userPins.push(u.Pin));
                        setPinData(userPins);
                    }

                    rows.forEach(row => {
                        let errors = {};
                        if (key === "users")
                            errors = validateProducts(row, key, usersPin, pinData, t, rows);
                        else
                            errors = validateProducts(row, key, null, null, t, rows);

                        if (Object.keys(errors).length > 0) {
                            // если есть general — то сохраняем только general
                            if (errors.general) {
                                validationErrors = { general: errors.general };
                            } else {
                                validationErrors[row.ID] = errors;
                            }
                        }
                    });
                };

                const processedData = jsonData.map(item => {
                    const newItem = {};
                    const booleanFields = ["TME", "Tme"];
                    for (let key in item) {
                        if (headerMap[key]) {
                            if (booleanFields.includes(key)) {
                                const val = item[key];
                                newItem[headerMap[key]] =
                                    val === 1 || val === "1" ||
                                    val === true || val === "true";
                            } else {
                                newItem[headerMap[key]] = item[key];
                            }
                        }
                    }

                    return newItem;
                });

                let maxId = 0;
                const newGroups = [];

                validateAll(processedData || [], "products");

                if (Object.keys(validationErrors).length > 0) {
                    setValidationErrors(validationErrors);
                    setShowErrors(true);
                    return;
                }

                processedData.forEach(item => {
                    if (item.Group) {
                        // ищем, есть ли такая группа уже в newGroups
                        let group = newGroups.find(
                            g => g.Name.toString().trim().toLowerCase() === item.Group.toString().trim().toLowerCase()
                        );

                        if (!group) {
                            // создаем новую группу
                            maxId += 1;
                            group = { ID: maxId, Name: item.Group };
                            newGroups.push(group);
                        }

                        // проставляем в ассортмент ID группы
                        item.Group = group.ID;
                    }
                });
                // Обновляем данные ассортимента
                setDataBySetting(prev => {
                    const currentSetting = prev[activeId] || {};

                    const updatedSetting = {
                        ...currentSetting,
                        Assortments: processedData,
                        Groups: newGroups,
                    };

                    const newDataBySetting = {
                        ...prev,
                        [activeId]: updatedSetting,
                    };

                    debouncedSave(activeId, updatedSetting, saveSettingsForActiveId);

                    return newDataBySetting;
                });

            } catch (error) {
                console.error("Ошибка при импорте:", error);
            }
        };

        reader.onerror = () => {
            console.error("Ошибка при чтении файла");
        };

        reader.readAsBinaryString(file);
        e.target.value = '';
    };


    const settingsField = mapTableKeyToSettingsField(activeTable);
    const currentSetting = dataBySetting[activeId] || {};
    const currentTableData = currentSetting[settingsField] || [];
    const currentGlobalSettings = currentSetting.GlobalSettings || {};
    const products = (currentSetting.Assortments || []).slice().sort((a, b) => a.ID - b.ID);
    const groups = currentSetting.Groups || [];
    const users = currentSetting.Users || [];
    const payments = currentSetting.PaymentTypes || [];
    const departments = currentSetting.Departments || [];

    const joinConfigs = {
        // Здесь можете добавить конфигурации для объединения данных, если нужно
    };

    const config = joinConfigs[activeTable];
    const transformedData = config
        ? currentTableData.map((row) => ({
            ...row,
            [config.fieldName]:
                config.getValue(
                    config.sourceData.find(
                        (x) => x[config.sourceKey] === row[config.targetKey]
                    )
                ) || "-",
        }))
        : currentTableData;

    const handleDownloadTemplate = () => {
        const link = document.createElement("a");
        link.href = "/templates/AssortmentTemplate.xlsx";
        link.download = "AssortmentTemplate.xlsx";
        link.click();
    };

    const handleResetPayments = () => {
        const defaultPayments = [
            { ID: 1, Name: "NUMERAR", MaxPaymentAmount: 100000, IsActive: true },
            { ID: 2, Name: "CARD", MaxPaymentAmount: 2000000, IsActive: true },
            { ID: 5, Name: "TME", MaxPaymentAmount: 0, IsActive: false },
            { ID: 6, Name: "ABONAMENT", MaxPaymentAmount: 0, IsActive: false },
            { ID: 7, Name: "ALT_IP", MaxPaymentAmount: 0, IsActive: false },
            { ID: 9, Name: "MIA", MaxPaymentAmount: 0, IsActive: false },
            { ID: 31, Name: "VAUCHER", MaxPaymentAmount: 0, IsActive: false },
            { ID: 32, Name: "CEC_CERTIFICAT_VALORIC", MaxPaymentAmount: 0, IsActive: false },
            { ID: 33, Name: "TICHET", MaxPaymentAmount: 0, IsActive: false },
            { ID: 34, Name: "RETURNARE_MIZE", MaxPaymentAmount: 0, IsActive: false },
            { ID: 35, Name: "IMPOZIT", MaxPaymentAmount: 0, IsActive: false },
            { ID: 36, Name: "CÂȘTIG", MaxPaymentAmount: 0, IsActive: false },
            { ID: 81, Name: "CREDIT", MaxPaymentAmount: 0, IsActive: false },
            { ID: 82, Name: "LEASING", MaxPaymentAmount: 0, IsActive: false },
            { ID: 83, Name: "AVANS", MaxPaymentAmount: 0, IsActive: false },
            { ID: 84, Name: "ARVUNA", MaxPaymentAmount: 0, IsActive: false },
            { ID: 85, Name: "GAJ", MaxPaymentAmount: 0, IsActive: false },
            { ID: 86, Name: "CARD_VALORIC_CORPORATIV", MaxPaymentAmount: 0, IsActive: false },
            { ID: 87, Name: "TESTARE_METROLOGICA", MaxPaymentAmount: 0, IsActive: false },
            { ID: 88, Name: "ALT_MOD", MaxPaymentAmount: 0, IsActive: false }
        ];

        setDataBySetting((prev) => {
            const currentSetting = prev[activeId] || {};
            const updatedSetting = {
                ...currentSetting,
                PaymentTypes: defaultPayments,
            };

            const newDataBySetting = {
                ...prev,
                [activeId]: updatedSetting,
            };

            debouncedSave(activeId, updatedSetting, saveSettingsForActiveId);
            return newDataBySetting;
        });
    };

    const checkDuplicateAssortment = (value, row) => {
        if (!value) return false;

        const isDuplicate = departments.some(
            r => r.ID !== row.ID && r.Assortment === value
        );

        if (isDuplicate) {
            setShowWarningMessage(t("DepartmentsDuplicate"));
            setIsWarningModalVisible(true);
        }

        return isDuplicate;
    };

    // Обработчик обновления данных из дочерних таблиц — обновляет состояние и сразу запускает сохранение (с дебаунсом)
    const handleTableDataUpdate = (tableKey, updatedData) => {
        setDataBySetting((prev) => {
            const currentSetting = prev[activeId] || {};
            const settingsField = mapTableKeyToSettingsField(tableKey);
            if (!settingsField) return prev;

            const updatedSetting = {
                ...currentSetting,
                [settingsField]: updatedData,
            };

            const newDataBySetting = {
                ...prev,
                [activeId]: updatedSetting,
            };

            return newDataBySetting;
        });
    };

    return (
        <div id="assortement" className="flex flex-col min-h-screen">
            <nav className="p-3 w-full min-w-0">
                <h3 className="text-lg font-bold mb-2">{t("Settings")}</h3>

                <div className="flex flex-wrap gap-2 w-full">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveId(tab.id)}
                            className={`px-3 py-2 rounded flex-none whitespace-normal break-words
                ${tab.id === activeId
                                    ? "bg-gradient-to-r from-[#72b827] to-green-600 text-white"
                                    : "hover:bg-gray-200"
                                }`}
                        >
                            {t(tab.nameKey, { number: tab.number })}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="flex flex-wrap gap-2 px-6 py-4">
                {[
                    { key: "products", icon: <FaBoxOpen />, label: t("Tabs.Products") },
                    { key: "payments", icon: <FaMoneyBillWave />, label: t("Tabs.Payments") },
                    { key: "groups", icon: <FaLayerGroup />, label: t("Tabs.Groups") },
                    { key: "departments", icon: <FaBuilding />, label: t("Tabs.Departments") },
                    { key: "users", icon: <FaUsers />, label: t("Tabs.Users") },
                    { key: "global", icon: <FaGlobe />, label: t("Tabs.Global") },
                ].map(({ key, icon, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTable(key)}
                        className={`hover:scale-110 px-4 py-2 border-b-2 text-center break-words min-w-[80px] flex items-center justify-center gap-2
                ${key === activeTable
                                ? "border-green-600 text-green-600"
                                : "border-transparent text-gray-600 dark:text-white"
                            }`}
                    >
                        {/* Иконка */}
                        <span className="text-lg sm:text-base">{icon}</span>

                        {/* Текст только на больших экранах */}
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Блок импорта/экспорта - показывается только для таблицы products */}
            {activeTable === "products" && (
                <div className="flex flex-col bg-gray-50">
                    {/* Верхняя панель */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                        {/* Текст слева */}
                        <div className="text-sm text-gray-600 flex-shrink-0">
                            {t("Format.Supported")}: .xlsx, .xls
                        </div>

                        {/* Кнопки справа + знак вопроса */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Знак вопроса с подсказкой */}
                            <div
                                ref={iconRef}
                                onMouseEnter={handleIconEnter}
                                onMouseLeave={handleIconLeave}
                                className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded-full cursor-pointer"
                            >
                                <span className="text-xs">?</span>
                            </div>
                            {showTooltip && (
                                <Tooltip
                                    targetRef={iconRef}
                                    onMouseEnter={handleTooltipEnter}
                                    onMouseLeave={handleTooltipLeave}
                                >
                                    <p className="mb-1 font-medium">{t("TooltipImportAssortiment1")}</p>
                                    <p className="italic text-gray-600 mb-1">{t("TooltipImportAssortiment2")}</p>
                                    <p className="text-gray-500 mb-1">{t("TooltipImportAssortiment3")}</p>
                                    <p className="text-gray-500">{t("TooltipImportAssortiment4")}</p>

                                    <div className="mt-2 max-w-[90vw] overflow-auto">
                                        <table className="min-w-full text-xs border border-gray-300">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border px-2 py-1">ID</th>
                                                    <th className="border px-2 py-1">PLU</th>
                                                    <th className="border px-2 py-1">Code</th>
                                                    <th className="border px-2 py-1">Name</th>
                                                    <th className="border px-2 py-1">Price</th>
                                                    <th className="border px-2 py-1">Barcode</th>
                                                    <th className="border px-2 py-1">VATCode</th>
                                                    <th className="border px-2 py-1">Group</th>
                                                    <th className="border px-2 py-1">TME</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border px-2 py-1">1</td>
                                                    <td className="border px-2 py-1">1</td>
                                                    <td className="border px-2 py-1">11111</td>
                                                    <td className="border px-2 py-1">tomatoes</td>
                                                    <td className="border px-2 py-1">12,00</td>
                                                    <td className="border px-2 py-1">484000144087</td>
                                                    <td className="border px-2 py-1">A</td>
                                                    <td className="border px-2 py-1">test</td>
                                                    <td className="border px-2 py-1">true</td>
                                                </tr>
                                                <tr>
                                                    <td className="border px-2 py-1">2</td>
                                                    <td className="border px-2 py-1">2</td>
                                                    <td className="border px-2 py-1">22222</td>
                                                    <td className="border px-2 py-1">tomatoes</td>
                                                    <td className="border px-2 py-1">13,00</td>
                                                    <td className="border px-2 py-1">484000144089</td>
                                                    <td className="border px-2 py-1">A</td>
                                                    <td className="border px-2 py-1">test</td>
                                                    <td className="border px-2 py-1">false</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </Tooltip>
                            )}

                            {/* Кнопка для скачивания шаблона */}
                            <button
                                onClick={handleDownloadTemplate}
                                className="px-2 py-1 text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors flex items-center gap-1 flex-shrink-0"
                            >
                                <img src="/icons/File_Download.svg" className="w-5 h-5" />
                                <span className="text-xs">{t("Template")}</span>
                            </button>

                            {/* Импорт */}
                            <label
                                htmlFor="import-file"
                                className="cursor-pointer px-2 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center gap-1 flex-shrink-0"
                            >
                                <img src="/icons/File_Upload.svg" className="w-5 h-5" />
                            </label>
                            <input
                                id="import-file"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleImport}
                                className="hidden"
                            />

                            {/* Экспорт */}
                            <button
                                onClick={handleExport}
                                className="px-2 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors flex items-center gap-1 flex-shrink-0"
                            >
                                <img src="/icons/File_Download.svg" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1">
                {activeTable === "global" ? (
                    <GlobalSettingsForm
                        initialSettings={currentGlobalSettings}
                        ref={globalSettingsRef}
                        onChange={(newSettings) => {
                            setDataBySetting((prev) => {
                                const updated = {
                                    ...prev[activeId],
                                    GlobalSettings: newSettings,
                                };
                                return {
                                    ...prev,
                                    [activeId]: updated,
                                };
                            });
                        }}
                    />
                ) : (
                    <AssortmentTab
                        key={`${activeId}-${activeTable}`}
                        ref={(ref) => {
                            if (ref) tabsRefs.current[`${activeId}-${activeTable}`] = ref;
                        }}
                        tableKey={activeTable}
                        data={transformedData}
                        extraData={{ groups, products, users, payments, departments }}
                        usersPin={usersPin}
                        onDataChange={handleTableDataUpdate}
                        onResetPayments={handleResetPayments}
                        checkDuplicate={checkDuplicateAssortment}
                        loading={loading}
                    />
                )}
                <div className="gap-2 py-4">
                    <button
                        onClick={handleSaveAll}
                        className="px-4 py-2 bg-gradient-to-r from-[#72b827] to-green-600 text-white rounded transition"
                    >
                        {t("Save")}
                    </button>
                </div>
            </main>

            <ValidationModal
                errors={validationErrors}
                visible={showErrors}
                onClose={() => setShowErrors(false)}
            />
            <Toast
                visible={isSuccessModalVisible}
                message={showSuccessMessage}
                onClose={() => setIsSuccessModalVisible(false)}
                type="success"
            />
            <Toast
                visible={isWarningModalVisible}
                message={showWarningMessage}
                onClose={() => setIsWarningModalVisible(false)}
                type="warning"
            />
        </div>
    );
}