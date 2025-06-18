// src/components/Homepage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Homepage.module.css';

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Title */}
        <img
          src="/assets/welcomequote.svg"
          alt="Welcome to CuteSnaps"
          className={styles.titleImg}
        />

        {/* Booth */}
        <div className={styles.boothWrapper}>
          <img
            src="/assets/booth.svg"
            alt="CuteSnaps Photobooth"
            className={styles.boothImg}
          />
          <button
            className={styles.startButton}
            onClick={() => navigate('/layout')}
          >
            Start →
          </button>
        </div>
      </div>
    </div>
  );
}
