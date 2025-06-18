import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PhotocapturePage.css';

export default function PhotocapturePage() {
  const videoRef = useRef(null);
  const [timer, setTimer] = useState(null);
  const [filter, setFilter] = useState('none');
  const [count, setCount] = useState(null);
  const navigate = useNavigate();
  const { layout, mode } = useLocation().state; // picked in LayoutSelector

  // Access webcam on mount
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
      .catch(err => console.error('Camera/playback error:', err));

    // Cleanup on unmount
    return () => {
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start countdown and then proceed
  function startCountdown() {
    const initial = parseInt(timer, 10);
    setCount(initial);
    const id = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setCount(null);
          // navigate into the multi-shot sequence
          navigate('/sequence', {
            state: { layout, timer, filter }
          });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const isReady = Boolean(timer) && Boolean(filter);

  return (
    <div className="photocapture-container">
      {/* Top quote from Figma */}
      <img
        src="/assets/photocapturequote.svg"
        alt="Select a countdown timer and a filter for photo capture"
        className="page-quote"
      />

      {/* Framed preview */}
      <div className="preview-wrapper">
        <video
          ref={videoRef}
          className={`preview ${filter}`}
          autoPlay
          muted
          playsInline
        />
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="timer-controls">
          <span>Countdown Timer:</span>
          {['3', '5', '10'].map(sec => (
            <button
              key={sec}
              className={`btn ${timer === sec ? 'selected' : ''}`}
              onClick={() => setTimer(sec)}
            >
              {sec}s
            </button>
          ))}
        </div>

        <div className="filter-controls">
          <span>Filter:</span>
          {[
            { key: 'none', label: 'None' },
            { key: 'bw', label: 'B&W' },
            { key: 'sepia', label: 'Sepia' },
            { key: 'pastel', label: 'Pastel' },
            { key: 'vivid', label: 'Vivid' },
            { key: 'pop', label: 'Pop' },
            { key: 'neon', label: 'Neon' },
            { key: 'vintage', label: 'Vintage' }
          ].map(f => (
            <button
              key={f.key}
              className={`btn ${filter === f.key ? 'selected' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          className={`btn next ${isReady ? '' : 'disabled'}`}
          disabled={!isReady}
          onClick={startCountdown}
        >
          Next →
        </button>
      </div>

      {/* Countdown overlay */}
      {count != null && (
        <div className="countdown-overlay">
          {count}
        </div>
      )}
    </div>
  );
}
