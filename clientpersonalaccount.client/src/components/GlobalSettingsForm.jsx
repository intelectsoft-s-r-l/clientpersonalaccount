import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

const defaultSettings = {
  PriceModify: false,
  VisualInterface: "default",
  ChangeDiscount: false,
  ChangeAdaos: false,
  MultiplePayment: false,
  ChangeCount: false,
  MaxInvoiceAmount: 0,
  MaxServiceAmount: 0,
  MIA: "",
  EnableSMS: false,
  CheckedFiscalizationCardOffline: false,
  QrSetting: {
    RowStart: 1,
    RowEnd: 5,
    Splitter: ";",
    ElementNameIndex: 0,
    ElementPriceIndex: 1,
    ElementNrPiecesIndex: 2,
    ElementDiscountIndex: 3,
    ElementVATIndex: 4,
  },
};

const GlobalSettingsForm = forwardRef(({ initialSettings }, ref) => {
  const [settings, setSettings] = useState({ ...defaultSettings, ...initialSettings });
  const { t } = useTranslation();

  useEffect(() => {
    setSettings({ ...defaultSettings, ...initialSettings });
  }, [initialSettings]);

  useImperativeHandle(ref, () => ({
    getGlobalSettings: () => settings,
  }));

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? +value || 0 : value || "",
    }));
  };

  const handleQrSettingChange = (e) => {
    const { name, type, value, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      QrSetting: {
        ...prev.QrSetting,
        [name]: type === "checkbox" ? checked : type === "number" ? +value || 0 : value || "",
      },
    }));
  };

  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-md w-full max-w-full mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          ["PriceModify", "checkbox", t("PriceModify")],
          ["ChangeDiscount", "checkbox", t("Discount")],
          ["ChangeAdaos", "checkbox", t("Adaos")],
          ["MultiplePayment", "checkbox", t("MultiplePayment")],
          ["ChangeCount", "checkbox", t("ChangeCountAssortment")],
          ["EnableSMS", "checkbox", t("MCR_SMSService")],
          ["CheckedFiscalizationCardOffline", "checkbox", t("FiscalizationCardOffline")],
        ].map(([key, type, label]) => (
          <label
            key={key}
            className="flex items-center space-x-3 cursor-pointer select-none text-gray-700"
          >
            <input
              type={type}
              name={key}
              checked={!!settings[key]}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-base">{label}</span>
          </label>
        ))}

        <label className="flex flex-col space-y-1 text-gray-700">
          <span>{t("SelectPointOfSales")}</span>
          <input
            type="text"
            name="VisualInterface"
            value={settings.VisualInterface || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={t("PlaceholderVisualInterface")}
          />
        </label>

        <label className="flex flex-col space-y-1 text-gray-700">
          <span>{t("MaxInvoiceAmount")}</span>
          <input
            type="number"
            name="MaxInvoiceAmount"
            value={settings.MaxInvoiceAmount ?? 0}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            min={0}
          />
        </label>

        <label className="flex flex-col space-y-1 text-gray-700">
          <span>{t("MaxServiceAmount")}</span>
          <input
            type="number"
            name="MaxServiceAmount"
            value={settings.MaxServiceAmount ?? 0}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            min={0}
          />
        </label>

        <label className="flex flex-col space-y-1 text-gray-700">
          <span>{t("MIA")}</span>
          <input
            type="text"
            name="MIA"
            value={settings.MIA || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder={t("PlaceholderMIA")}
          />
        </label>
      </div>

      <fieldset className="border border-gray-300 rounded-md p-5 bg-white">
        <legend className="text-lg font-semibold text-gray-800 px-2">
          {t("QRSettings")}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-4">
          {Object.entries(settings.QrSetting || {}).map(([key, val]) => (
            <label key={key} className="flex flex-col space-y-1 text-gray-700">
              <span>{t(`QrSettingKeys.${key}`, key)}</span>
              <input
                type={typeof val === "number" ? "number" : "text"}
                name={key}
                value={val ?? ""}
                onChange={handleQrSettingChange}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
});

export default GlobalSettingsForm;
