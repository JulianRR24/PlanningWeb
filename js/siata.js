import { getItem, setItem, syncFromRemote } from "./storage.js";
import { renderHeader } from "./header.js";
import { initAuth, onAuthChange } from "./auth.js";
import { initAuthUI } from "./auth_ui.js";
import { qs, on, initTheme, toggleTheme, updateThemeLabel, initSyncIndicator } from "./ui.js";
import { ensureCommonModals, wireSettingsModal } from "./common_modals.js";

const initPage = async () => {
  renderHeader();
  ensureCommonModals();
  initTheme();
  initSyncIndicator();

  await initAuth();
  onAuthChange(async (user) => {
    initAuthUI(user);
    if (user) {
      await syncFromRemote(true);
    }
  });

  await wireSettingsModal({ getItem, setItem, qs, on, toggleTheme, updateThemeLabel });
};

document.addEventListener("DOMContentLoaded", initPage);
