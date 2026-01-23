import { supabase } from "./supabase.js";
import { authState } from "./auth.js";

export const forceSync = async () => {
    try {
        console.log('🔄 Iniciando sincronización forzada...');
        const remoteKeys = await listRemoteKeys();
        const localKeys = keys();
        const allKeys = new Set([...remoteKeys, ...localKeys]);

        let syncCount = 0;
        for (const k of allKeys) {
            const fullKey = keyPrefix(k);
            try {
                const remoteData = await fetchRemote(fullKey);
                const localData = getLocal(fullKey);
                
                if (remoteData !== null && isValidData(remoteData, k)) {
                    putLocal(fullKey, remoteData);
                    syncCount++;
                    console.log(`✅ Sincronizado: ${k}`);
                } else if (remoteData === null && localData !== null) {
                    await upsertRemote(fullKey, localData);
                    syncCount++;
                    console.log(`📤 Subido a remoto: ${k}`);
                }
            } catch (keyError) {
                console.error(`❌ Error sincronizando ${k}:`, keyError);
            }
        }
        
        console.log(`🎉 Sincronización completada: ${syncCount} claves procesadas`);
        return true;
    } catch (error) {
        console.error('❌ Error crítico en forceSync:', error);
        return false;
    }
};

const isValidData = (data, key) => {
    // console.log('🔍 isValidData llamado:', { data, type: typeof data, key }); // Performance optimization: Removed verbose log
    
    if (data === null || data === undefined) return false;
    
    if (key === 'activeRoutineId') {
        if (typeof data === 'string') {
            return true; // Any string is technically valid for ID (empty string means none)
        }
        
        const parsed = String(data);
        return true;
    }
    
    if (key === 'lastVisit') {
        const validDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return validDays.includes(data) || data === '';
    }
    
    if (typeof data === 'string') {
        try {
            JSON.parse(data);
        } catch {
            return false;
        }
    }
    
    if (key === 'routines' || key === 'widgets') {
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            return Array.isArray(parsed);
        } catch {
            return false;
        }
    }
    
    if (typeof data === 'string') {
        try {
            JSON.parse(data);
            return true;
        } catch {
            return true;
        }
    }
    
    return true;
};

const NS = "planningweb:";
const BACKUP_PREFIX = "backup:";

const keyPrefix = (k) => NS + k;
const parseJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const toJson = (v) => { try { return JSON.stringify(v); } catch { return null; } };

const createBackup = (key, value) => {
    try {
        const backupKey = BACKUP_PREFIX + key;
        localStorage.setItem(backupKey, JSON.stringify({
            timestamp: Date.now(),
            data: value
        }));
    } catch (error) {
        console.warn('⚠️ No se pudo crear backup:', error);
    }
};

const restoreFromBackup = (key) => {
    try {
        const backupKey = BACKUP_PREFIX + key;
        const backup = localStorage.getItem(backupKey);
        if (backup) {
            const { timestamp, data } = JSON.parse(backup);
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            
            if (Date.now() - timestamp < maxAge) {
                console.log(`🔄 Restaurando ${key} desde backup`);
                return data;
            } else {
                localStorage.removeItem(backupKey);
            }
        }
    } catch (error) {
        console.warn('⚠️ Error restaurando backup:', error);
    }
    return null;
};

const putLocal = (k, v) => { 
    try { 
        const j = toJson(v); 
        if (j != null) {
            const current = localStorage.getItem(k);
            if (current) {
                createBackup(k, parseJson(current));
            }
            localStorage.setItem(k, j); 
            return true; 
        }
        return false; 
    } catch (error) { 
        console.error('❌ Error en putLocal:', error);
        return false; 
    } 
};

const getLocal = (k) => { 
    try { 
        const r = localStorage.getItem(k); 
        return r == null ? null : parseJson(r); 
    } catch (error) { 
        console.error('❌ Error en getLocal:', error);
        const backup = restoreFromBackup(k);
        if (backup !== null) {
            localStorage.setItem(k, toJson(backup));
            return backup;
        }
        return null; 
    } 
};

const removeLocal = (k) => { 
    try { 
        localStorage.removeItem(k); 
        localStorage.removeItem(BACKUP_PREFIX + k);
        return true; 
    } catch (error) { 
        console.error('❌ Error en removeLocal:', error);
        return false; 
    } 
};

const upsertRemote = async (k, v) => { 
    try { 
        const jsonValue = toJson(v);
        if (!jsonValue) {
            console.error('❌ No se pudo serializar valor para upsertRemote');
            return false;
        }
        
        const payload = { 
            planning_web_kv_key: k, 
            planning_web_kv_value: jsonValue
        };
        
        // If logged in, attach user_id to ensure unique constraint (user_id, key) works
        if (authState.user) {
            payload.user_id = authState.user.id;
        }

        const { error } = await supabase
            .from("planning_web_key_value_store")
            .upsert(payload, { onConflict: 'user_id, planning_web_kv_key' }); 
        if (error) {
            console.error('❌ Error en upsertRemote:', error);
            return false;
        }
        return true; 
    } catch (error) { 
        console.error('❌ Error crítico en upsertRemote:', error);
        return false; 
    } 
};

const deleteRemote = async (k) => { 
    try { 
        const { error } = await supabase.from("planning_web_key_value_store").delete().eq("planning_web_kv_key", k); 
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
        const { data, error } = await supabase.from("planning_web_key_value_store").select("planning_web_kv_value").eq("planning_web_kv_key", k).maybeSingle(); 
        if (error) {
            console.error('❌ Error en fetchRemote:', error);
            return null;
        }
        
        if (!data || !data.planning_web_kv_value) {
            return null;
        }
        
        try {
            if (data.planning_web_kv_value && typeof data.planning_web_kv_value === 'object') {
                return data.planning_web_kv_value;
            }
            
            if (k === 'planningweb:lastVisit') {
                const validDays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
                if (validDays.includes(data.planning_web_kv_value)) {
                    console.log('🔧 lastVisit detectado, devolviendo directamente:', data.planning_web_kv_value);
                    return data.planning_web_kv_value;
                }
            }
            
            const parsed = JSON.parse(data.planning_web_kv_value);
            return parsed;
        } catch (parseError) {
            console.error(`❌ JSON corrupto en clave ${k}:`, parseError);
            console.log('🔧 Valor corrupto:', data.planning_web_kv_value, 'Tipo:', typeof data.planning_web_kv_value);
            
            if (typeof data.planning_web_kv_value === 'object' && data.planning_web_kv_value !== null) {
                console.log('🔧 Retornando objeto JSONB directamente:', data.planning_web_kv_value);
                return data.planning_web_kv_value;
            }
            
            if (data.planning_web_kv_value === '"sat"' || data.planning_web_kv_value === '"sun"' || data.planning_web_kv_value === '"mon"' || data.planning_web_kv_value === '"tue"' || data.planning_web_kv_value === '"wed"' || data.planning_web_kv_value === '"thu"' || data.planning_web_kv_value === '"fri"') {
                console.log('🔧 Corrigiendo día de semana:', data.planning_web_kv_value);
                return JSON.parse(data.planning_web_kv_value); // Parsear el string JSON para obtener el día
            }
            
            if (data.planning_web_kv_value === 'sat' || data.planning_web_kv_value === 'sun' || data.planning_web_kv_value === 'mon' || data.planning_web_kv_value === 'tue' || data.planning_web_kv_value === 'wed' || data.planning_web_kv_value === 'thu' || data.planning_web_kv_value === 'fri') {
                console.log('🔧 Corrigiendo día de semana sin comillas:', data.planning_web_kv_value);
                return data.planning_web_kv_value; // Devolver el string directamente
            }
            
            if (data.planning_web_kv_value === '[]' || data.planning_web_kv_value === '{}') {
                console.log('🔧 Corrigiendo array/object vacío:', data.planning_web_kv_value);
                return JSON.parse(data.planning_web_kv_value); // Parsear correctamente
            }
            
            if (data.planning_web_kv_value === '"[]"' || data.planning_web_kv_value === '"{}"') {
                console.log('🔧 Corrigiendo array/object vacío con comillas:', data.planning_web_kv_value);
                return JSON.parse(data.planning_web_kv_value); // Parsear el string JSON
            }
            
            if (data.planning_web_kv_value === '[object Object]') {
                console.log('🔧 Corrigiendo [object Object]:', data.planning_web_kv_value);
                return {};
            }
            
            if (typeof data.planning_web_kv_value === 'string' && data.planning_web_kv_value.startsWith('{') && data.planning_web_kv_value.includes('true') && !data.planning_web_kv_value.includes('"')) {
                console.log('🔧 Corrigiendo objeto sin comillas:', data.planning_web_kv_value);
                try {
                    const fixed = data.planning_web_kv_value.replace(/(\w+):/g, '"$1":');
                    return JSON.parse(fixed);
                } catch {
                    console.log('🔧 No se pudo corregir objeto sin comillas, devolviendo objeto vacío');
                    return {};
                }
            }
            
            if (typeof data.planning_web_kv_value === 'string' && data.planning_web_kv_value.includes('{') && data.planning_web_kv_value.includes('}')) {
                console.log('🔧 Intentando corregir objeto mal formado:', data.planning_web_kv_value);
                try {
                    return JSON.parse(data.planning_web_kv_value);
                } catch {
                    console.log('🔧 No se pudo corregir, devolviendo objeto vacío');
                    return {};
                }
            }
            
            return null;
        }
    } catch (error) { 
        console.error('❌ Error crítico en fetchRemote:', error);
        return null; 
    } 
};

const listRemoteKeys = async () => { 
    try { 
        const { data, error } = await supabase.from("planning_web_key_value_store").select("planning_web_kv_key"); 
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
        console.log('🔄 Cargando datos desde BD (fuente de verdad)...');
        const remoteKeys = await listRemoteKeys();
        let syncCount = 0;
        let errorCount = 0;
        
        for (const k of remoteKeys) {
            try {
                const full = keyPrefix(k);
                const remoteData = await fetchRemote(full);
                
                if (remoteData === null) {
                    console.log(`⚠️ Datos remotos nulos para: ${k}`);
                    continue;
                }
                
                if (!isValidData(remoteData, k)) {
                    console.error(`❌ Datos remotos inválidos para: ${k}`);
                    errorCount++;
                    continue;
                }
                
                const localData = getLocal(full);
                
                if (localData === null || localData === undefined) {
                    console.log(`📥 Cargando desde BD (no hay datos locales): ${k}`);
                    putLocal(full, remoteData);
                    syncCount++;
                } else if (force || JSON.stringify(localData) !== JSON.stringify(remoteData)) {
                    console.log(`🔄 Actualizando desde BD (datos diferentes): ${k}`);
                    putLocal(full, remoteData);
                    syncCount++;
                } else {
                    // console.log(`✅ Datos locales ya actualizados: ${k}`); // Verbose log removed
                }
            } catch (keyError) {
                console.error(`❌ Error procesando ${k}:`, keyError);
                errorCount++;
            }
        }
        
        console.log(`🎉 Sincronización desde BD completada: ${syncCount} actualizados, ${errorCount} errores`);
        return errorCount === 0;
    } catch (error) {
        console.error('❌ Error crítico en syncFromRemote:', error);
        return false;
    }
};

export const getItem = async (key) => {
    const k = keyPrefix(key);
    
    try {
        const remoteData = await fetchRemote(k);
        if (remoteData !== null && isValidData(remoteData, key)) {
            putLocal(k, remoteData);
            console.log(`📥 ${key}: cargado desde BD (fuente de verdad)`);
            return remoteData;
        } else if (remoteData !== null) {
            console.error(`❌ Datos remotos inválidos para getItem(${key}):`, remoteData);
        }
    } catch (error) {
        console.error(`❌ Error fetch remoto getItem(${key}):`, error);
    }
    
    const cached = getLocal(k);
    if (cached !== null) {
        console.log(`💾 ${key}: usando caché local (no hay datos en BD)`);
        return cached;
    }
    
    console.log(`⚠️ ${key}: no hay datos disponibles`);
    return null;
};

export const setItem = (key, value, syncRemote = true) => {
    const k = keyPrefix(key);
    
    // console.log('🔍 setItem llamado:', { key, k, value, type: typeof value, syncRemote });
    
    if (!isValidData(value, key)) {
        console.error(`❌ Datos inválidos para setItem(${key}):`, value);
        return false;
    }
    
    const ok = putLocal(k, value);
    
    if (syncRemote) {
        const isPotentiallyUnwantedEmpty = Array.isArray(value) && value.length === 0;
        if (isPotentiallyUnwantedEmpty) {
            console.log(`⚠️ Omitiendo sincronización automática de array vacío para: ${key}`);
            return ok;
        }
        
        upsertRemote(k, value).catch(error => {
            console.error(`❌ Error sincronizando ${key}:`, error);
            setTimeout(() => {
                upsertRemote(k, value).catch(retryError => {
                    console.error(`❌ Retry fallido para ${key}:`, retryError);
                });
            }, 2000);
        });
    }
    
    return ok;
};

export const removeItem = (key, remote = false) => {
    const k = keyPrefix(key);
    const ok = removeLocal(k);
    if (remote) {
        deleteRemote(k).catch(error => {
            console.error(`❌ Error eliminando remoto ${key}:`, error);
        });
    }
    return ok;
};

export const keys = () => {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(NS) && !k.startsWith(BACKUP_PREFIX)) {
            out.push(k.substring(NS.length));
        }
    }
    return out;
};

export const syncToRemote = async (key) => {
    try {
        const k = keyPrefix(key);
        const localData = getLocal(k);
        
        if (localData === null || localData === undefined) {
            console.log(`⚠️ No hay datos locales para sincronizar: ${key}`);
            return false;
        }
        
        if (!isValidData(localData, key)) {
            console.error(`❌ Datos locales inválidos para sincronizar: ${key}`);
            return false;
        }
        
        console.log(`📤 Sincronizando explícitamente a BD: ${key}`);
        const success = await upsertRemote(k, localData);
        
        if (success) {
            console.log(`✅ Sincronizado exitosamente: ${key}`);
        }
        
        return success;
    } catch (error) {
        console.error(`❌ Error en syncToRemote(${key}):`, error);
        return false;
    }
};

export const diagnoseData = async () => {
    console.log('🔍 Iniciando diagnóstico de datos...');
    
    const localKeys = keys();
    const remoteKeys = await listRemoteKeys();
    
    console.log(`📊 Claves locales: ${localKeys.length}`);
    console.log(`📊 Claves remotas: ${remoteKeys.length}`);
    
    const issues = [];
    
    for (const key of ['routines', 'widgets', 'activeRoutineId']) {
        const local = getLocal(keyPrefix(key));
        const remote = await fetchRemote(keyPrefix(key));
        
        console.log(`📋 ${key}:`);
        console.log(`   Local: ${local ? '✅' : '❌'} ${Array.isArray(local) ? `(${local.length} items)` : ''}`);
        console.log(`   Remoto: ${remote ? '✅' : '❌'} ${Array.isArray(remote) ? `(${remote.length} items)` : ''}`);
        
        if (local && !isValidData(local, key)) {
            issues.push(`Datos locales corruptos: ${key}`);
        }
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
