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
