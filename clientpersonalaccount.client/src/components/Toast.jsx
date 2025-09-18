import React, { useEffect, useState } from "react";

export default function Toast({ message, visible, onClose, duration = 3000, type = "success" }) {
    const [progress, setProgress] = useState(100);

    // Цвета по типу
    const bgColors = {
        success: "bg-green-400",
        error: "bg-red-500",
        warning: "bg-yellow-400",
    };

    const progressColors = {
        success: "bg-green-200",
        error: "bg-red-300",
        warning: "bg-yellow-200",
    };

    useEffect(() => {
        if (visible) {
            setProgress(100);

            const step = 100 / (duration / 50); // уменьшаем каждые 50мс
            const interval = setInterval(() => {
                setProgress((prev) => Math.max(prev - step, 0));
            }, 50);

            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => {
                clearInterval(interval);
                clearTimeout(timer);
            };
        }
    }, [visible, duration, onClose]);

    if (!visible) return null;

    return (
        <div className="fixed top-5 right-5 z-50 w-80">
            <div className={`text-white px-5 py-3 rounded-lg shadow-lg text-base font-medium relative overflow-hidden animate-fade-in ${bgColors[type]}`}>
                {message}

                {/* Прогресс-бар снизу */}
                <div
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear ${progressColors[type]}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
