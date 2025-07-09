import React, { useRef, useState } from 'react';
import './LetterPage.css';

const LetterPage = () => {
  const [toast, setToast] = useState(false);
  const [topLayer, setTopLayer] = useState('photostrip');
  const letterRef = useRef();
  const photostripRef = useRef();

  const message = localStorage.getItem('letterMessage') || '';
  const photostripUrl = localStorage.getItem('photostripUrl') || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  const bringLetterToFront = () => setTopLayer('letter');
  const bringPhotostripToFront = () => setTopLayer('photostrip');

  return (
    <div className="letter-bg">
      <img src="/assets/sendthismemory.svg" alt="Send this memory" className="sendmemory-svg" />
      <div className="scrapbook-center">
        <div
          className={`letter-paper ${topLayer === 'letter' ? 'top' : ''}`}
          ref={letterRef}
          onClick={bringLetterToFront}
          style={{ background: "url('/assets/kraftpaper.jpg') center center/cover no-repeat" }}
        >
          <div className="letter-message">{message}</div>
        </div>
        {photostripUrl && (
          <img
            src={photostripUrl}
            alt="Photostrip"
            className={`scrapbook-photostrip ${topLayer === 'photostrip' ? 'top' : ''}`}
            ref={photostripRef}
            onClick={bringPhotostripToFront}
          />
        )}
      </div>
      <button className="copy-btn" onClick={handleCopy}>
        Copy link to share
      </button>
      {toast && <div className="copy-toast">Link copied! Now paste it anywhere to share</div>}
    </div>
  );
};

export default LetterPage;
