import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CaptureSequencePage.css';

export default function CaptureSequencePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { layout, timer, filter } = location.state || {};

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);          // current photo index
  const [countdown, setCountdown] = useState(null);       // countdown value
  const [photos, setPhotos] = useState([]);               // captured dataURLs

  // Start camera on mount
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

  // Trigger each capture cycle when stepIndex changes
  useEffect(() => {
    if (stepIndex < layout) {
      // initialize countdown before snapshot
      setCountdown(Number(timer));
    } else {
      // all done, navigate to review
      navigate('/review', { state: { photos, layout } });
    }
  }, [stepIndex]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown == null) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id);
          // take snapshot
          takeSnapshot();
          // move to next step after a brief pause
          setTimeout(() => setStepIndex(i => i + 1), 500);
          return null;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  function takeSnapshot() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // draw video frame with filter
    ctx.filter = getComputedStyle(video).filter;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    setPhotos(p => [...p, dataUrl]);
  }

  return (
    <div className="capture-sequence-container">
      <h2 className="sequence-title">
        {countdown != null
          ? countdown
          : `Get ready for photo ${stepIndex + 1} of ${layout}`}
      </h2>
      <div className="preview-wrapper">
        <video
          ref={videoRef}
          className={`preview ${filter}`}
          autoPlay
          muted
          playsInline
        />
      </div>
      {/* offscreen canvas for snapshots */}
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
