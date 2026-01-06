
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Init Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch all necessary data
    // We need: activeRoutineId, routines, notify settings, and devices
    const { data: kvData, error: kvError } = await supabaseClient
      .from('planning_web_key_value_store')
      .select('planning_web_kv_key, planning_web_kv_value')
      .in('planning_web_kv_key', [
          'planningweb:activeRoutineId', 
          'planningweb:routines',
          'planningweb:notifyBeforeStart',
          'planningweb:notifyBeforeEnd'
      ])
      .or('planning_web_kv_key.like.planningweb:device:%')

    if (kvError) throw kvError

    // Helper to parse KV
    const getVal = (key: string) => {
        const item = kvData?.find(x => x.planning_web_kv_key === `planningweb:${key}`)
        if (!item || !item.planning_web_kv_value) return null
        // Handle potentially double-serialized JSON or direct JSONB
        const val = item.planning_web_kv_value
        if (typeof val === 'string') {
            try { return JSON.parse(val) } catch { return val }
        }
        return val
    }

    const activeRoutineId = getVal('activeRoutineId')
    const routines = getVal('routines') || []
    const notifyBeforeStart = Number(getVal('notifyBeforeStart') ?? 10)
    const notifyBeforeEnd = Number(getVal('notifyBeforeEnd') ?? 5)
    
    // Get Devices
    const devices = kvData
        ?.filter((x: any) => x.planning_web_kv_key.startsWith('planningweb:device:'))
        .map((x: any) => {
             const val = x.planning_web_kv_value
             return typeof val === 'string' ? JSON.parse(val) : val
        })
        .filter((d: any) => d && d.playerId) || []

    const playerIds = [...new Set(devices.map((d: any) => d.playerId))]

    if (playerIds.length === 0) {
        return new Response(JSON.stringify({ message: 'No devices subscribed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!activeRoutineId) {
        return new Response(JSON.stringify({ message: 'No active routine' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const routine = routines.find((r: any) => r.id === activeRoutineId)
    if (!routine) {
        return new Response(JSON.stringify({ message: 'Active routine not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Logic to determine notifications
    // Helper Time Functions
    const now = new Date()
    // Ajustar a hora Colombia/Local (App usage seems local, but server is UTC)
    // The previous app.js uses local device time. 
    // Edge function is UTC. We need to respect User Timezone? 
    // The app doesn't seem to store timezone. It assumes local time everywhere.
    // If the server is UTC, and user is in Colombia (UTC-5), 
    // we need to offset. But simple approach: `now` in server is UTC. 
    // If users set 8:00 AM in app, they mean 8:00 AM their time.
    // For now, let's assume we need to shift UTC to -5 for Colombia as the prompt implies "Medellin" (Pico y Placa, SIATA).
    // Or better: Use the offset if provided, otherwise default to UTC-5.
    const offset = -5 // UTC-5 (Colombia)
    const localNow = new Date(now.getTime() + offset * 3600 * 1000)
    const nowMin = localNow.getUTCHours() * 60 + localNow.getUTCMinutes()
    
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const todayKey = dayMap[localNow.getUTCDay()]
    const events = routine.days?.[todayKey] || []

    const notificationsToSend: any[] = []

    const hhmmToMinutes = (str: string) => {
        const [h, m] = str.split(':').map(Number)
        return h * 60 + m
    }

    // Check events
    for (const ev of events) {
        const s = hhmmToMinutes(ev.start)
        const e = hhmmToMinutes(ev.end)
        
        // Check Start
        const nsMin = Math.max(0, s - notifyBeforeStart)
        // Send if current time is exactly nsMin (or slightly after, assuming Cron runs every 1 min)
        // To be safe with Cron interval (e.g. 1 min), check if nowMin is == nsMin
        
        if (nowMin === nsMin) {
            notificationsToSend.push({
                title: ev.title || "Evento",
                body: `Va a comenzar: ${ev.title} a las ${ev.start}`,
                id: `${ev.id}_start_${todayKey}`
            })
        }

        // Check End
        const neMin = Math.max(0, e - notifyBeforeEnd)
        if (nowMin === neMin) {
            notificationsToSend.push({
                title: ev.title || "Evento",
                body: `Va a finalizar: ${ev.title} a las ${ev.end}`,
                id: `${ev.id}_end_${todayKey}`
            })
        }
    }

    console.log(`Checking time: ${localNow.toISOString()}, NowMin: ${nowMin}, Events found: ${notificationsToSend.length}`)

    // 4. Send OneSignal Notifications
    const results = []
    for (const notif of notificationsToSend) {
        // Send via REST API
        const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${Deno.env.get('ONESIGNAL_REST_API_KEY')}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                app_id: Deno.env.get('ONESIGNAL_APP_ID'),
                include_player_ids: playerIds,
                headings: { en: notif.title },
                contents: { en: notif.body },
                url: "https://web-planning-hub.vercel.app/index.html" // Deep link to open app
            })
        })
        const resJson = await response.json()
        results.push(resJson)
    }

    // 🔍 DEBUG INFO (Return this to help user debug)
    const debugInfo = {
        serverTimeUTC: now.toISOString(),
        localTimeCol: localNow.toISOString(),
        nowMin,
        offset,
        devicesFound: playerIds.length,
        activeRoutineId,
        eventsToday: events.length,
        secretsConfigured: {
            appId: !!Deno.env.get('ONESIGNAL_APP_ID'),
            apiKey: !!Deno.env.get('ONESIGNAL_REST_API_KEY')
        },
        notificationsSent: results.length
    }
    
    console.log("Debug Info:", debugInfo)

    return new Response(
      JSON.stringify({ success: true, results, debug: debugInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
