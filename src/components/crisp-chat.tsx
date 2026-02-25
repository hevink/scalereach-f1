"use client";

import { useEffect } from "react";

export function CrispChat() {
    useEffect(() => {
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = "5f96de42-981e-413e-b144-8ada6aa8a760";

        const script = document.createElement("script");
        script.src = "https://client.crisp.chat/l.js";
        script.async = true;
        document.head.appendChild(script);
    }, []);

    return null;
}
