import { useState, useEffect } from "react";

export function useTooltipPosition(ref, width = 300) {
    const [openLeft, setOpenLeft] = useState(false);

    useEffect(() => {
        function checkSide() {
            if (!ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;

            if (rect.right + width > windowWidth && rect.left - width > 0) {
                setOpenLeft(true);  // открываем влево
            } else {
                setOpenLeft(false); // открываем вправо
            }
        }

        checkSide();
        window.addEventListener("resize", checkSide);
        return () => window.removeEventListener("resize", checkSide);
    }, [ref, width]);

    return openLeft;
}
