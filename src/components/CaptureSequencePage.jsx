// src/components/CaptureSequencePage.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CaptureSequencePage.css'

export default function CaptureSequencePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { layout = 3, timer = 3, filter } = location.state || {}

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [photos, setPhotos] = useState([])
  const [ready, setReady] = useState(true)

  const LINGER_MS = 2000
  const READY_MS = 2000 // Show 'Get ready...' for 2 seconds

  // 1) Start camera
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.playsInline = true

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream
        return video.play()
      })
      .catch(err => console.error('Camera error:', err))

    return () => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 2) Kickoff each cycle or finish
  useEffect(() => {
    if (stepIndex >= layout) {
      navigate('/edit', { state: { photos, layout } })
    } else {
      setReady(true)
      setCountdown(null)
    }
  }, [stepIndex, layout, navigate, photos])

  // 3) Show 'Get ready...' then start countdown
  useEffect(() => {
    if (!ready || stepIndex >= layout) return
    const id = setTimeout(() => {
      setReady(false)
      setCountdown(timer)
    }, READY_MS)
    return () => clearTimeout(id)
  }, [ready, stepIndex, layout, timer])

  // 4) Countdown then snapshot
  useEffect(() => {
    if (countdown == null) return
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id)
          takeSnapshot()
          setTimeout(() => setStepIndex(i => i + 1), LINGER_MS)
          return null
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [countdown])

  // 5) Capture frame + filter
  function takeSnapshot() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.filter = getComputedStyle(video).filter
    ctx.drawImage(video, 0, 0)
    setPhotos(p => [...p, canvas.toDataURL('image/png')])
  }

  return (
    <div className="capture-sequence-container">
      <div className="sequence-preview-wrapper">
        <video
          ref={videoRef}
          className={`preview ${filter || ''}`}
          autoPlay
          muted
          playsInline
        />

        {/* only show countdown / ready when stepIndex < layout */}
        {stepIndex < layout && (
          <div className="sequence-overlay">
            <span className="sequence-title">
              {ready
                ? `Get ready for photo ${stepIndex + 1} of ${layout}`
                : countdown != null
                  ? countdown
                  : null}
            </span>
          </div>
        )}
      </div>

      {/* hidden canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="step-indicator">
        {Array.from({ length: layout }).map((_, i) => (
          <span
            key={i}
            className={`dot ${i < stepIndex ? 'filled' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
