export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
export const on = (el, ev, fn) => { if (!el) return; el.addEventListener(ev, fn); };
export const uid = (p = "id") => p + Math.random().toString(36).slice(2, 10);
export const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const dayName = { mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo" };
export const todayKey = () => {
    const d = new Date();
    const i = d.getDay();
    if (i === 0) return "sun";
    if (i === 1) return "mon";
    if (i === 2) return "tue";
    if (i === 3) return "wed";
    if (i === 4) return "thu";
    if (i === 5) return "fri";
    return "sat";
};
export const hhmmToMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};
export const minutesToTop = (min) => Math.round(min * (1536 / 1440));

export const updateThemeLabel = () => {
    const btn = qs("#themeToggle");
    if (!btn) return;
    const isDark = document.documentElement.classList.contains("dark");
    btn.textContent = isDark ? "Cambiar a Claro ☀️" : "Cambiar a Oscuro 🌙";
};

export const initTheme = () => {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && systemDark)) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
    updateThemeLabel();
};

export const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
    updateThemeLabel();
};

export const initSyncIndicator = () => {
    if (document.getElementById("sync-indicator")) return;
    
    // Buscar el H1 en el header
    const h1 = qs("header h1");
    if (!h1) return;
    
    const span = document.createElement("span");
    span.id = "sync-indicator";
    span.className = "ml-2 inline-flex items-center gap-1.5 align-middle opacity-0 transition-opacity duration-300";
    h1.appendChild(span);
};

export const setSyncStatus = (status) => {
    const el = document.getElementById("sync-indicator");
    if (!el) return;
    
    // Limpiar clases de color anteriores pero mantener las estructurales
    el.className = "ml-2 inline-flex items-center gap-1.5 align-middle transition-opacity duration-300";
    el.innerHTML = "";
    
    if (status === "hidden") {
        el.classList.add("opacity-0");
        return;
    }
    
    el.classList.remove("opacity-0");
    
    // States: syncing, success, error
    if (status === "syncing") {
        el.classList.add("text-blue-600", "dark:text-blue-400");
        el.innerHTML = `<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    } else if (status === "success") {
        el.classList.add("text-emerald-600", "dark:text-emerald-400");
        el.innerHTML = `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
        setTimeout(() => setSyncStatus("hidden"), 3000);
    } else if (status === "error") {
        el.classList.add("text-amber-600", "dark:text-amber-400");
        el.innerHTML = `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
        setTimeout(() => setSyncStatus("hidden"), 5000);
    }
};
