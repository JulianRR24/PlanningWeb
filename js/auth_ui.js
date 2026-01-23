import { qs, qsa, on } from './ui.js';
import { signIn, signUp, signOut, deleteAccount, updatePassword } from './auth.js';
import { syncFromRemote, clearLocalData } from './storage.js';

let isLoginMode = true;

const toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = qs('#authTitle');
    const submitText = qs('#authSubmitText');
    const switchText = qs('#authSwitchText');
    const switchBtn = qs('#authSwitchBtn');
    
    if (isLoginMode) {
        title.textContent = 'Iniciar Sesión';
        submitText.textContent = 'Entrar';
        switchText.textContent = '¿No tienes cuenta?';
        switchBtn.textContent = 'Regístrate';
    } else {
        title.textContent = 'Crear Cuenta';
        submitText.textContent = 'Registrarse';
        switchText.textContent = '¿Ya tienes cuenta?';
        switchBtn.textContent = 'Inicia sesión';
    }
    qs('#authError').classList.add('hidden');
};

const showModal = (id) => {
    const el = qs(id);
    if (el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
    }
};

const hideModal = (id) => {
    const el = qs(id);
    if (el) {
        el.classList.add('hidden');
        el.classList.remove('flex');
    }
};

const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const email = qs('#authEmail').value;
    const password = qs('#authPassword').value;
    const errEl = qs('#authError');
    const btnText = qs('#authSubmitText');
    const originalText = btnText.textContent;
    
    errEl.classList.add('hidden');
    btnText.textContent = 'Procesando...';
    
    try {
        if (isLoginMode) {
            await signIn(email, password);
        } else {
            await signUp(email, password);
            alert('Cuenta creada exitosamente. ¡Bienvenido!');
        }
        hideModal('#authModal');
        // Initial sync after login
        await syncFromRemote(true);
        location.reload(); // Simple reload to refresh all data view
    } catch (error) {
        console.error(error);
        errEl.textContent = error.message || 'Error de autenticación';
        errEl.classList.remove('hidden');
    } finally {
        btnText.textContent = originalText;
    }
};

const handleLogout = async () => {
    try {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            clearLocalData(); // Clean up local storage to prevent data leakage
            await signOut();
            location.reload();
        }
    } catch (error) {
        console.error(error);
        alert('Error al cerrar sesión');
    }
};

const handleDelete = async () => {
    const confirm1 = confirm('¿Estás seguro de ELIMINAR tu cuenta? Esta acción es irreversible y borrará todos tus datos.');
    if (!confirm1) return;
    
    const confirm2 = prompt('Para confirmar, escribe "eliminar"');
    if (confirm2 !== 'eliminar') return;
    
    try {
        await deleteAccount();
        alert('Cuenta eliminada. Hasta luego.');
        location.reload();
    } catch (error) {
        console.error(error);
        alert('Error al eliminar cuenta: ' + error.message);
    }
};

const toggleChangePass = (show) => {
    const container = qs('#changePassContainer');
    const btn = qs('#btnShowChangePass');
    if (show) {
        container.classList.remove('hidden');
        btn.classList.add('hidden');
    } else {
        container.classList.add('hidden');
        btn.classList.remove('hidden');
        qs('#newPassword').value = '';
    }
};

const handleUpdatePassword = async () => {
    const input = qs('#newPassword');
    const newPass = input.value;
    const btn = qs('#btnSavePass');
    
    if (newPass.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    const originalText = btn.textContent;
    btn.textContent = 'Guardando...';
    
    try {
        await updatePassword(newPass);
        alert('Contraseña actualizada correctamente');
        toggleChangePass(false);
    } catch (error) {
        console.error(error);
        alert('Error al actualizar: ' + error.message);
    } finally {
        btn.textContent = originalText;
    }
};

export const initAuthUI = (user) => {
    const authBtn = qs('#authBtn');
    const accountEmail = qs('#accountEmail');
    
    // Wire events
    on(qs('#authBtn'), 'click', () => {
        if (user) {
            showModal('#accountModal');
        } else {
            isLoginMode = true; // reset to login
            toggleAuthMode(); // ensure text is correct
            toggleAuthMode(); // double toggle to force reset? No, actually toggleAuthMode toggles checks current state
            isLoginMode = true;
             // Manual reset of texts
            const title = qs('#authTitle');
            const submitText = qs('#authSubmitText');
            const switchText = qs('#authSwitchText');
            const switchBtn = qs('#authSwitchBtn');
            title.textContent = 'Iniciar Sesión';
            submitText.textContent = 'Entrar';
            switchText.textContent = '¿No tienes cuenta?';
            switchBtn.textContent = 'Regístrate';
            
            showModal('#authModal');
        }
    });
    
    on(qs('#authClose'), 'click', () => hideModal('#authModal'));
    on(qs('#accountClose'), 'click', () => hideModal('#accountModal'));
    on(qs('#authSwitchBtn'), 'click', toggleAuthMode);
    on(qs('#authForm'), 'submit', handleAuthSubmit);
    on(qs('#btnLogout'), 'click', handleLogout);

    on(qs('#btnDeleteAccount'), 'click', handleDelete);
    
    on(qs('#btnShowChangePass'), 'click', () => toggleChangePass(true));
    on(qs('#btnCancelPass'), 'click', () => toggleChangePass(false));
    on(qs('#btnSavePass'), 'click', handleUpdatePassword);
    
    // Update UI state
    if (user) {
        authBtn.textContent = 'Mi Cuenta';
        authBtn.className = "px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-medium text-xs transition-all border border-indigo-200 dark:border-indigo-800";
        if (accountEmail) accountEmail.textContent = user.email;
    } else {
        authBtn.textContent = 'Iniciar Sesión';
        authBtn.className = "px-3 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium text-xs transition-all";
    }
};
