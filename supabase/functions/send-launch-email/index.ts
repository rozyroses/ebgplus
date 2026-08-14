import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('EBGPLUS_FROM_EMAIL')
    const publicUrl = Deno.env.get('EBGPLUS_PUBLIC_URL')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error('Supabase function secrets are missing.')
    if (!resendKey) throw new Error('RESEND_API_KEY is not configured.')
    if (!fromEmail) throw new Error('EBGPLUS_FROM_EMAIL is not configured.')
    if (!publicUrl) throw new Error('EBGPLUS_PUBLIC_URL is not configured.')

    const authorization = request.headers.get('Authorization') ?? ''
    const accessToken = authorization.replace(/^Bearer\s+/i, '').trim()
    if (!accessToken) return json({ error: 'Authentication required.' }, 401)

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken)
    if (userError || !userData.user) return json({ error: 'Invalid session.' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: account, error: accountError } = await admin
      .from('accounts')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (accountError) throw accountError
    if (!account || !['founder', 'administrator', 'producer'].includes(account.role)) {
      return json({ error: 'You are not authorized to send launch emails.' }, 403)
    }

    const { data: subscribers, error: subscriberError } = await admin
      .from('launch_waitlist')
      .select('id,email,unsubscribe_token')
      .is('notified_at', null)
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: true })

    if (subscriberError) throw subscriberError
    if (!subscribers?.length) return json({ sent: 0, remaining: 0 })

    let sent = 0
    const baseUrl = publicUrl.replace(/\/$/, '')

    for (const group of chunk(subscribers, 100)) {
      const payload = group.map((subscriber) => {
        const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`
        return {
          from: fromEmail,
          to: [subscriber.email],
          subject: 'EBG+ is officially live. ✨',
          html: `
            <div style="background:#030303;color:#f6f1e8;font-family:Arial,sans-serif;padding:40px 24px;">
              <div style="max-width:620px;margin:0 auto;border:1px solid rgba(214,174,82,.35);border-radius:24px;padding:36px;background:#0d0d0d;">
                <p style="color:#d6ae52;letter-spacing:.18em;text-transform:uppercase;font-size:12px;margin:0 0 18px;">EBG+</p>
                <h1 style="font-size:36px;line-height:1.05;margin:0 0 18px;">The doors are open.</h1>
                <p style="font-size:17px;line-height:1.7;color:#d9d4ca;">Original shows, music, stories, and the EBG universe are now live on EBG+.</p>
                <p style="margin:30px 0;">
                  <a href="${baseUrl}" style="display:inline-block;background:#d6ae52;color:#050505;text-decoration:none;font-weight:800;border-radius:999px;padding:14px 22px;">Enter EBG+</a>
                </p>
                <p style="font-size:12px;line-height:1.6;color:#8f8a82;">You joined the EBG+ launch list. <a href="${unsubscribeUrl}" style="color:#d6ae52;">Unsubscribe</a>.</p>
              </div>
            </div>
          `,
          text: `EBG+ is officially live. Visit ${baseUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
          tags: [{ name: 'campaign', value: 'ebgplus_launch' }],
        }
      })

      const idempotencyKey = `ebgplus-launch-${group[0].id}-${group[group.length - 1].id}`
      const resendResponse = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })

      if (!resendResponse.ok) {
        const errorBody = await resendResponse.text()
        throw new Error(`Resend batch failed (${resendResponse.status}): ${errorBody}`)
      }

      const ids = group.map((subscriber) => subscriber.id)
      const { error: updateError } = await admin
        .from('launch_waitlist')
        .update({ notified_at: new Date().toISOString() })
        .in('id', ids)
      if (updateError) throw updateError
      sent += group.length
    }

    const { count: remaining, error: countError } = await admin
      .from('launch_waitlist')
      .select('id', { count: 'exact', head: true })
      .is('notified_at', null)
      .is('unsubscribed_at', null)
    if (countError) throw countError

    return json({ sent, remaining: remaining ?? 0 })
  } catch (error) {
    console.error(error)
    return json({ error: error instanceof Error ? error.message : 'Launch email failed.' }, 500)
  }
})
