import fixWebmDuration from 'fix-webm-duration'

export const MAX_VIDEO_BYTES = 200 * 1024 * 1024
export const MAX_CLIP_SECONDS = 120

type CapturableVideo = HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }
export function supportedVideoMime(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return null
  return ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type)) || null
}
export function canExportVideo(): boolean {
  if (typeof document === 'undefined' || !supportedVideoMime()) return false
  const video = document.createElement('video') as CapturableVideo
  return typeof video.captureStream === 'function' || typeof video.mozCaptureStream === 'function'
}
export function validateTrim(start: number, end: number, duration: number): string | null {
  if (![start, end, duration].every(Number.isFinite) || duration <= 0) return 'The video duration could not be read.'
  if (start < 0 || end > duration || end <= start) return 'Choose a start and end within the video, with the end after the start.'
  if (end - start > MAX_CLIP_SECONDS) return `Choose a clip of ${MAX_CLIP_SECONDS} seconds or less.`
  return null
}
function aborted() { return new DOMException('Export cancelled.', 'AbortError') }
function mediaEvent(video: HTMLVideoElement, eventName: string, signal: AbortSignal, timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer = 0
    const cleanup = () => { window.clearTimeout(timer); video.removeEventListener(eventName, done); video.removeEventListener('error', failed); signal.removeEventListener('abort', cancel) }
    const done = () => { cleanup(); resolve() }
    const failed = () => { cleanup(); reject(new Error('This browser could not read the video. Try a different format.')) }
    const cancel = () => { cleanup(); reject(aborted()) }
    if (signal.aborted) return cancel()
    video.addEventListener(eventName, done, { once: true }); video.addEventListener('error', failed, { once: true }); signal.addEventListener('abort', cancel, { once: true })
    timer = window.setTimeout(() => { cleanup(); reject(new Error('The video took too long to load.')) }, timeout)
  })
}

/** Trims by re-recording in real time, using only browser media APIs. No upload takes place. */
export async function trimVideo(options: { src: string; start: number; end: number; duration: number; includeAudio: boolean; signal: AbortSignal; onProgress: (ratio: number) => void }): Promise<Blob> {
  const { src, start, end, duration, includeAudio, signal, onProgress } = options
  const invalid = validateTrim(start, end, duration)
  if (invalid) throw new Error(invalid)
  const mimeType = supportedVideoMime()
  if (!mimeType || !canExportVideo()) throw new Error('This browser cannot export WebM clips. Try a recent desktop Chrome or Edge browser.')
  if (signal.aborted) throw aborted()
  const video = document.createElement('video') as CapturableVideo
  video.preload = 'auto'; video.muted = true; video.playsInline = true
  let stream: MediaStream | undefined
  let recorder: MediaRecorder | undefined
  try {
    const metadata = mediaEvent(video, 'loadedmetadata', signal)
    video.src = src; video.load(); await metadata
    if (start > 0) { const seek = mediaEvent(video, 'seeked', signal); video.currentTime = start; await seek }
    const capture = video.captureStream || video.mozCaptureStream
    if (!capture) throw new Error('This browser cannot capture video for export.')
    stream = capture.call(video)
    if (!stream.getVideoTracks().length) throw new Error('This video format cannot be exported in this browser.')
    if (!includeAudio) for (const track of stream.getAudioTracks()) { stream.removeTrack(track); track.stop() }
    const chunks: BlobPart[] = []
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 })
    const stopped = new Promise<void>((resolve, reject) => {
      recorder!.addEventListener('dataavailable', (event) => { if (event.data.size) chunks.push(event.data) })
      recorder!.addEventListener('stop', () => resolve(), { once: true })
      recorder!.addEventListener('error', () => reject(new Error('The browser could not record this clip.')), { once: true })
    })
    // Attach a rejection handler immediately; the stop promise is awaited in finally.
    void stopped.catch(() => {})
    recorder.start(250)
    const recordingStart = performance.now()
    let recordedDuration = 0
    try {
      await video.play()
      await new Promise<void>((resolve, reject) => {
        let timer = 0
        let timeout = 0
        const cleanup = () => { window.clearInterval(timer); window.clearTimeout(timeout); video.removeEventListener('ended', complete); video.removeEventListener('error', fail); signal.removeEventListener('abort', cancel) }
        const complete = () => { cleanup(); onProgress(1); resolve() }
        const fail = () => { cleanup(); reject(new Error('The video could not be played during export.')) }
        const cancel = () => { cleanup(); reject(aborted()) }
        if (signal.aborted) return cancel()
        video.addEventListener('ended', complete, { once: true }); video.addEventListener('error', fail, { once: true }); signal.addEventListener('abort', cancel, { once: true })
        timer = window.setInterval(() => { onProgress(Math.max(0, Math.min(1, (video.currentTime - start) / (end - start)))); if (video.currentTime >= end) complete() }, 80)
        timeout = window.setTimeout(() => { cleanup(); reject(new Error('Export timed out. Keep the tab open and try again.')) }, (end - start + 15) * 1000)
      })
    } finally {
      video.pause()
      recordedDuration = performance.now() - recordingStart
      if (recorder.state !== 'inactive') recorder.stop()
      await stopped
    }
    if (signal.aborted) throw aborted()
    const result = new Blob(chunks, { type: 'video/webm' })
    if (!result.size) throw new Error('The browser produced an empty clip. Try a different video.')
    // MediaRecorder's WebM often lacks a duration, making it unseekable in players.
    return await fixWebmDuration(result, recordedDuration, { logger: false })
  } finally {
    video.pause(); stream?.getTracks().forEach((track) => track.stop()); video.removeAttribute('src'); video.load()
  }
}
