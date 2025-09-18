import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n"; // Убедись, что файл существует

const languages = [
    { code: "ru", label: "Русский", flag: "/flags/ru.png" },
    { code: "en", label: "English", flag: "/flags/en.png" },
    { code: "ro", label: "Română", flag: "/flags/ro.png" },
];

export default function LanguageSwitcher() {
    const { i18n: { language } } = useTranslation();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState("right");
    const buttonRef = useRef(null);
    const containerRef = useRef(null);

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem("i18nextLng", code);
        setOpen(false);
    };

    const current = languages.find((l) => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    useEffect(() => {
        if (open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceRight = window.innerWidth - rect.right;
            const spaceLeft = rect.left;

            if (spaceRight < 160 && spaceLeft > 160) {
                setPosition("left");
            } else {
                setPosition("right");
            }
        }
    }, [open]);

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 hover:bg-gray-100"
            >
                <img src={current.flag} alt={current.code} className="w-6 h-4" />
            </button>

            {open && (
                <div
                    className={`absolute z-10 mt-2 w-40 bg-white border rounded shadow-md ${position === "left" ? "right-0" : "left-0"
                        }`}
                >
                    {languages.map(({ code, label, flag }) => (
                        <button
                            key={code}
                            onClick={() => changeLanguage(code)}
                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 ${code === language ? "bg-gray-100 font-semibold" : ""
                                }`}
                        >
                            <img src={flag} alt={code} className="w-5 h-3" />
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
