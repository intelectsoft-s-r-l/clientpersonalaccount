import React, { useState, useRef, useEffect, useCallback } from "react";
import AssortmentTab from "../../components/AssortmentTab";
import GlobalSettingsForm from "../../components/GlobalSettingsForm";
import { assortmentConfigs } from "../../config/assortmentConfigs";
import { useAuth } from "../../context/AuthContext";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import apiService from '../../services/apiService';

export default function AssortmentPage() {
    const [tabs, setTabs] = useState(assortmentConfigs);
    const [activeId, setActiveId] = useState(tabs[0]?.id || 1);
    const [activeTable, setActiveTable] = useState("payments");
    const [dataBySetting, setDataBySetting] = useState({});
    const { getTokenFromServer } = useAuth();
    const [token, setToken] = useState(null);
    const { t } = useTranslation();

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

                ["settings1", "settings2", "settings3"].forEach((key, idx) => {
                    if (rawData[key]) {
                        try {
                            const jsonStr = atob(rawData[key]);
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
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Service-Id": "16",
                    },
                    body: JSON.stringify(payload),
                })

                if (!resp.ok) {
                    const text = await resp.text();
                    console.error("Ошибка сохранения:", text);
                    throw new Error(`Ошибка ${resp.status}`);
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
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-Service-Id": "16",
                },
                body: JSON.stringify(payload),
            })

            if (!resp.ok) {
                const text = await resp.text();
                console.error("Ошибка сохранения:", text);
                throw new Error(`Ошибка ${resp.status}`);
            }
            alert("Настройки успешно сохранены");
        } catch (err) {
            alert("Ошибка при сохранении: " + err.message);
        }
    };

    const settingsField = mapTableKeyToSettingsField(activeTable);
    const currentSetting = dataBySetting[activeId] || {};
    const currentTableData = currentSetting[settingsField] || [];
    const currentGlobalSettings = currentSetting.GlobalSettings || {};

    const products = currentSetting.Assortments || [];
    const groups = currentSetting.Groups || [];

    const joinConfigs = {

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
                {["payments", "products", "groups", "departments", "users"].map((key) => (
                    <button
                        key={key}
                        onClick={() => setActiveTable(key)}
                        className={`px-4 py-2 border-b-2 ${key === activeTable ? " border-green-600 text-green-600" : "border-transparent text-gray-600 dark:text-white"
                            }`}
                    >
                        {key === "payments" && t("Tabs.Payments")}
                        {key === "products" && t("Tabs.Products")}
                        {key === "groups" && t("Tabs.Groups")}
                        {key === "departments" && t("Tabs.Departments")}
                        {key === "users" && t("Tabs.Users")}
                    </button>
                ))}
            </div>

            <main className="flex-1 p-6 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-1 mt-6">
                    <AssortmentTab
                        ref={(ref) => {
                            if (ref) tabsRefs.current[`${activeId}-${activeTable}`] = ref;
                        }}
                        tableKey={activeTable}
                        data={transformedData}
                        extraData={{ groups, products }}
                        onDataChange={handleTableDataUpdate}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 mt-6">
                    <GlobalSettingsForm initialSettings={currentGlobalSettings} ref={globalSettingsRef} />
                </div>
            </main>

            <footer className="p-6 border-t">
                <button
                    onClick={handleSaveAll}
                    className="px-6 py-3 bg-gradient-to-r from-[#72b827] to-green-600 text-white rounded  transition"
                >
                    {t("SaveAll")}
                </button>
            </footer>
        </div>
    );
}
