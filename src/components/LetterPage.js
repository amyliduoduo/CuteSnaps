import React, { useRef, useState, useEffect } from 'react';
import './LetterPage.css';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const LetterPage = () => {
  const [toast, setToast] = useState(false);
  const [topLayer, setTopLayer] = useState('photostrip');
  const [message, setMessage] = useState('');
  const [photostripUrl, setPhotostripUrl] = useState('');
  const letterRef = useRef();
  const photostripRef = useRef();

  // On mount, check for query params, else fallback to localStorage
  useEffect(() => {
    const imgParam = getQueryParam('img');
    const msgParam = getQueryParam('msg');
    if (imgParam && msgParam) {
      setPhotostripUrl(decodeURIComponent(imgParam));
      setMessage(decodeURIComponent(msgParam));
    } else {
      setPhotostripUrl(localStorage.getItem('photostripUrl') || '');
      setMessage(localStorage.getItem('letterMessage') || '');
    }
  }, []);

  const handleCopy = () => {
    // Use current state for message and photostripUrl
    const url = new URL(window.location.href);
    url.searchParams.set('img', encodeURIComponent(photostripUrl));
    url.searchParams.set('msg', encodeURIComponent(message));
    navigator.clipboard.writeText(url.toString());
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
