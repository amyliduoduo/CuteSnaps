import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TextboxPage.css';

const TextboxPage = () => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleContinue = () => {
    localStorage.setItem('letterMessage', message);
    navigate('/final-letter');
  };

  return (
    <div className="textbox-bg">
      <div className="textbox-container">
        <img src="/assets/sealwithwords.svg" alt="Seal it with words" className="sealwithwords-svg" />
        <textarea
          className="letter-textarea"
          placeholder="Write your message here..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button className="continue-btn" onClick={handleContinue}>
          Add a stamp & Continue
        </button>
      </div>
    </div>
  );
};

export default TextboxPage;
