import React, { useRef, useEffect } from "react";
import Datepicker from "react-tailwindcss-datepicker";

export default function CustomDatepicker({ asSingle, value, onChange, maxDate, minDate }) {
    const pickerRef = useRef(null);

    useEffect(() => {
        if (!pickerRef.current) return;

        const updateBorderRadius = () => {
            const selectedDays = pickerRef.current.querySelectorAll('.rdp-day_selected');
            selectedDays.forEach(day => {
                day.style.borderRadius = '4px'; // твой радиус
            });
        };

        updateBorderRadius(); // сразу после монтирования

        const observer = new MutationObserver(updateBorderRadius);
        observer.observe(pickerRef.current, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [value]);

    return (
        <div ref={pickerRef}>
            <Datepicker
                asSingle={asSingle}
                value={value}
                onChange={onChange}
                primaryColor="cyan"
                displayFormat="DD.MM.YYYY"
                minDate={minDate}
                maxDate={maxDate}
                useRange={false}
                withPortal={true}
                inputClassName="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
            />
        </div>
    );
}
