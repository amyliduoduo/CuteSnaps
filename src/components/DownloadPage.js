import React, { useEffect, useState } from 'react';
import './DownloadPage.css';
import { useNavigate, useLocation } from 'react-router-dom';

const DownloadPage = ({ photostripUrl }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageSrc, setImageSrc] = useState(photostripUrl || '');

  useEffect(() => {
    if (photostripUrl) {
      setImageSrc(photostripUrl);
      localStorage.setItem('photostripUrl', photostripUrl);
      return;
    }
    const stored = localStorage.getItem('photostripUrl');
    if (stored) {
      setImageSrc(stored);
      return;
    }
    const params = new URLSearchParams(location.search);
    const urlParam = params.get('photostrip');
    if (urlParam) {
      setImageSrc(urlParam);
      localStorage.setItem('photostripUrl', urlParam);
    }
  }, [photostripUrl, location.search]);

  const handleSendLetter = () => {
    navigate('/textbox');
  };

  return (
    <div className="download-bg">
      <div className="download-container">
        <img src="/assets/downloaded.svg" alt="Your photostrip is downloaded!" className="downloaded-svg" />
        <img src="/assets/tada.svg" alt="Ta-Da! Here's your cute snaps like you!" className="tada-svg" />
        <div className="outer-rect">
          <div className="inner-rect">
            {imageSrc && (
              <img src={imageSrc} alt="Downloaded photostrip" className="photostrip-img" />
            )}
            <div className="purple-line" />
          </div>
        </div>
        <button className="send-letter-btn" onClick={handleSendLetter}>
          send a letter to a friend
        </button>
      </div>
    </div>
  );
};

export default DownloadPage;
