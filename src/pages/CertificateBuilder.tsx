import { useState, type CSSProperties } from 'react'
import { Award, Download, ImageDown, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStudioDocs } from '../hooks/useStudioDocs'
import { certificateSchema, colors, createCertificatePng, downloadBlob, emptyCertificate, printDocument, printableDate, type CertificateData, type StudioDocument } from '../lib/studio'
import { SavedDrafts, StudioNote } from '../components/StudioCommon'
import { PageTitle, Spinner } from '../components/UI'

export function CertificateBuilder() {
  const { session } = useAuth()
  return <CertificateEditor key={session?.user.id || 'guest'} />
}
// Font sizes scale with the landscape sheet so long text stays inside the design.
function fitSize(value: string, max: number, capacity: number) { return `${Math.min(max, capacity / Math.max(1, value.length))}cqw` }
function CertificateEditor() {
  const drafts = useStudioDocs('certificate')
  const [data, setData] = useState<CertificateData>(emptyCertificate)
  const [dirty, setDirty] = useState(false)
  const [exporting, setExporting] = useState(false)
  const change = (patch: Partial<CertificateData>) => { setData((current) => ({ ...current, ...patch })); setDirty(true) }
  const confirmReplace = () => !dirty || window.confirm('Discard unsaved changes in the editor?')
  const onNew = () => { if (confirmReplace()) { setData(emptyCertificate()); drafts.startNew(); setDirty(false) } }
  const onLoad = (doc: StudioDocument) => {
    if (!confirmReplace()) return
    const parsed = certificateSchema.safeParse(doc.data)
    if (!parsed.success) { drafts.setError('This saved certificate has an unsupported format.'); return }
    setData(parsed.data); drafts.select(doc.id); setDirty(false)
  }
  const save = async () => {
    if (!drafts.session && dirty && !window.confirm('Signing in will reset this guest draft. Print or download a copy first if needed. Continue to sign in?')) return
    if (!certificateSchema.safeParse(data).success) { drafts.setError('Please check the length of the certificate fields.'); return }
    if (await drafts.save(data, data.recipient.trim() ? `${data.recipient.trim().slice(0, 92)} — Certificate` : 'Untitled certificate')) setDirty(false)
  }
  const exportPng = async () => {
    setExporting(true)
    try { downloadBlob(await createCertificatePng(data), 'nexora-certificate.png') }
    catch (error) { drafts.setError(error instanceof Error ? error.message : 'Could not create the PNG.') }
    finally { setExporting(false) }
  }
  return <div className="page-content studio-page"><PageTitle eyebrow="CELEBRATE THE MOMENT" title="Certificate Studio." description="Create a thoughtful certificate for an achievement worth recognizing." action={<div className="studio-actions"><button className="button button-secondary" onClick={() => void save()} disabled={drafts.saving}>{drafts.saving ? <Spinner /> : <Save size={15} />} Save draft</button><button className="button button-secondary" onClick={() => void exportPng()} disabled={exporting}>{exporting ? <Spinner /> : <ImageDown size={15} />} Download PNG</button><button className="button button-primary" onClick={() => printDocument('landscape')}><Download size={15} /> Print / Save PDF</button></div>} />
    <StudioNote><Award size={16} /> Create a design locally, or sign in to save a draft. Certificates are designs only; they are not automatically accredited or verified. {drafts.session ? 'Drafts do not autosave; save before leaving.' : 'Guest edits reset when you sign in or leave; sign in before editing to save drafts.'}</StudioNote>
    <div className="studio-grid certificate-grid"><div className="studio-editor-column"><section className="panel studio-editor"><div className="studio-section-head"><span className="studio-section-icon"><Award size={18} /></span><div><span className="section-kicker">MAKE IT PERSONAL</span><h2>Certificate details</h2></div></div><div className="studio-form-grid">
      <label className="studio-form-wide">Certificate title<input value={data.heading} maxLength={120} onChange={(e) => change({ heading: e.target.value })} /></label>
      <label className="studio-form-wide">Recipient name<input value={data.recipient} maxLength={120} placeholder="Who is this for?" onChange={(e) => change({ recipient: e.target.value })} /></label>
      <label className="studio-form-wide">Introduction<input value={data.subtitle} maxLength={200} onChange={(e) => change({ subtitle: e.target.value })} /></label>
      <label className="studio-form-wide">Achievement or course<textarea rows={3} value={data.achievement} maxLength={200} placeholder="What are they being recognized for?" onChange={(e) => change({ achievement: e.target.value })} /></label>
      <label>Issuing organization<input value={data.issuer} maxLength={120} placeholder="Organization name" onChange={(e) => change({ issuer: e.target.value })} /></label><label>Issue date<input type="date" value={data.date} maxLength={20} onChange={(e) => change({ date: e.target.value })} /></label>
      <label>Signature / title<input value={data.signature} maxLength={120} placeholder="Optional" onChange={(e) => change({ signature: e.target.value })} /></label><label>Certificate ID<input value={data.certificateId} maxLength={80} placeholder="Optional, supplied by you" onChange={(e) => change({ certificateId: e.target.value })} /></label>
    </div></section><section className="panel studio-editor"><div className="studio-section-head"><span className="studio-section-icon"><Award size={18} /></span><div><span className="section-kicker">THE FINISHING TOUCH</span><h2>Choose a style</h2></div></div><div className="studio-form-grid"><label>Design<select value={data.design} onChange={(e) => change({ design: e.target.value as CertificateData['design'] })}><option value="classic">Classic</option><option value="modern">Modern</option></select></label><label>Accent color<select value={data.accent} onChange={(e) => change({ accent: e.target.value as CertificateData['accent'] })}><option value="emerald">Emerald</option><option value="navy">Navy</option><option value="plum">Plum</option></select></label></div></section><SavedDrafts drafts={drafts} onLoad={onLoad} onNew={onNew} /></div>
    <aside className="studio-preview-column"><div className="studio-preview-label"><span><span className="status-dot status-connected" /> LIVE PREVIEW</span><small>A4 · Landscape</small></div><div className={`certificate-paper certificate-${data.design} print-area`} style={{ '--certificate-accent': colors[data.accent], '--cert-heading': fitSize(data.heading || 'Certificate of Achievement', 4.8, 135), '--cert-subtitle': fitSize(data.subtitle || 'This certificate is proudly presented to', 1.9, 130), '--cert-recipient': fitSize(data.recipient || 'Recipient name', 5.5, 135), '--cert-achievement': fitSize(data.achievement || 'For an outstanding achievement', 2, 200), '--cert-issuer': fitSize(data.issuer || 'Issuing organization', 1.6, 55), '--cert-signature': fitSize(data.signature || 'ISSUED BY', 1.25, 55), '--cert-id': fitSize(data.certificateId || 'DATE OF ISSUE', 1.25, 50) } as CSSProperties}><div className="certificate-frame"><div className="certificate-brand">✦ &nbsp; N E X O R A &nbsp; S T U D I O &nbsp; ✦</div><h2>{data.heading || 'Certificate of Achievement'}</h2><p className="certificate-subtitle">{data.subtitle || 'This certificate is proudly presented to'}</p><div className="certificate-recipient">{data.recipient || 'Recipient name'}</div><div className="certificate-rule" /><p className="certificate-achievement">{data.achievement || 'For an outstanding achievement'}</p><div className="certificate-signatures"><div><strong className="certificate-issuer">{data.issuer || 'Issuing organization'}</strong><small className="certificate-signature">{data.signature || 'ISSUED BY'}</small></div><div><strong>{printableDate(data.date) || 'Date'}</strong><small className="certificate-id">{data.certificateId ? `ID: ${data.certificateId}` : 'DATE OF ISSUE'}</small></div></div></div></div><p className="preview-foot">For PDF, choose “Save as PDF” in the print dialog. PNG is generated in your browser. Long text is scaled to fit; review readability before printing.</p></aside></div>
  </div>
}
