import { useState } from 'react'
import { BriefcaseBusiness, Download, FileText, GraduationCap, Plus, Save, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStudioDocs } from '../hooks/useStudioDocs'
import { emptyResume, printDocument, resumeSchema, type ResumeData, type StudioDocument } from '../lib/studio'
import { SavedDrafts, StudioFeedback, StudioNote } from '../components/StudioCommon'
import { PageTitle, Spinner } from '../components/UI'

export function ResumeBuilder() {
  const { session } = useAuth()
  return <ResumeEditor key={session?.user.id || 'guest'} />
}
function ResumeEditor() {
  const drafts = useStudioDocs('resume')
  const [data, setData] = useState<ResumeData>(emptyResume)
  const [dirty, setDirty] = useState(false)
  const change = (patch: Partial<ResumeData>) => { setData((current) => ({ ...current, ...patch })); setDirty(true); drafts.clearFeedback() }
  const confirmReplace = () => !dirty || window.confirm('Discard unsaved changes in the editor?')
  const onNew = () => { if (confirmReplace()) { setData(emptyResume()); drafts.startNew(); setDirty(false) } }
  const onLoad = (doc: StudioDocument) => {
    if (!confirmReplace()) return
    const parsed = resumeSchema.safeParse(doc.data)
    if (!parsed.success) { drafts.setError('This saved resume has an unsupported format.'); return }
    setData(parsed.data); drafts.select(doc.id); setDirty(false)
  }
  const save = async () => {
    if (!drafts.session && dirty && !window.confirm('Signing in will reset this guest draft. Print or download a copy first if needed. Continue to sign in?')) return
    if (!resumeSchema.safeParse(data).success) { drafts.setError('Please check the length of your resume fields.'); return }
    if (await drafts.save(data, data.name.trim() ? `${data.name.trim().slice(0, 100)} — Resume` : 'Untitled resume')) setDirty(false)
  }
  const updateExperience = (id: string, patch: Partial<ResumeData['experience'][number]>) => change({ experience: data.experience.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const updateEducation = (id: string, patch: Partial<ResumeData['education'][number]>) => change({ education: data.education.map((item) => item.id === id ? { ...item, ...patch } : item) })
  return <div className="page-content studio-page"><PageTitle eyebrow="CREATE WITH CONFIDENCE" title="Resume Builder." description="Turn your experience into a clear, polished resume." action={<div className="studio-actions"><button className="button button-secondary" onClick={() => void save()} disabled={drafts.saving}>{drafts.saving ? <Spinner /> : <Save size={15} />} Save draft</button><button className="button button-primary" onClick={() => printDocument('portrait')}><Download size={15} /> Print / Save PDF</button></div>} />
    <StudioNote><FileText size={16} /> Edit on the left, preview on the right. Choose “Save as PDF” in your browser’s print dialog. {drafts.session ? 'Drafts do not autosave; save to your account before leaving.' : 'Guest edits reset when you sign in or leave; sign in before editing to save drafts.'}</StudioNote>
    <StudioFeedback drafts={drafts} />
    <div className="studio-grid"><fieldset className="studio-editor-column" disabled={drafts.saving}><section className="panel studio-editor"><div className="studio-section-head"><span className="studio-section-icon"><FileText size={18} /></span><div><span className="section-kicker">THE ESSENTIALS</span><h2>Personal details</h2></div></div><div className="studio-form-grid">
      <label>Full name<input value={data.name} maxLength={100} placeholder="Your full name" onChange={(e) => change({ name: e.target.value })} /></label><label>Professional title<input value={data.role} maxLength={120} placeholder="e.g. Product designer" onChange={(e) => change({ role: e.target.value })} /></label>
      <label>Email<input type="email" value={data.email} maxLength={160} placeholder="you@example.com" onChange={(e) => change({ email: e.target.value })} /></label><label>Phone<input value={data.phone} maxLength={80} placeholder="Optional" onChange={(e) => change({ phone: e.target.value })} /></label>
      <label>Location<input value={data.location} maxLength={100} placeholder="City, country" onChange={(e) => change({ location: e.target.value })} /></label><label>Website or portfolio<input value={data.website} maxLength={180} placeholder="Optional" onChange={(e) => change({ website: e.target.value })} /></label>
      <label className="studio-form-wide">Professional summary<textarea rows={4} maxLength={1800} value={data.summary} placeholder="A short introduction to your strengths and goals." onChange={(e) => change({ summary: e.target.value })} /></label>
      <label className="studio-form-wide">Skills<textarea rows={3} maxLength={800} value={data.skills} placeholder="e.g. Research, project management, communication" onChange={(e) => change({ skills: e.target.value })} /></label>
    </div></section>
    <section className="panel studio-editor"><div className="studio-section-head"><span className="studio-section-icon"><BriefcaseBusiness size={18} /></span><div><span className="section-kicker">YOUR JOURNEY</span><h2>Experience</h2></div><button className="button button-secondary button-small" disabled={data.experience.length >= 8} onClick={() => change({ experience: [...data.experience, { id: crypto.randomUUID(), role: '', company: '', dates: '', details: '' }] })}><Plus size={14} /> Add</button></div>
      {!data.experience.length && <p className="studio-empty">Add roles, projects, or internships that tell your story.</p>}{data.experience.map((item, index) => <div className="repeat-editor" key={item.id}><div className="repeat-heading"><strong>Experience {index + 1}</strong><button className="icon-button" aria-label={`Remove experience ${index + 1}`} onClick={() => change({ experience: data.experience.filter((row) => row.id !== item.id) })}><Trash2 size={15} /></button></div><div className="studio-form-grid"><label>Role {index + 1}<input value={item.role} maxLength={120} onChange={(e) => updateExperience(item.id, { role: e.target.value })} /></label><label>Company {index + 1}<input value={item.company} maxLength={120} onChange={(e) => updateExperience(item.id, { company: e.target.value })} /></label><label className="studio-form-wide">Dates {index + 1}<input value={item.dates} maxLength={100} placeholder="e.g. 2022 – Present" onChange={(e) => updateExperience(item.id, { dates: e.target.value })} /></label><label className="studio-form-wide">Highlights {index + 1}<textarea rows={3} maxLength={1800} value={item.details} placeholder="Describe your contributions and results." onChange={(e) => updateExperience(item.id, { details: e.target.value })} /></label></div></div>)}
    </section>
    <section className="panel studio-editor"><div className="studio-section-head"><span className="studio-section-icon"><GraduationCap size={18} /></span><div><span className="section-kicker">YOUR FOUNDATION</span><h2>Education</h2></div><button className="button button-secondary button-small" disabled={data.education.length >= 8} onClick={() => change({ education: [...data.education, { id: crypto.randomUUID(), qualification: '', school: '', dates: '' }] })}><Plus size={14} /> Add</button></div>
      {!data.education.length && <p className="studio-empty">Add qualifications, courses, or certifications.</p>}{data.education.map((item, index) => <div className="repeat-editor" key={item.id}><div className="repeat-heading"><strong>Education {index + 1}</strong><button className="icon-button" aria-label={`Remove education ${index + 1}`} onClick={() => change({ education: data.education.filter((row) => row.id !== item.id) })}><Trash2 size={15} /></button></div><div className="studio-form-grid"><label>Qualification {index + 1}<input value={item.qualification} maxLength={120} onChange={(e) => updateEducation(item.id, { qualification: e.target.value })} /></label><label>Institution {index + 1}<input value={item.school} maxLength={120} onChange={(e) => updateEducation(item.id, { school: e.target.value })} /></label><label className="studio-form-wide">Education dates {index + 1}<input value={item.dates} maxLength={100} onChange={(e) => updateEducation(item.id, { dates: e.target.value })} /></label></div></div>)}
    </section><SavedDrafts drafts={drafts} onLoad={onLoad} onNew={onNew} /></fieldset>
    <aside className="studio-preview-column"><div className="studio-preview-label"><span><span className="status-dot status-connected" /> LIVE PREVIEW</span><small>A4 · Print-ready</small></div><div className="resume-paper print-area"><header><span className="resume-accent-line" /><h2>{data.name || <span className="print-placeholder">Your name</span>}</h2><h3>{data.role || <span className="print-placeholder">Your professional title</span>}</h3><p>{[data.email, data.phone, data.location, data.website].filter(Boolean).join('  •  ') || <span className="print-placeholder">Email  •  Phone  •  Location</span>}</p></header>
      {data.summary && <section><h3>Profile</h3><p>{data.summary}</p></section>}
      {data.experience.length > 0 && <section><h3>Experience</h3>{data.experience.map((item) => <div className="resume-entry" key={item.id}><div><strong>{item.role || <span className="print-placeholder">Role</span>}</strong><span>{item.dates}</span></div><em>{item.company}</em>{item.details && <p>{item.details}</p>}</div>)}</section>}
      {data.education.length > 0 && <section><h3>Education</h3>{data.education.map((item) => <div className="resume-entry" key={item.id}><div><strong>{item.qualification || <span className="print-placeholder">Qualification</span>}</strong><span>{item.dates}</span></div><em>{item.school}</em></div>)}</section>}
      {data.skills && <section><h3>Skills</h3><p>{data.skills}</p></section>}
      {!data.summary && !data.experience.length && !data.education.length && !data.skills && <div className="resume-placeholder print-placeholder">Your story starts here. Add your details to see them appear on the page.</div>}
    </div><p className="preview-foot">Your preview may span multiple pages when printed. Review the print dialog before saving.</p></aside></div>
  </div>
}
