import { createPortal } from "react-dom";
import { useEffect, useState, useRef } from "react";

export default function Tooltip({ targetRef, children, offset = 8 }) {
    const [position, setPosition] = useState({ top: 0, left: 0, visibility: "hidden" });
    const tooltipRef = useRef(null);

    const updatePosition = () => {
        if (!targetRef.current || !tooltipRef.current) return;

        const rect = targetRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + offset;

        // ≈сли tooltip не помещаетс€ справа, сдвигаем влево
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        setPosition({ top, left, visibility: "visible" });
    };

    useEffect(() => {
        const handleResize = () => updatePosition();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return createPortal(
        <div
            ref={tooltipRef}
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                visibility: position.visibility,
                zIndex: 1000,
            }}
            className="absolute z-50 bg-white border border-gray-200 shadow-lg rounded p-2 text-sm"
        >
            {children}
        </div>,
        document.body
    );
}
