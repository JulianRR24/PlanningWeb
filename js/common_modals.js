export const ensureCommonModals = () => {
  if (document.getElementById("settingsModal") || document.getElementById("authModal") || document.getElementById("accountModal")) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="settingsModal" class="fixed inset-0 hidden items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div class="font-semibold">Configuración</div>
          <button
            type="button"
            id="settingsClose"
            class="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="font-medium">Notificaciones</div>
            <div class="grid grid-cols-2 gap-4">
              <label class="text-sm space-y-1">
                <span class="block opacity-70 min-h-[2.5rem] flex items-end pb-1">Minutos antes de iniciar</span>
                <input
                  id="notifyBeforeStart"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label class="text-sm space-y-1">
                <span class="block opacity-70 min-h-[2.5rem] flex items-end pb-1">Minutos antes de finalizar</span>
                <input
                  id="notifyBeforeEnd"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
          </div>
          <div class="space-y-2">
            <div class="font-medium">Apariencia</div>
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">Modo Oscuro</span>
              <button
                type="button"
                id="themeToggle"
                class="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Alternar Tema
              </button>
            </div>
          </div>
          <div class="space-y-2">
            <div class="font-medium">Permisos</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="askNotifyPerm"
                class="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700"
              >
                Permiso de notificaciones
              </button>
              <button
                type="button"
                id="askGeoPerm"
                class="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700"
              >
                Permiso de ubicación
              </button>
            </div>
            <div class="text-xs opacity-70">Los permisos requieren HTTPS o localhost.</div>
          </div>
        </div>
        <button
          type="button"
          id="saveSettings"
          class="w-full mt-4 px-3 py-2 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
        >
          Guardar cambios
        </button>
      </div>
    </div>

    <div id="authModal" class="fixed inset-0 hidden z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 space-y-6 shadow-xl relative">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold" id="authTitle">Iniciar Sesión</h3>
            <button type="button" id="authClose" class="p-2 -mr-2 opacity-60 hover:opacity-100">✕</button>
          </div>

          <form id="authForm" class="space-y-4">
            <div class="space-y-1">
              <label class="text-sm font-medium opacity-80">Correo electrónico</label>
              <input
                type="email"
                id="authEmail"
                required
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium opacity-80">Contraseña</label>
              <input
                type="password"
                id="authPassword"
                required
                minlength="6"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div id="authError" class="text-xs text-rose-500 hidden"></div>

            <button
              type="submit"
              class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              <span id="authSubmitText">Entrar</span>
            </button>
          </form>

          <div class="text-center text-sm opacity-80">
            <span id="authSwitchText">¿No tienes cuenta?</span>
            <button type="button" id="authSwitchBtn" class="font-medium text-indigo-500 hover:underline">Regístrate</button>
          </div>
        </div>
      </div>
    </div>

    <div id="accountModal" class="fixed inset-0 hidden z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 space-y-6 shadow-xl relative">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold">Mi Cuenta</h3>
            <button type="button" id="accountClose" class="p-2 -mr-2 opacity-60 hover:opacity-100">✕</button>
          </div>

          <div class="space-y-4">
            <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/50 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div class="overflow-hidden">
                <div class="text-xs opacity-60 uppercase tracking-wider font-semibold">Usuario</div>
                <div id="accountEmail" class="font-medium truncate">...</div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                type="button"
                id="btnShowChangePass"
                class="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Cambiar Contraseña
              </button>

              <div
                id="changePassContainer"
                class="hidden space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div class="space-y-1">
                  <label class="text-xs font-medium opacity-70">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="newPassword"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    id="btnSavePass"
                    class="flex-1 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    id="btnCancelPass"
                    class="py-1.5 px-3 rounded-md bg-slate-200 dark:bg-slate-700 text-xs font-medium hover:opacity-80 transition-opacity"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <button
                type="button"
                id="btnLogout"
                class="w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                Cerrar Sesión
              </button>
              <button
                type="button"
                id="btnDeleteAccount"
                class="w-full py-2 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors text-sm font-medium"
              >
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    `.trim()
  );
};

export const wireSettingsModal = async ({ getItem, setItem, qs, on, toggleTheme, updateThemeLabel }) => {
  const settingsBtn = qs("#settingsBtn");
  const modal = qs("#settingsModal");
  const closeBtn = qs("#settingsClose");
  const saveSettings = qs("#saveSettings");
  const askNotifyPerm = qs("#askNotifyPerm");
  const askGeoPerm = qs("#askGeoPerm");
  const themeToggle = qs("#themeToggle");

  const ns = (await getItem("notifyBeforeStart")) ?? 10;
  const ne = (await getItem("notifyBeforeEnd")) ?? 5;
  const nsEl = qs("#notifyBeforeStart");
  const neEl = qs("#notifyBeforeEnd");
  if (nsEl) nsEl.value = ns;
  if (neEl) neEl.value = ne;

  on(settingsBtn, "click", () => {
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    updateThemeLabel();
  });

  on(closeBtn, "click", () => {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  on(themeToggle, "click", toggleTheme);

  on(saveSettings, "click", async () => {
    const v1 = Number(nsEl?.value || 10);
    const v2 = Number(neEl?.value || 5);
    await setItem("notifyBeforeStart", Math.max(0, v1), true);
    await setItem("notifyBeforeEnd", Math.max(0, v2), true);
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  on(askNotifyPerm, "click", async () => {
    try {
      await Notification.requestPermission();
    } catch { }
  });

  on(askGeoPerm, "click", async () => {
    try {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(() => { }, () => { }, { enableHighAccuracy: true, timeout: 8000 });
    } catch { }
  });
};
