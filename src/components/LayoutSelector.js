// src/components/LayoutSelector.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LayoutSelector.module.css';

export default function LayoutSelector() {
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null);
  const layouts = [2, 3, 4, 6];
  const isReady = selected !== null && mode !== null;
  const navigate = useNavigate();

  function handleNext() {
    // Navigate to capture page, passing layout and mode as state
    navigate('/capture', { state: { layout: selected, mode } });
  }

  return (
    <div className={styles.container}>
      {/* SVG Title */}
      <img
        src="/assets/chooselayout.svg"
        alt="Choose your layout"
        className={styles.titleImg}
      />

      {/* Layout Options */}
      <div className={styles.grid}>
        {layouts.map((n) => (
          <div
            key={n}
            className={`${styles.option} ${selected === n ? styles.selected : ''}`}
            onClick={() => setSelected(n)}
          >
            <div className={styles[`box${n}`]}>
              {Array.from({ length: n }).map((_, i) => (
                <div key={i} className={styles.photo} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upload vs Take Photo */}
      <div className={styles.controls}>
        <button
          className={`${styles.control} ${mode === 'upload' ? styles.selected : ''}`}
          onClick={() => setMode('upload')}
        >
          📁 Upload
        </button>
        <span>or</span>
        <button
          className={`${styles.control} ${mode === 'camera' ? styles.selected : ''}`}
          onClick={() => setMode('camera')}
        >
          📸 Take Photo
        </button>
      </div>

      {/* Next Button */}
      <button
        className={`${styles.next} ${!isReady ? styles.disabled : ''}`}
        onClick={handleNext}
        disabled={!isReady}
      >
        Next →
      </button>
    </div>
  );
}
