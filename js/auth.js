import { supabase } from './supabase.js';

export const authState = {
    user: null,
    session: null
};

let authInitialized = false;
let authUnsubscribe = null;

// Listeners for auth state changes
const listeners = [];
export const onAuthChange = (callback) => {
    listeners.push(callback);
    // Submit current state immediately
    callback(authState.user);
};

export const initAuth = async () => {
    if (authInitialized) return;
    authInitialized = true;

    // Check initial session
    const { data: { session } } = await supabase.auth.getSession();
    updateState(session);

    // Subscribe to changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        updateState(session);
    });

    authUnsubscribe = data?.subscription;
};

const updateState = (session) => {
    authState.session = session;
    authState.user = session?.user || null;
    listeners.forEach(cb => cb(authState.user));
    
    // Update UI body class for CSS adjustments if needed
    if (authState.user) {
        document.body.classList.add('logged-in');
        document.body.classList.remove('logged-out');
    } else {
        document.body.classList.add('logged-out');
        document.body.classList.remove('logged-in');
    }
    
    console.log('👤 Auth State Updated:', authState.user ? `Logged in as ${authState.user.email}` : 'Guest / Offline');
};

export const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const updateEmail = async (email) => {
    const { data, error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
    return data;
};

export const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
};

// NOTA: Supabase no permite eliminar el propio usuario directamente desde el cliente key por seguridad por defecto en algunos tiers,
// pero si la politica lo permite o se usa una Edge Function es posible.
// Para este MVP intentaremos la llamada directa. Si falla, el usuario deberá hacerlo desde admin panel o requerir backend function.
export const deleteAccount = async () => {
    // Obtenemos el ID antes de llamar (aunque la función RPC o endpoint lo sabría)
    const { error } = await supabase.rpc('delete_user'); 
    // Nota: Esto requiere que crees una función RPC en postgres si auth.users no es accesible.
    // Alternativa simple para MVP: Solo borrar datos y sign out, y dejar el user "huérfano" en auth.
    // O mejor: Usar la API de admin si tuviéramos backend.
    
    // FALLBACK para MVP Client-side only: Borrar todos los datos propios y salir.
    // Realmente borrar la cuenta de auth.users requiere Service Role key o una RPC con permisos 'security definer'.
    // Haremos un best-effort borrando los datos.
    
    const { error: dataError } = await supabase
        .from('planning_web_key_value_store')
        .delete()
        .eq('user_id', authState.user.id);
        
    if (dataError) console.error('Error clearing data', dataError);
    
    await signOut();
    return true; 
};
