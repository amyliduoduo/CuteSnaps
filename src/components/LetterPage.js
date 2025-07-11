import React, { useRef, useState, useEffect } from 'react';
import './LetterPage.css';
import { supabase } from '../supabaseClient';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const LetterPage = () => {
  const [toast, setToast] = useState(false);
  const [topLayer, setTopLayer] = useState('photostrip');
  const [message, setMessage] = useState('');
  const [photostripUrl, setPhotostripUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const letterRef = useRef();
  const photostripRef = useRef();

  // On mount, check for ?id=... in the URL, else fallback to localStorage
  useEffect(() => {
    const id = getQueryParam('id');
    if (id) {
      setLoading(true);
      supabase
        .from('letters')
        .select('message,image_url')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          setLoading(false);
          if (error || !data) {
            setError('Could not load letter.');
          } else {
            setMessage(data.message);
            setPhotostripUrl(data.image_url);
          }
        });
    } else {
      setPhotostripUrl(localStorage.getItem('photostripUrl') || '');
      setMessage(localStorage.getItem('letterMessage') || '');
    }
  }, []);

  // Helper to upload image to Supabase Storage
  async function uploadImage(dataUrl) {
    // Convert dataURL to Blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `photostrip-${Date.now()}.png`;
    const { data, error } = await supabase.storage.from('photostrips').upload(fileName, blob, { upsert: true, contentType: 'image/png' });
    if (error) throw error;
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('photostrips').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  }

  // Helper to save letter to Supabase
  async function saveLetter(imageUrl, message) {
    const { data, error } = await supabase.from('letters').insert([{ image_url: imageUrl, message }]).select('id').single();
    if (error) throw error;
    return data.id;
  }

  const handleCopy = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Upload image if not already uploaded
      let imageUrl = photostripUrl;
      if (photostripUrl.startsWith('data:')) {
        imageUrl = await uploadImage(photostripUrl);
      }
      // 2. Save letter
      const id = await saveLetter(imageUrl, message);
      // 3. Generate link
      const url = new URL(window.location.origin + '/final-letter');
      url.searchParams.set('id', id);
      await navigator.clipboard.writeText(url.toString());
      setToast(true);
      setTimeout(() => setToast(false), 1800);
    } catch (err) {
      setError('Failed to share letter. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <div className="letter-message">{loading ? 'Loading...' : message}</div>
        </div>
        {photostripUrl && !loading && (
          <img
            src={photostripUrl}
            alt="Photostrip"
            className={`scrapbook-photostrip ${topLayer === 'photostrip' ? 'top' : ''}`}
            ref={photostripRef}
            onClick={bringPhotostripToFront}
          />
        )}
      </div>
      <button className="copy-btn" onClick={handleCopy} disabled={loading}>
        {loading ? 'Sharing...' : 'Copy link to share'}
      </button>
      {toast && <div className="copy-toast">Link copied! Now paste it anywhere to share</div>}
      {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
    </div>
  );
};

export default LetterPage;
