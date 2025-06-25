import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CaptureSequencePage.css';

export default function CaptureSequencePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { layout, timer, filter } = location.state || {};

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);

  // 1) Start camera on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        video.srcObject = stream;
        return video.play();
      })
      .catch(err => console.error('Camera error:', err));

    return () => {
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2) Kickoff each capture cycle
  useEffect(() => {
    if (stepIndex < layout) {
      setCountdown(Number(timer));
    } else {
      navigate('/edit', { state: { photos, layout } });
    }
  }, [stepIndex]);

  // 3) Countdown then snapshot
  useEffect(() => {
    if (countdown == null) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id);
          takeSnapshot();
          setTimeout(() => setStepIndex(i => i + 1), 1000);
          return null;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // 4) Draw video frame + filter to canvas
  function takeSnapshot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.filter = getComputedStyle(video).filter;
    ctx.drawImage(video, 0, 0);
    setPhotos(p => [...p, canvas.toDataURL('image/png')]);
  }

  return (
    <div className="capture-sequence-container">
      <div className="sequence-preview-wrapper">
        <video
          ref={videoRef}
          className={`preview ${filter}`}
          autoPlay
          muted
          playsInline
        />
        <div className="sequence-overlay">
          <span className="sequence-title">
            {countdown != null
              ? countdown
              : `Get ready for photo ${stepIndex + 1} of ${layout}`}
          </span>
        </div>
      </div>

      {/* Hidden canvas for snapshots */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="step-indicator">
        {Array.from({ length: layout }).map((_, i) => (
          <span
            key={i}
            className={i === stepIndex ? 'dot active' : 'dot'}
          />
        ))}
      </div>
    </div>
  );
}
