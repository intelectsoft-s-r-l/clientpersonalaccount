import React, { useState, useRef, useEffect, useCallback } from "react";
import AssortmentTab from "../../components/AssortmentTab";
import GlobalSettingsForm from "../../components/GlobalSettingsForm";
import { assortmentConfigs } from "../../config/assortmentConfigs";
import { useAuth } from "../../context/AuthContext";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function AssortmentPage() {
    const [tabs, setTabs] = useState(assortmentConfigs);
    const [activeId, setActiveId] = useState(tabs[0]?.id || 1);
    const [activeTable, setActiveTable] = useState("products");
    const [dataBySetting, setDataBySetting] = useState({});
    const { getTokenFromServer } = useAuth();
    const [token, setToken] = useState(null);
    const { t } = useTranslation();
    const [usersPin, setUsersPin] = useState([]);

    const tabsRefs = useRef({});
    const globalSettingsRef = useRef(null);

    useEffect(() => {
        const fetchToken = async () => {
            const result = await getTokenFromServer();
            setToken(result);
        };

        fetchToken();
    }, [token]);

    useEffect(() => {
        async function fetchAndDecode() {
            try {
                const rawData = await apiService.proxyRequest(`/MobileCashRegister/web/GetSettings`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16",
                    },
                })

                if (!rawData.settings1 && !rawData.settings2 && !rawData.settings3) {
                    throw new Error("Нет настроек в ответе");
                }

                const decodedSettings = {};
                const tabsList = [];

                const forceBase64 = (str) => {
                    try {
                        // Пробуем сразу распарсить
                        JSON.parse(str);
                        // Если получилось — значит не base64, нужно кодировать
                        return btoa(unescape(encodeURIComponent(str)));
                    } catch {
                        // Иначе — вероятно, уже base64
                        return str;
                    }
                };

                ["settings1", "settings2", "settings3"].forEach((key, idx) => {
                    if (rawData[key]) {
                        try {
                            const base64Str = forceBase64(rawData[key]);
                            const jsonStr = atob(base64Str);
                            const parsed = JSON.parse(jsonStr);

                            ["PaymentTypes", "Assortments", "Groups", "Departments", "Users"].forEach(
                                (field) => {
                                    if (parsed[field] && Array.isArray(parsed[field])) {
                                        parsed[field] = parsed[field].map((item) => ({
                                            ...item,
                                            id: item.ID !== undefined ? item.ID : item.id ?? Date.now() + Math.random(),
                                        }));
                                    }
                                }
                            );

                            decodedSettings[key] = parsed;
                            tabsList.push({
                                id: key,
                                nameKey: "SettingNumber",
                                number: idx + 1,
                            });
                        } catch (e) {
                            console.error(`Ошибка декодирования или парсинга ${key}`, e);
                        }
                    }
                });

                setTabs(tabsList);
                setDataBySetting(decodedSettings);

                if (tabsList.length > 0) {
                    setActiveId(tabsList[0].id);
                }
            } catch (err) {
                console.error("Ошибка при получении настроек:", err);
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
                const encodedSettings = btoa(JSON.stringify(settingData));
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
            default:
                return null;
        }
    }

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

            // Сохраняем настройки с задержкой (1 сек) — чтобы не гонять запросы при каждом вводе
            debouncedSave(activeId, updatedSetting, saveSettingsForActiveId);

            return newDataBySetting;
        });
    };

    const handleSaveAll = async () => {
        if (!activeId) return;

        const allTables = ["payments", "products", "groups", "departments", "users"];
        let collectedData = {};

        for (const key of allTables) {
            if (tabsRefs.current[`${activeId}-${key}`]?.getData) {
                collectedData[key] = tabsRefs.current[`${activeId}-${key}`].getData();
            } else {
                collectedData[key] = [];
            }
        }

        const globalSettings = globalSettingsRef.current?.getGlobalSettings() || {};

        const Settings = {
            PaymentTypes: collectedData.payments,
            Assortments: collectedData.products,
            Groups: collectedData.groups,
            Departments: collectedData.departments,
            Users: collectedData.users,
            GlobalSettings: globalSettings,
        };

        const typeMap = {
            settings1: 1,
            settings2: 2,
            settings3: 3,
        };

        const type = typeMap[activeId] || 0;

        try {
            const encodedSettings = btoa(JSON.stringify(Settings));
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
            alert("Настройки успешно сохранены");
        } catch (err) {
            alert("Ошибка при сохранении: " + err.message);
        }
    };

    // Функция для экспорта товаров (только для таблицы products)
    const handleExport = () => {
        if (activeTable !== "products") {
            alert("Экспорт доступен только для таблицы товаров");
            return;
        }

        const currentSetting = dataBySetting[activeId] || {};
        const products = currentSetting.Assortments || [];

        if (!products || products.length === 0) {
            alert("Нет товаров для экспорта");
            return;
        }

        // Убираем поля, которые не нужны в экспорте
        const cleanData = products.map(item => {
            const cleaned = { ...item };
            // Удаляем служебные поля
            delete cleaned.id;
            delete cleaned.ProviderID;
            delete cleaned.ProviderName;
            delete cleaned.Provide;
            delete cleaned.FormData;
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
            alert("Ошибка при экспорте файла");
        }
    };



    // Функция для импорта товаров (только для таблицы products)
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (activeTable !== "products") {
            alert("Импорт доступен только для таблицы товаров");
            e.target.value = '';
            return;
        }

        // Проверяем формат файла
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(fileExtension)) {
            alert("Поддерживаются только файлы Excel (.xlsx, .xls)");
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

                // Берём первый лист
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Конвертируем в JSON с настройками для корректного чтения
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    defval: "",
                    raw: false,
                    dateNF: 'yyyy-mm-dd'
                });

                if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
                    alert("Файл пуст или содержит некорректные данные");
                    return;
                }

                // Добавляем ID для каждой записи
                const processedData = jsonData.map((item, index) => ({
                    ...item,
                    id: Date.now() + index,
                }));

                // Обновляем данные товаров в состоянии
                setDataBySetting((prev) => {
                    const currentSetting = prev[activeId] || {};
                    const updatedSetting = {
                        ...currentSetting,
                        Assortments: processedData,  // products соответствует Assortments
                    };

                    const newDataBySetting = {
                        ...prev,
                        [activeId]: updatedSetting,
                    };

                    // Сохраняем с дебаунсом
                    debouncedSave(activeId, updatedSetting, saveSettingsForActiveId);

                    return newDataBySetting;
                });

                alert(`Успешно импортировано ${processedData.length} товаров`);
            } catch (error) {
                console.error("Ошибка при импорте:", error);
                alert("Ошибка при чтении файла. Убедитесь, что файл не поврежден и имеет правильный формат.");
            }
        };

        reader.onerror = () => {
            alert("Ошибка при чтении файла");
        };

        reader.readAsBinaryString(file);

        // Сбрасываем значение input для возможности повторного выбора того же файла
        e.target.value = '';
    };

    const settingsField = mapTableKeyToSettingsField(activeTable);
    const currentSetting = dataBySetting[activeId] || {};
    const currentTableData = currentSetting[settingsField] || [];
    const currentGlobalSettings = currentSetting.GlobalSettings || {};

    const products = currentSetting.Assortments || [];
    const groups = currentSetting.Groups || [];
    const users = currentSetting.Users || [];

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

    return (
        <div id="assortement" className="flex flex-col min-h-screen">
            <nav className="border-b p-3 overflow-x-auto whitespace-nowrap">
                <h3 className="text-lg font-bold mb-2">{t("Settings")}</h3>
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveId(tab.id)}
                            className={`px-4 py-2 rounded whitespace-nowrap ${tab.id === activeId
                                ? "bg-gradient-to-r from-[#72b827] to-green-600 text-white"
                                : "hover:bg-gray-200"
                                }`}
                        >
                            {t(tab.nameKey, { number: tab.number })}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="flex gap-4 px-6 py-4 border-b">
                {["products", "payments", "groups", "departments", "users", "global"].map((key) => (
                    <button
                        key={key}
                        onClick={() => setActiveTable(key)}
                        className={`px-4 py-2 border-b-2 ${key === activeTable ? " border-green-600 text-green-600" : "border-transparent text-gray-600 dark:text-white"
                            }`}
                    >
                        {key === "products" && t("Tabs.Products")}
                        {key === "payments" && t("Tabs.Payments")}
                        {key === "groups" && t("Tabs.Groups")}
                        {key === "departments" && t("Tabs.Departments")}
                        {key === "users" && t("Tabs.Users")}
                        {key === "global" && t("Tabs.Global")}
                    </button>
                ))}
            </div>

            {/* Блок импорта/экспорта - показывается только для таблицы products */}
            {activeTable === "products" && (
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-gray-50">
                    {/* Текст слева */}
                    <div className="text-sm text-gray-600">
                        Поддерживаемые форматы: .xlsx, .xls
                    </div>

                    {/* Кнопки импорта и экспорта справа */}
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="import-file"
                            className="cursor-pointer px-2 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                            title="Импорт"
                        >
                            <img
                                src="/icons/File_Download.svg"
                                className="w-6 h-6 transform transition-transform duration-200 ease-in-out hover:scale-125"
                            />
                        </label>
                        <input
                            id="import-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleImport}
                            className="hidden"
                        />
                        <button
                            onClick={handleExport}
                            className="px-2 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            title="Экспорт"
                        >
                            <img
                                src="/icons/File_Upload.svg"
                                className="w-6 h-6 transform transition-transform duration-200 ease-in-out hover:scale-125"
                            />
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-1 mt-6">
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
                                    const updatedAll = {
                                        ...prev,
                                        [activeId]: updated,
                                    };
                                    debouncedSave(activeId, updated, saveSettingsForActiveId);
                                    return updatedAll;
                                });
                            }}
                        />
                    ) : (
                        <AssortmentTab
                            ref={(ref) => {
                                if (ref) tabsRefs.current[`${activeId}-${activeTable}`] = ref;
                            }}
                            tableKey={activeTable}
                            data={transformedData}
                            extraData={{ groups, products, users }}
                            onDataChange={handleTableDataUpdate}
                            usersPin={usersPin}
                        />
                    )}
                </div>
            </main>

            <footer className="p-6 border-t">
                <button
                    onClick={handleSaveAll}
                    className="px-6 py-3 bg-gradient-to-r from-[#72b827] to-green-600 text-white rounded transition"
                >
                    {t("Save")}
                </button>
            </footer>
        </div>
    );
}