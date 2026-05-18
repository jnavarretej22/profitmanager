import { google } from "googleapis"

// Variables de entorno requeridas para la integración con Google
const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     ?? ""
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
const REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI  ?? `${process.env.NEXTAUTH_URL}/api/google/callback`

// CRÍTICO: esta variable DEBE estar configurada en producción
const ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
if (!ENCRYPTION_KEY && process.env.NODE_ENV === "production") {
  throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY es requerida en producción")
}
const ENCRYPTION_KEY_SAFE = ENCRYPTION_KEY ?? "dev-only-key-not-for-prod-use-32c"

// ── Cifrado simple del token (AES-GCM vía Web Crypto) ──────────────────────
// Se cifra antes de guardar en DB y se descifra al leer.
// En producción usa una llave de al menos 256 bits.

function getKeyMaterial(key: string): Uint8Array {
  const enc = new TextEncoder()
  return enc.encode(key.padEnd(32, "0").slice(0, 32))
}

export async function cifrarToken(token: object): Promise<string> {
  const keyMaterial = getKeyMaterial(ENCRYPTION_KEY_SAFE)
  const iv = Buffer.from(crypto.getRandomValues(new Uint8Array(12)))
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyMaterial.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  )
  const encoded = Buffer.from(JSON.stringify(token))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    cryptoKey,
    encoded.buffer as ArrayBuffer
  )
  const combined = Buffer.concat([iv, Buffer.from(ciphertext)])
  return combined.toString("base64")
}

export async function descifrarToken(encryptedBase64: string): Promise<object | null> {
  try {
    const keyMaterial = getKeyMaterial(ENCRYPTION_KEY_SAFE)
    const combined = Buffer.from(encryptedBase64, "base64")
    const iv = combined.subarray(0, 12)
    const ciphertext = combined.subarray(12)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial.buffer as ArrayBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    )
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: (iv as Buffer).buffer as ArrayBuffer },
      cryptoKey,
      (ciphertext as Buffer).buffer as ArrayBuffer
    )
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}

// ── OAuth2 Client ──────────────────────────────────────────────────────────

export function crearOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
}

export function generarUrlAutorizacion(): string {
  const oAuth2Client = crearOAuthClient()
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  })
}

// ── Crear evento con Meet en Google Calendar ──────────────────────────────

interface CitaData {
  titulo: string
  descripcion?: string
  fechaInicio: Date
  fechaFin: Date
  zonaHoraria?: string
}

interface ResultadoEvento {
  meet_link: string
  google_event_id: string
}

export async function crearEventoConMeet(
  tokenCifrado: string,
  cita: CitaData
): Promise<ResultadoEvento | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokenData = await descifrarToken(tokenCifrado) as any
    if (!tokenData) return null

    const oAuth2Client = crearOAuthClient()
    oAuth2Client.setCredentials(tokenData)

    // Refrescar token si está vencido
    if (tokenData.expiry_date && tokenData.expiry_date < Date.now()) {
      const { credentials } = await oAuth2Client.refreshAccessToken()
      oAuth2Client.setCredentials(credentials)
    }

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client })

    const event = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: cita.titulo,
        description: cita.descripcion,
        start: {
          dateTime: cita.fechaInicio.toISOString(),
          timeZone: cita.zonaHoraria ?? "America/Guayaquil",
        },
        end: {
          dateTime: cita.fechaFin.toISOString(),
          timeZone: cita.zonaHoraria ?? "America/Guayaquil",
        },
        conferenceData: {
          createRequest: {
            requestId: `profitmanager-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    })

    const meetLink = event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri

    if (!meetLink || !event.data.id) return null

    return { meet_link: meetLink, google_event_id: event.data.id }
  } catch (err) {
    console.error("Error creando evento Google Calendar:", err)
    return null
  }
}
