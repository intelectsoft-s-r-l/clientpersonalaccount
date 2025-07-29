import React, { useEffect, useState } from "react";

const SunIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" stroke="none" />
        <line x1="12" y1="21" x2="12" y2="23" stroke="none" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="none" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="none" />
        <line x1="1" y1="12" x2="3" y2="12" stroke="none" />
        <line x1="21" y1="12" x2="23" y2="12" stroke="none" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="none" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="none" />
    </svg>
);

const MoonIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden="true"
    >
        <path d="M21 12.79A9 9 0 0111.21 3 7 7 0 0012 21a9 9 0 009-8.21z" />
    </svg>
);

const ThemeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");
        const isDark = storedTheme === "dark";

        document.documentElement.classList.toggle("dark", isDark);
        setIsDarkMode(isDark);
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        document.documentElement.classList.toggle("dark", newTheme);
        localStorage.setItem("theme", newTheme ? "dark" : "light");
        setIsDarkMode(newTheme);
    };

    return (
        <>
            <style>{`
        .theme-toggle-wrapper {
          width: 64px;
          height: 30px;
          position: relative;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #cbd5e1;
          border-radius: 9999px;
          padding: 0 8px;
          box-sizing: border-box;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .theme-toggle-wrapper.dark {
          background-color: #22c55e;
        }

        .theme-toggle-input {
          opacity: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          cursor: pointer;
          margin: 0;
          z-index: 3;
          top: 0;
          left: 0;
        }

        .theme-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
          color: #94a3b8; /* серый по умолчанию */
          transition: color 0.3s ease;
        }

        .theme-icon.active {
          color: white;
          filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));
        }
      `}</style>

            <div
                className={`theme-toggle-wrapper${isDarkMode ? " dark" : ""}`}
                onClick={toggleTheme}
                role="switch"
                aria-checked={isDarkMode}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleTheme();
                    }
                }}
                aria-label="Переключатель темы"
            >
                <span className={`theme-icon sun${!isDarkMode ? " active" : ""}`} aria-hidden="true">
                    <SunIcon />
                </span>
                <span className={`theme-icon moon${isDarkMode ? " active" : ""}`} aria-hidden="true">
                    <MoonIcon />
                </span>
            </div>
        </>
    );
};

export default ThemeToggle;
