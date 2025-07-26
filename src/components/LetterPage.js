import React, { useRef, useState, useEffect } from 'react';
import './LetterPage.css';
import { supabase } from '../supabaseClient';

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Helper: detect mobile
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
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
      console.log('Starting share process...');
      
      // Check if we have data to share
      if (!photostripUrl) {
        throw new Error('No photostrip image found');
      }
      if (!message.trim()) {
        throw new Error('No message to share');
      }

      // Use current state for message and photostripUrl
      let imageUrl = photostripUrl;
      if (photostripUrl.startsWith('data:')) {
        console.log('Uploading image to Supabase...');
        try {
          imageUrl = await uploadImage(photostripUrl);
          console.log('Image uploaded successfully:', imageUrl);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          throw new Error('Failed to upload image: ' + uploadError.message);
        }
      }
      
      console.log('Saving letter to database...');
      const id = await saveLetter(imageUrl, message);
      console.log('Letter saved with ID:', id);
      
      const url = new URL(window.location.origin + '/final-letter');
      url.searchParams.set('id', id);
      const shareUrl = url.toString();
      console.log('Share URL created:', shareUrl);

      // Mobile-specific sharing
      if (isMobile()) {
        console.log('Mobile device detected');
        
        // Try Web Share API first (works best on mobile)
        if (navigator.share) {
          console.log('Web Share API available, trying...');
          try {
            await navigator.share({
              title: 'CuteSnaps Letter',
              text: 'Check out my photostrip letter!',
              url: shareUrl
            });
            console.log('Web Share successful');
            setToast(true);
            setTimeout(() => setToast(false), 1800);
            return;
          } catch (shareError) {
            console.log('Web Share failed:', shareError);
            // Don't throw error, fall back to clipboard
          }
        }
        
        // Mobile clipboard fallback
        console.log('Trying mobile clipboard...');
        try {
          // For iOS Safari, we need to use a different approach
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            console.log('iOS device detected, using iOS clipboard method');
            // Create a temporary input element for iOS
            const tempInput = document.createElement('input');
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            console.log('iOS clipboard copy successful');
          } else {
            // For Android and other mobile browsers
            await navigator.clipboard.writeText(shareUrl);
            console.log('Mobile clipboard write successful');
          }
          setToast(true);
          setTimeout(() => setToast(false), 1800);
          return;
        } catch (clipboardError) {
          console.log('Mobile clipboard failed:', clipboardError);
          // Fall through to manual copy
        }
        
        // Final fallback for mobile: show alert with URL
        console.log('Using mobile fallback alert');
        alert(`Share this link:\n\n${shareUrl}\n\nTap and hold to copy, or share manually.`);
        setToast(true);
        setTimeout(() => setToast(false), 1800);
        return;
      }
      
      // Desktop clipboard
      console.log('Desktop device, trying clipboard API...');
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log('Desktop clipboard write successful');
        setToast(true);
        setTimeout(() => setToast(false), 1800);
      } catch (clipboardError) {
        console.log('Desktop clipboard failed, using fallback:', clipboardError);
        // Fallback: show input for manual copy
        const copied = window.prompt('Copy this link:', shareUrl);
        if (copied) {
          setToast(true);
          setTimeout(() => setToast(false), 1800);
        } else {
          throw new Error('User cancelled manual copy');
        }
      }
    } catch (err) {
      console.error('Share process failed:', err);
      setError(`Failed to share letter: ${err.message}`);
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
