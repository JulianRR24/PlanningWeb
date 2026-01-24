import { supabase } from "./supabase.js";
import { authState } from "./auth.js";

const memStore = new Map();
const inFlightFetches = new Map();
const healedKeys = new Set();

const userCachePrefix = () => {
    const uid = authState.user?.id;
    return uid ? `planningweb-cache:${uid}:` : null;
};

const persistKey = (k) => {
    const p = userCachePrefix();
    return p ? p + k : null;
};

const loadPersisted = (k) => {
    const pk = persistKey(k);
    if (!pk) return null;
    try {
        const raw = localStorage.getItem(pk);
        if (raw === null || raw === undefined) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const savePersisted = (k, v) => {
    const pk = persistKey(k);
    if (!pk) return;
    try {
        localStorage.setItem(pk, JSON.stringify(v));
    } catch { }
};

const mergeRoutines = (localVal, remoteVal) => {
    const local = Array.isArray(localVal) ? localVal : [];
    const remote = Array.isArray(remoteVal) ? remoteVal : [];

    const byId = new Map();

    for (const r of remote) {
        if (!r || typeof r !== 'object') continue;
        if (!r.id || typeof r.id !== 'string') continue;
        byId.set(r.id, r);
    }

    for (const r of local) {
        if (!r || typeof r !== 'object') continue;
        if (!r.id || typeof r.id !== 'string') continue;

        const prev = byId.get(r.id);
        if (!prev) {
            byId.set(r.id, r);
            continue;
        }

        const prevTs = typeof prev.updatedAt === 'number' ? prev.updatedAt : 0;
        const rTs = typeof r.updatedAt === 'number' ? r.updatedAt : 0;
        byId.set(r.id, rTs >= prevTs ? r : prev);
    }

    return Array.from(byId.values());
};

const decodePossiblyDoubleEncoded = (val) => {
    let cur = val;
    for (let i = 0; i < 3; i++) {
        if (typeof cur !== "string") return cur;
        const trimmed = cur.trim();
        if (!(trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith('"'))) return cur;
        const parsed = parseJson(trimmed);
        if (parsed === null) return cur;
        cur = parsed;
    }
    return cur;
};

const NS = "planningweb:";

const keyPrefix = (k) => NS + k;
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const toJson = (v) => { try { return JSON.stringify(v); } catch { return null; } };

const getLocal = (k) => {
    if (memStore.has(k)) return memStore.get(k);
    const persisted = loadPersisted(k);
    if (persisted !== null && persisted !== undefined) {
        memStore.set(k, persisted);
        return persisted;
    }
    return null;
};
const putLocal = (k, v) => {
    memStore.set(k, v);
    savePersisted(k, v);
};

const isValidData = (data, key) => {
    if (data === null || data === undefined) return false;

    if (key === 'activeRoutineId') {
        if (typeof data === 'string') return true;
        return true;
    }

    if (key === 'lastVisit') {
        const validDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return validDays.includes(data) || data === '';
    }

    if (key === 'routines' || key === 'widgets') {
        if (Array.isArray(data)) return true;
        if (typeof data === 'string') {
            try {
                const parsed = decodePossiblyDoubleEncoded(data);
                return Array.isArray(parsed);
            } catch {
                return false;
            }
        }
        return false;
    }

    return true;
};

export const clearLocalData = () => {
    memStore.clear();
    inFlightFetches.clear();
    healedKeys.clear();
    const prefix = userCachePrefix();
    if (prefix) {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && k.startsWith(prefix)) localStorage.removeItem(k);
            }
        } catch { }
    }
    return;
};

export const forceSync = async () => {
    try {
        const remoteKeys = await listRemoteKeys();
        const localKeys = keys();
        const allKeys = new Set([...remoteKeys, ...localKeys]);

        for (const k of allKeys) {
            const fullKey = keyPrefix(k);
            const remoteData = await fetchRemote(fullKey);
            const localData = getLocal(fullKey);

            if (remoteData !== null && isValidData(remoteData, k)) {
                putLocal(fullKey, remoteData);
            } else if (remoteData === null && localData !== null && localData !== undefined) {
                await upsertRemote(fullKey, localData);
            }
        }
        return true;
    } catch (error) {
        console.error('❌ Error crítico en forceSync:', error);
        return false;
    }
};

export const upsertRemote = async (k, v) => { 
    try { 
        if (!authState.user) {
            console.error('❌ upsertRemote requiere sesión activa');
            return false;
        }
        const payload = { 
            planning_web_kv_key: k, 
            planning_web_kv_value: v
        };
        
        payload.user_id = authState.user.id;

        const { error } = await supabase
            .from("planning_web_key_value_store")
            .upsert(payload, { onConflict: 'user_id, planning_web_kv_key' });

        if (error) {
            const { data: rows, error: selError } = await supabase
                .from("planning_web_key_value_store")
                .select("planning_web_kv_id")
                .eq("planning_web_kv_key", k)
                .eq("user_id", authState.user.id)
                .order("planning_web_kv_updated_at", { ascending: false });

            if (selError) {
                console.error('❌ Error en upsertRemote:', error);
                console.error('❌ Error listando filas existentes:', selError);
                return false;
            }

            const keepId = rows?.[0]?.planning_web_kv_id;
            if (keepId) {
                const { error: updError } = await supabase
                    .from("planning_web_key_value_store")
                    .update({ planning_web_kv_value: v })
                    .eq("planning_web_kv_id", keepId)
                    .eq("user_id", authState.user.id);

                if (updError) {
                    console.error('❌ Error en upsertRemote:', error);
                    console.error('❌ Error actualizando fila existente:', updError);
                    return false;
                }

                if ((rows || []).length > 1) {
                    const dupIds = rows.slice(1).map(r => r.planning_web_kv_id).filter(Boolean);
                    if (dupIds.length) {
                        await supabase
                            .from("planning_web_key_value_store")
                            .delete()
                            .in("planning_web_kv_id", dupIds)
                            .eq("user_id", authState.user.id);
                    }
                }

                return true;
            }

            const { error: insError } = await supabase
                .from("planning_web_key_value_store")
                .insert(payload);

            if (insError) {
                console.error('❌ Error en upsertRemote:', error);
                console.error('❌ Error insertando fila:', insError);
                return false;
            }

            return true;
        }
        return true; 
    } catch (error) { 
        console.error('❌ Error crítico en upsertRemote:', error);
        return false; 
    } 
};

const deleteRemote = async (k) => { 
    try { 
        if (!authState.user) {
            console.error('❌ deleteRemote requiere sesión activa');
            return false;
        }
        const { error } = await supabase
            .from("planning_web_key_value_store")
            .delete()
            .eq("planning_web_kv_key", k)
            .eq("user_id", authState.user.id);
        if (error) {
            console.error('❌ Error en deleteRemote:', error);
            return false;
        }
        return true; 
    } catch (error) { 
        console.error('❌ Error crítico en deleteRemote:', error);
        return false; 
    } 
};

const fetchRemote = async (k) => { 
    try {
        if (!authState.user) return null;

        const { data, error } = await supabase
            .from("planning_web_key_value_store")
            .select("planning_web_kv_value")
            .eq("planning_web_kv_key", k)
            .eq("user_id", authState.user.id)
            .order("planning_web_kv_updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(' Error en fetchRemote:', error);
            return null;
        }

        if (!data || data.planning_web_kv_value === undefined || data.planning_web_kv_value === null) {
            return null;
        }

        const rawVal = data.planning_web_kv_value;
        const decoded = decodePossiblyDoubleEncoded(rawVal);

        if (!healedKeys.has(k) && typeof rawVal === 'string') {
            const healed = decodePossiblyDoubleEncoded(rawVal);
            if (healed !== null && typeof healed === 'object') {
                healedKeys.add(k);
                upsertRemote(k, healed).catch(() => { });
            }
        }

        if (k === 'planningweb:routines') {
            if (Array.isArray(decoded)) return decoded;
            if (typeof decoded === 'string') {
                const parsed = decodePossiblyDoubleEncoded(decoded);
                return Array.isArray(parsed) ? parsed : null;
            }
            return null;
        }

        if (k === 'planningweb:widgets') {
            if (Array.isArray(decoded)) return decoded;
            if (typeof decoded === 'string') {
                const parsed = decodePossiblyDoubleEncoded(decoded);
                return Array.isArray(parsed) ? parsed : null;
            }
            return null;
        }

        if (k === 'planningweb:activeRoutineId') {
            if (typeof decoded === 'string') {
                const maybe = decodePossiblyDoubleEncoded(decoded);
                return typeof maybe === 'string' ? maybe : String(maybe ?? '');
            }
            return String(decoded ?? '');
        }

        if (k === 'planningweb:lastVisit') {
            const validDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
            if (typeof decoded === 'string') {
                const maybe = decodePossiblyDoubleEncoded(decoded);
                if (typeof maybe === 'string' && validDays.includes(maybe)) return maybe;
            }
        }

        if (typeof decoded === 'string') {
            const maybe = parseJson(decoded);
            return maybe !== null ? maybe : decoded;
        }

        return decoded;
    } catch (error) {
        console.error(' Error crítico en fetchRemote:', error);
        return null;
    }
};

const listRemoteKeys = async () => {
    try {
        let query = supabase.from("planning_web_key_value_store").select("planning_web_kv_key");

        if (!authState.user) return [];
        query = query.eq("user_id", authState.user.id);

        const { data, error } = await query;
        if (error) {
            console.error('❌ Error en listRemoteKeys:', error);
            return [];
        }

        return (data || [])
            .map(x => x.planning_web_kv_key)
            .filter(k => typeof k === "string" && k.startsWith(NS))
            .map(k => k.substring(NS.length));
    } catch (error) {
        console.error('❌ Error crítico en listRemoteKeys:', error);
        return [];
    }
};

export const syncFromRemote = async (force = false) => {
    try {
        if (!authState.user) return false;
        const remoteKeys = await listRemoteKeys();
        const results = await Promise.all(remoteKeys.map(async (k) => {
            const fullKey = keyPrefix(k);
            const v = await fetchRemote(fullKey);
            return { k, fullKey, v };
        }));

        for (const r of results) {
            if (r.v !== null && isValidData(r.v, r.k)) {
                putLocal(r.fullKey, r.v);
            }
        }
        return true;
    } catch (error) {
        console.error('❌ Error crítico en syncFromRemote:', error);
        return false;
    }
};

export const getItem = async (key) => {
    const k = keyPrefix(key);

    try {
        if (!authState.user) return null;

        const localData = getLocal(k);
        if (localData !== null && isValidData(localData, key)) {
            return localData;
        }

        if (!inFlightFetches.has(k)) {
            inFlightFetches.set(k, (async () => {
                const remoteData = await fetchRemote(k);
                if (remoteData !== null && isValidData(remoteData, key)) {
                    putLocal(k, remoteData);
                    return remoteData;
                }
                return null;
            })().finally(() => {
                inFlightFetches.delete(k);
            }));
        }

        const remote = await inFlightFetches.get(k);
        if (remote !== null) {
            console.log(`📥 ${key}: cargado desde BD (fuente de verdad)`);
            return remote;
        }
    } catch (error) {
        console.error(`❌ Error fetch remoto getItem(${key}):`, error);
    }

    return null;
};

export const setItem = (key, value, syncRemote = true) => {
    const k = keyPrefix(key);

    if (!authState.user) {
        console.error(`❌ setItem(${key}) requiere sesión activa`);
        return false;
    }

    if (!isValidData(value, key)) {
        console.error(`❌ Datos inválidos para setItem(${key}):`, value);
        return false;
    }

    putLocal(k, value);

    if (syncRemote) {
        upsertRemote(k, value).catch(error => {
            console.error(`❌ Error sincronizando ${key}:`, error);
            setTimeout(() => {
                upsertRemote(k, value).catch(retryError => {
                    console.error(`❌ Retry fallido para ${key}:`, retryError);
                });
            }, 2000);
        });
    }

    return true;
};

export const removeItem = (key, remote = false) => {
    const k = keyPrefix(key);
    memStore.delete(k);
    const pk = persistKey(k);
    if (pk) {
        try { localStorage.removeItem(pk); } catch { }
    }
    if (!remote) return true;
    deleteRemote(k).catch(error => {
        console.error(`❌ Error eliminando remoto ${key}:`, error);
    });
    return true;
};

export const keys = () => {
    const fromMem = Array.from(memStore.keys())
        .filter(k => typeof k === 'string' && k.startsWith(NS))
        .map(k => k.substring(NS.length));
    const fromPersisted = [];
    const prefix = userCachePrefix();
    if (prefix) {
        try {
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (!k || !k.startsWith(prefix)) continue;
                const full = k.substring(prefix.length);
                if (full.startsWith(NS)) fromPersisted.push(full.substring(NS.length));
            }
        } catch { }
    }

    return Array.from(new Set([...fromMem, ...fromPersisted]));
};

export const syncToRemote = async (key) => {
    try {
        if (!authState.user) return false;
        const fullKey = keyPrefix(key);
        const localData = getLocal(fullKey);
        if (localData === null || localData === undefined) return false;
        return await upsertRemote(fullKey, localData);
    } catch (error) {
        console.error(`❌ Error en syncToRemote(${key}):`, error);
        return false;
    }
};

export const diagnoseData = async () => {
    console.log('🔍 Iniciando diagnóstico de datos...');
    const remoteKeys = await listRemoteKeys();
    console.log(`📊 Claves remotas: ${remoteKeys.length}`);
    
    const issues = [];
    
    for (const key of ['routines', 'widgets', 'activeRoutineId']) {
        const remote = await fetchRemote(keyPrefix(key));
        
        console.log(`📋 ${key}:`);
        console.log(`   Remoto: ${remote ? '✅' : '❌'} ${Array.isArray(remote) ? `(${remote.length} items)` : ''}`);
        if (remote && !isValidData(remote, key)) {
            issues.push(`Datos remotos corruptos: ${key}`);
        }
    }
    
    if (issues.length > 0) {
        console.error('❌ Problemas encontrados:');
        issues.forEach(issue => console.error(`   - ${issue}`));
    } else {
        console.log('✅ No se encontraron problemas');
    }
    
    return issues;
};
