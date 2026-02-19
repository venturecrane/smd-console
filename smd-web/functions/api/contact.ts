/// <reference types="@cloudflare/workers-types" />

interface Env {
  RESEND_API_KEY: string
}

interface ContactPayload {
  name: string
  email: string
  message: string
  website?: string
}

const ALLOWED_ORIGINS = ['https://smdurgan.com', 'https://www.smdurgan.com']
const TO_EMAIL = 'smdurgan@smdurgan.com'
const FROM_EMAIL = 'SMDurgan, LLC <contact@smdurgan.com>'
const CONTROL_CHAR_RE = /[\r\n\0]/

function hasControlChars(value: string): boolean {
  return CONTROL_CHAR_RE.test(value)
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (!local || !domain) return false
  if (!domain.includes('.')) return false
  return true
}

function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body)
  const result: Record<string, string> = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

function redirectTo(path: string, requestUrl: string): Response {
  return Response.redirect(new URL(path, requestUrl).toString(), 303)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  const origin = request.headers.get('Origin')
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const contentType = request.headers.get('Content-Type') || ''
  const isJson = contentType.includes('application/json')
  const isForm = contentType.includes('application/x-www-form-urlencoded')

  if (!isJson && !isForm) {
    return new Response(JSON.stringify({ error: 'Unsupported content type' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let data: ContactPayload
  try {
    const raw = await request.text()
    if (isJson) {
      data = JSON.parse(raw) as ContactPayload
    } else {
      const parsed = parseFormData(raw)
      data = {
        name: parsed.name || '',
        email: parsed.email || '',
        message: parsed.message || '',
        website: parsed.website || '',
      }
    }
  } catch {
    return isForm
      ? redirectTo('/contact/#error-validation', request.url)
      : new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
  }

  if (data.website) {
    return isForm
      ? redirectTo('/contact/#sent', request.url)
      : new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
  }

  const errors: Record<string, string> = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required'
  } else if (data.name.length > 200 || hasControlChars(data.name)) {
    errors.name = 'Name is invalid'
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required'
  } else if (hasControlChars(data.email) || !isValidEmail(data.email.trim())) {
    errors.email = 'Email is invalid'
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.message = 'Message is required'
  } else if (
    data.message.length > 5000 ||
    hasControlChars(data.message.replace(/\n/g, ''))
  ) {
    errors.message = 'Message is invalid'
  }

  if (Object.keys(errors).length > 0) {
    return isForm
      ? redirectTo('/contact/#error-validation', request.url)
      : new Response(
          JSON.stringify({ error: 'Validation failed', fields: errors }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
  }

  const name = data.name.trim()
  const email = data.email.trim()
  const message = data.message.trim()

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        reply_to: email,
        subject: `SMD Contact: ${name}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('Resend API error', response.status, body)
      throw new Error('email send failed')
    }
  } catch (error) {
    console.error('Contact send failed', error)
    return isForm
      ? redirectTo('/contact/#error-server', request.url)
      : new Response(JSON.stringify({ error: 'Failed to send message' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
  }

  return isForm
    ? redirectTo('/contact/#sent', request.url)
    : new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
}

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    })
  }

  return new Response(null, { status: 404 })
}
