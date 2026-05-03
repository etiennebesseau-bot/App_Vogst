import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Abfuhrtermine (gleiche Daten wie im Frontend)
const TRASH_SCHEDULE: Record<string, string[]> = {
  'Papiertonne': [
    '2026-05-04','2026-06-01','2026-06-29','2026-07-27',
    '2026-08-24','2026-09-21','2026-10-19','2026-11-16','2026-12-14',
  ],
  'Graue Tonne': [
    '2026-05-05','2026-05-19','2026-06-02','2026-06-16','2026-06-30',
    '2026-07-07','2026-07-14','2026-07-21','2026-07-28',
    '2026-08-04','2026-08-11','2026-08-18','2026-08-25',
    '2026-09-08','2026-09-22','2026-10-06','2026-10-20',
    '2026-11-03','2026-11-17','2026-12-01','2026-12-15','2026-12-29',
  ],
  'Gelber Sack': [
    '2026-05-07','2026-05-21','2026-06-05','2026-06-18',
    '2026-07-02','2026-07-16','2026-07-30','2026-08-13','2026-08-27',
    '2026-09-10','2026-09-24','2026-10-08','2026-10-22',
    '2026-11-05','2026-11-19','2026-12-03','2026-12-17','2026-12-31',
  ],
}

Deno.serve(async () => {
  const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
  const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublic  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidEmail   = Deno.env.get('VAPID_EMAIL')!

  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate)

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Morgen (in German timezone = UTC+2 in summer)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const dueTomorrow = Object.entries(TRASH_SCHEDULE)
    .filter(([, dates]) => dates.includes(tomorrowStr))
    .map(([name]) => name)

  if (dueTomorrow.length === 0) {
    return new Response('Kein Abfuhrtermin morgen.', { status: 200 })
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (error || !subscriptions?.length) {
    return new Response('Keine Abonnenten.', { status: 200 })
  }

  const title = `🗑️ Morgen: ${dueTomorrow.join(' & ')}`
  const body  = 'Bitte heute Abend rausstellen!'

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body }),
      ),
    ),
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return new Response(
    JSON.stringify({ sent, failed, title }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
