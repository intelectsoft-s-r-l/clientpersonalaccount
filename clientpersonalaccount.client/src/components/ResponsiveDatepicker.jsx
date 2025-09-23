import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // можно переписать стили через Tailwind

export function TailwindDatepicker({ selected, onChange, minDate, maxDate }) {
    return (
        <ReactDatePicker
            selected={selected}
            onChange={onChange}
            minDate={minDate}
            maxDate={maxDate}
            dateFormat="dd.MM.yyyy"
            showPopperArrow={false}
            popperPlacement="bottom-start" // автоматически подстраивается
            popperModifiers={[
                {
                    name: "preventOverflow",
                    options: {
                        padding: 8,
                    },
                },
            ]}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400"
            calendarClassName="bg-white border border-gray-300 rounded shadow-lg text-sm"
            todayButton="Сегодня"
        />
    );
}
