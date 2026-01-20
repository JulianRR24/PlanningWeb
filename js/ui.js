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
    const div = document.createElement("div");
    div.id = "sync-indicator";
    div.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all duration-300 opacity-0 translate-y-2 pointer-events-none";
    document.body.appendChild(div);
};

export const setSyncStatus = (status) => {
    const el = document.getElementById("sync-indicator");
    if (!el) return;
    
    el.classList.remove("opacity-0", "translate-y-2", "text-blue-600", "text-emerald-600", "text-amber-600", "text-rose-600");
    el.innerHTML = "";
    
    if (status === "hidden") {
        el.classList.add("opacity-0", "translate-y-2");
        return;
    }
    
    // States: syncing, success, error, offline
    if (status === "syncing") {
        el.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all duration-300 opacity-100 translate-y-0 text-blue-600 dark:text-blue-400";
        el.innerHTML = `<svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Sincronizando...</span>`;
    } else if (status === "success") {
        el.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-emerald-200 dark:border-emerald-800 text-xs font-medium transition-all duration-300 opacity-100 translate-y-0 text-emerald-600 dark:text-emerald-400";
        el.innerHTML = `<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg> <span>Actualizado</span>`;
        setTimeout(() => setSyncStatus("hidden"), 3000);
    } else if (status === "error") {
        el.className = "fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-amber-200 dark:border-amber-800 text-xs font-medium transition-all duration-300 opacity-100 translate-y-0 text-amber-600 dark:text-amber-400";
        el.innerHTML = `<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> <span>Sin conexión</span>`;
        setTimeout(() => setSyncStatus("hidden"), 5000);
    }
};
