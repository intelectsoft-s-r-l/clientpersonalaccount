import React from "react";

export default function DeviceDetailsModal({ device, onClose }) {
  if (!device) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Детали устройства</h2>

        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="font-semibold py-1">Название:</td>
              <td>{device.name || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Фискальный код:</td>
              <td>{device.fiscalCode || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Модель:</td>
              <td>{device.model || device.deviceModel || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Номер:</td>
              <td>{device.number || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Статус:</td>
              <td>{device.status}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Тип:</td>
              <td>{device.deviceType}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Компания:</td>
              <td>{device.company || "-"}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1">Активирован:</td>
              <td>{device.activated || "-"}</td>
            </tr>
          </tbody>
        </table>

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
