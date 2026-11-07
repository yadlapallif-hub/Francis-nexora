import { z } from 'zod'

const text = (limit: number) => z.string().max(limit)
export const resumeSchema = z.object({
  name: text(100), role: text(120), email: text(160), phone: text(80), location: text(100), website: text(180),
  summary: text(1800), skills: text(800),
  experience: z.array(z.object({ id: text(80), role: text(120), company: text(120), dates: text(100), details: text(1800) })).max(8),
  education: z.array(z.object({ id: text(80), qualification: text(120), school: text(120), dates: text(100) })).max(8),
})
export type ResumeData = z.infer<typeof resumeSchema>
export const emptyResume = (): ResumeData => ({ name: '', role: '', email: '', phone: '', location: '', website: '', summary: '', skills: '', experience: [], education: [] })
export const certificateSchema = z.object({
  heading: text(120), recipient: text(120), subtitle: text(200), achievement: text(200), issuer: text(120), date: text(20), signature: text(120), certificateId: text(80),
  design: z.enum(['classic', 'modern']), accent: z.enum(['emerald', 'navy', 'plum']),
})
export type CertificateData = z.infer<typeof certificateSchema>
export const emptyCertificate = (): CertificateData => ({ heading: 'Certificate of Achievement', recipient: '', subtitle: 'This certificate is proudly presented to', achievement: '', issuer: '', date: new Date().toISOString().slice(0, 10), signature: '', certificateId: '', design: 'classic', accent: 'emerald' })
export type StudioKind = 'resume' | 'certificate'
export type StudioDocument = { id: string; title: string; data: unknown; updated_at: string }
export const colors = { emerald: '#18624c', navy: '#1b3553', plum: '#5a3b67' } as const

export function printableDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return date
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(parsed)
}

export function printDocument(orientation: 'portrait' | 'landscape') {
  const style = document.createElement('style')
  style.textContent = `@page { size: A4 ${orientation}; margin: ${orientation === 'portrait' ? '12mm' : '8mm'}; }`
  document.head.appendChild(style)
  const cleanup = () => { style.remove(); window.removeEventListener('afterprint', cleanup) }
  window.addEventListener('afterprint', cleanup, { once: true })
  try { window.print() } catch (error) { cleanup(); throw error }
  // Some browsers do not fire afterprint when the dialog is cancelled.
  window.setTimeout(cleanup, 60_000)
}

function wrapText(ctx: CanvasRenderingContext2D, textValue: string, width: number): string[] {
  const words = textValue.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > width) { lines.push(line); line = word } else line = candidate
  }
  if (line) lines.push(line)
  return lines
}

/** A local high-resolution PNG; no user text or image leaves the browser. */
export async function createCertificatePng(data: CertificateData): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = 2000; canvas.height = 1414
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Your browser cannot create an image. Try Print / Save PDF instead.')
  const ctx: CanvasRenderingContext2D = context
  const accent = colors[data.accent]
  ctx.fillStyle = data.design === 'classic' ? '#fffdf6' : '#f8faf9'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = accent; ctx.lineWidth = 7; ctx.strokeRect(64, 64, 1872, 1286)
  ctx.lineWidth = 2; ctx.strokeRect(86, 86, 1828, 1242)
  ctx.fillStyle = accent; ctx.textAlign = 'center'
  ctx.font = '700 27px sans-serif'; ctx.fillText('✦   N E X O R A   S T U D I O   ✦', 1000, 185)
  // Fit every line in its allocated area; never silently discard long content.
  function lines(value: string, size: number, family: string, style: string, y: number, lineHeight: number, maxWidth: number, maxLines: number, color: string) {
    let rows: string[] = []
    let fittedSize = size
    for (; fittedSize >= 14; fittedSize -= 2) {
      ctx.font = `${style} ${fittedSize}px ${family}`.trim()
      rows = wrapText(ctx, value, maxWidth)
      if (rows.length <= maxLines) break
    }
    if (rows.length > maxLines) throw new Error('Some certificate text is too long for the PNG. Please shorten it or use Print / Save PDF.')
    ctx.fillStyle = color
    rows.forEach((row, i) => ctx.fillText(row, 1000, y + i * lineHeight * (fittedSize / size), maxWidth))
  }
  lines(data.heading || 'Certificate of Achievement', 72, 'Georgia, serif', '700', 315, 85, 1550, 2, '#1a2a25')
  lines(data.subtitle || 'This certificate is proudly presented to', 30, 'sans-serif', '', 490, 40, 1450, 2, '#61716b')
  lines(data.recipient || 'Recipient name', 80, 'Georgia, serif', 'italic', 620, 95, 1450, 2, accent)
  ctx.strokeStyle = '#cbd8cf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(470, 745); ctx.lineTo(1530, 745); ctx.stroke()
  lines(data.achievement || 'For an outstanding achievement', 32, 'sans-serif', '', 830, 45, 1300, 3, '#485b52')
  ctx.font = '26px sans-serif'; ctx.fillStyle = '#50625a'
  ctx.fillText(data.issuer || 'Issuing organization', 600, 1150, 650)
  ctx.fillText(printableDate(data.date) || 'Date', 1400, 1150, 550)
  ctx.font = '21px sans-serif'; ctx.fillStyle = '#89978f'
  ctx.fillText(data.signature || 'ISSUED BY', 600, 1200, 650)
  ctx.fillText(data.certificateId ? `ID: ${data.certificateId}` : 'DATE OF ISSUE', 1400, 1200, 550)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the image.')), 'image/png'))
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove()
  // Allow the browser time to start the download before releasing its object URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
