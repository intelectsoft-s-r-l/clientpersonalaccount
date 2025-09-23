import React, { useRef, useState, useEffect } from "react";
import {
    Input,
    Popover,
    PopoverHandler,
    PopoverContent,
} from "@material-tailwind/react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";

export function TailwindDatepicker({
    value,
    onChange,
    minDate,
    maxDate,
    displayFormat = "dd.MM.yyyy",
}) {
    const wrapperRef = useRef(null);
    const [position, setPosition] = useState({ left: 0, top: 0, width: 0 });
    const [open, setOpen] = useState(false);

    const updatePosition = () => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = rect.left;
        let top = rect.bottom + 4;
        let width = rect.width; // ширина под инпут

        const calendarHeight = 300;

        if (left + width > viewportWidth) left = Math.max(8, viewportWidth - width - 8);
        if (left < 8) left = 8;
        if (top + calendarHeight > viewportHeight) top = rect.top - calendarHeight - 4;

        setPosition({ left, top, width });
    };

    useEffect(() => {
        window.addEventListener("resize", updatePosition);
        return () => window.removeEventListener("resize", updatePosition);
    }, []);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <Popover open={open} handler={setOpen} placement="bottom">
                <PopoverHandler>
                    <Input
                        readOnly
                        value={value ? format(value, displayFormat) : ""}
                        onClick={() => {
                            setOpen(!open);
                            updatePosition();
                        }}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-black"
                    />
                </PopoverHandler>
                <PopoverContent
                    style={{ width: position.width }}
                    className="!absolute z-50 p-4 bg-white rounded-2xl shadow-xl border border-gray-100"
                    container={document.body}
                >
                    <DayPicker
                        mode="single"
                        selected={value}
                        onSelect={(date) => {
                            onChange(date);
                            setOpen(false);
                        }}
                        fromDate={minDate}
                        toDate={maxDate}
                        showOutsideDays
                        className="border-0"
                        modifiers={{
                            today: new Date(),
                        }}

                        modifiersClassNames={{
                            selected:
                                "bg-blue-600 text-white font-semibold rounded-3xl shadow-md hover:bg-blue-700 transition-all flex items-center justify-center w-7 h-7",
                            today:
                                "text-blue-600 font-medium rounded-full",
                            disabled:
                                "opacity-40 text-gray-400 cursor-not-allowed hover:bg-transparent",
                        }}
                        classNames={{
                            caption: "flex justify-center py-2 mb-4 relative items-center",
                            caption_label: "text-sm font-medium text-gray-900",
                            nav: "flex items-center",
                            nav_button:
                                "h-6 w-6 bg-transparent hover:bg-blue-gray-50 p-1 rounded-md transition-colors duration-300",
                            nav_button_previous: "absolute left-1.5",
                            nav_button_next: "absolute right-1.5",
                            table: "w-full border-collapse",
                            head_row: "flex font-medium text-gray-900",
                            head_cell: "m-0.5 w-9 font-normal text-sm",
                            row: "flex w-full mt-2",
                            cell: "text-gray-600 rounded-md h-9 w-9 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-900/20 [&:has([aria-selected].day-outside)]:text-white [&:has([aria-selected])]:bg-gray-900/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal",
                            day_range_end: "day-range-end",
                            day_selected:
                                "rounded-md bg-gray-900 text-white hover:bg-gray-900 hover:text-white focus:bg-gray-900 focus:text-white",
                            day_today: "rounded-md bg-gray-200 text-gray-900",
                            day_outside:
                                "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-500 aria-selected:text-gray-900 aria-selected:bg-opacity-10",
                            day_disabled: "text-gray-500 opacity-50",
                            day_hidden: "invisible",
                        }}
                        components={{
                            IconLeft: (props) => <ChevronLeftIcon {...props} className="h-4 w-4 stroke-2" />,
                            IconRight: (props) => <ChevronRightIcon {...props} className="h-4 w-4 stroke-2" />,
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
