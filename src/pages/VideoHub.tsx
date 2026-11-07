import { useEffect, useRef, useState } from 'react'
import { Download, FileVideo, Film, LockKeyhole, Scissors, UploadCloud, Volume2 } from 'lucide-react'
import { downloadBlob } from '../lib/studio'
import { canExportVideo, MAX_CLIP_SECONDS, MAX_VIDEO_BYTES, trimVideo, validateTrim } from '../lib/video'
import { PageTitle, Notice, Spinner } from '../components/UI'
import { StudioNote } from '../components/StudioCommon'

export function VideoHub() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState('0')
  const [end, setEnd] = useState('')
  const [includeAudio, setIncludeAudio] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [supported] = useState(canExportVideo)
  const abort = useRef<AbortController | null>(null)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false; abort.current?.abort() } }, [])
  useEffect(() => {
    if (!file) { setUrl(''); return }
    const next = URL.createObjectURL(file); setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen) return
    abort.current?.abort(); setError(''); setMessage(''); setDuration(0); setStart('0'); setEnd(''); setProgress(0)
    if (!chosen.type.startsWith('video/')) { setFile(null); setError('Please choose a video file supported by your browser.'); return }
    if (chosen.size > MAX_VIDEO_BYTES) { setFile(null); setError('Choose a video under 200 MB.'); return }
    setFile(chosen)
  }
  const startSeconds = Number(start); const endSeconds = Number(end)
  const rangeError = file && duration && start !== '' && end !== '' ? validateTrim(startSeconds, endSeconds, duration) : null
  const canExport = Boolean(file && url && supported && duration > 0 && start !== '' && end !== '' && !rangeError && !exporting)
  async function exportClip() {
    if (!file || !url || !canExport) return
    const controller = new AbortController(); abort.current = controller; setExporting(true); setProgress(0); setError(''); setMessage('')
    try {
      const result = await trimVideo({ src: url, start: startSeconds, end: endSeconds, duration, includeAudio, signal: controller.signal, onProgress: (value) => { if (alive.current) setProgress(value) } })
      if (controller.signal.aborted || !alive.current) return
      const stem = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'nexora-video'
      downloadBlob(result, `${stem}-trimmed.webm`); setMessage('Your trimmed WebM download has started.')
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Could not export this clip.')
      else if (alive.current) setMessage('Export cancelled. No file was downloaded.')
    } finally { if (alive.current) { setExporting(false); abort.current = null } }
  }
  return <div className="page-content studio-page"><PageTitle eyebrow="CREATE IN YOUR OWN SPACE" title="Video Editing Hub." description="Trim a clip right in your browser. Your video stays on this device." />
    <StudioNote><LockKeyhole size={16} /> Local processing only: videos are not uploaded or saved to NEXORA. Export is a re-encoded WebM clip, not an MP4.</StudioNote>
    <div className="video-grid"><div className="studio-editor-column"><section className="panel video-editor"><div className="studio-section-head"><span className="studio-section-icon"><Film size={18} /></span><div><span className="section-kicker">START WITH A CLIP</span><h2>Choose your video</h2></div></div><label className="video-upload"><UploadCloud size={25} /><strong>{file ? 'Choose a different video' : 'Select a video file'}</strong><span>Up to 200 MB · processed in your browser</span><input type="file" aria-label="Select video file" accept="video/*" onChange={choose} disabled={exporting} /></label>{file && <div className="video-file"><FileVideo size={17} /><span><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} MB {duration ? `· ${duration.toFixed(1)} seconds` : '· reading duration…'}</small></span></div>}</section>
      <section className="panel video-editor"><div className="studio-section-head"><span className="studio-section-icon"><Scissors size={18} /></span><div><span className="section-kicker">A SIMPLE CUT</span><h2>Trim your clip</h2></div></div><p className="video-help">Enter start and end times in seconds. Clips can be up to {MAX_CLIP_SECONDS} seconds; cuts are approximate.</p><div className="studio-form-grid"><label>Start time (seconds)<input type="number" inputMode="decimal" min={0} max={duration || undefined} step="0.1" value={start} disabled={!duration || exporting} onChange={(e) => setStart(e.target.value)} /></label><label>End time (seconds)<input type="number" inputMode="decimal" min={0} max={duration || undefined} step="0.1" value={end} disabled={!duration || exporting} onChange={(e) => setEnd(e.target.value)} /></label></div><label className="video-audio"><input type="checkbox" checked={includeAudio} disabled={exporting} onChange={(e) => setIncludeAudio(e.target.checked)} /><Volume2 size={16} /> Include original audio when supported</label>{rangeError && <Notice tone="error">{rangeError}</Notice>}{!supported && <Notice tone="error">WebM export is not supported by this browser. Try a recent desktop Chrome or Edge browser.</Notice>}{error && <Notice tone="error">{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
      {exporting && <div className="video-progress"><progress max={1} value={progress} aria-label="Video export progress" /><span>{Math.round(progress * 100)}% · Keep this tab open</span></div>}<div className="video-buttons"><button className="button button-primary" disabled={!canExport} onClick={() => void exportClip()}>{exporting ? <Spinner /> : <Download size={16} />} {exporting ? 'Exporting in real time…' : 'Export trimmed WebM'}</button>{exporting && <button className="button button-secondary" onClick={() => abort.current?.abort()}>Cancel export</button>}</div><p className="video-help">Export takes roughly the clip’s duration. Advanced timelines, effects, and MP4 export are not available yet.</p></section></div>
      <section className="panel video-preview-panel"><div className="studio-preview-label"><span><span className="status-dot status-connected" /> VIDEO PREVIEW</span><small>Local file</small></div>{url ? <video key={url} src={url} controls playsInline onLoadedMetadata={(e) => { const value = e.currentTarget.duration; if (!Number.isFinite(value) || value <= 0) { setError('This browser could not read the video duration. Try another format.'); return }; setDuration(value); setEnd(String(Math.floor(Math.min(value, MAX_CLIP_SECONDS) * 10) / 10 || value)) }} onError={() => setError('This browser cannot play that video format. Try another file.')} /> : <div className="video-placeholder"><span><Film size={28} /></span><h2>Your video goes here.</h2><p>Choose a file to preview and trim it without uploading.</p></div>}<div className="video-preview-footer"><Scissors size={16} /><span><strong>Trim at your own pace</strong><small>Preview the original here; the downloaded file contains your selected range.</small></span></div></section>
    </div>
  </div>
}
