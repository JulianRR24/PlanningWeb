
import { on } from './ui.js';
import { initAuth, onAuthChange, signOut } from './auth.js';
import { clearLocalData } from './storage.js';

export const renderHeader = () => {
    const headerHTML = `
      <div
        class="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0"
      >
        <h1 class="text-xl font-semibold flex items-center">
            PlanningHub
            <span id="sync-indicator"></span>
        </h1>
        <nav class="flex flex-wrap justify-center items-center gap-3 text-sm">
          <a
            class="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            href="./index.html"
            >Inicio</a
          >
          <a
            class="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            href="./siata.html"
            >SIATA</a
          >
          <a
            class="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            href="./rutinas.html"
            >Rutinas</a
          >
          <a
            class="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            href="./widgets.html"
            >Widgets</a
          >
          <button
             type="button"
             id="authBtn"
             class="px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium text-xs transition-all"
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            id="settingsBtn"
            class="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Configuración"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.51-1 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              />
            </svg>
          </button>
        </nav>
      </div>
    `;

    const header = document.querySelector('header');
    if (header) {
        header.innerHTML = headerHTML;
        header.className = "sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 dark:bg-slate-900/70 dark:border-slate-800";
    }
};

// Re-init core listeners just for the unified header specific items (settings button mostly, auth button logic handles itself via auth_ui)
// Actually setting button logic is wired in app.js. 
// Ideally we should move header-specific wiring here OR ensure app.js calls this first.
