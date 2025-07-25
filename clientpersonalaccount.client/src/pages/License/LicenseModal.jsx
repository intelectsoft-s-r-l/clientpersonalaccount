import React, { useEffect } from "react";
import { StatusEnum } from "../../enums/Enums";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU");
}

export default function LicenseModal({ license, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!license) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Информация о лицензии</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Имя:</span>
            <div>{license.name}</div>
          </div>
          <div>
            <span className="font-semibold">Устройство:</span>
            <div>{license.deviceName}</div>
          </div>
          <div>
            <span className="font-semibold">Адрес:</span>
            <div>{license.address}</div>
          </div>
          <div>
            <span className="font-semibold">Версия приложения:</span>
            <div>{license.appVersion}</div>
          </div>
          <div>
            <span className="font-semibold">Батарея:</span>
            <div>{license.battery}%</div>
          </div>
          <div>
            <span className="font-semibold">Статус:</span>
            <div>{StatusEnum[license.licenseStatus]?.label}</div>
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Последнее обновление:</span>
            <div>{formatDate(license.lastDateUpdate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
