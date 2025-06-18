import React, { useState } from 'react';
import './PhotoFrame.css';

function PhotoFrame() {
  const [imageSrc, setImageSrc] = useState(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  return (
    <div className="photo-frame-container">
      <h2>Upload your photo ✨</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {imageSrc && (
        <div className="preview-frame">
          <img src={imageSrc} alt="Preview" className="preview-image" />
        </div>
      )}
    </div>
  );
}

export default PhotoFrame;
