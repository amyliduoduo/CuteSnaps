// src/components/EditPage.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import EmojiPicker from 'emoji-picker-react'
import { Rnd } from 'react-rnd'
import './EditPage.css'
import axios from 'axios';

function getCenterCoords(containerRef, width, height) {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };
  return {
    x: rect.width / 2 - width / 2,
    y: rect.height / 2 - height / 2
  };
}

// Helper: detect mobile
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

export default function EditPage() {
  const { photos = [], layout = photos.length } = useLocation().state || {}
  const [showDate, setShowDate] = useState(true)
  const [frameColor, setFrameColor] = useState('#FFFFFF')
  const [sticks, setSticks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [rotatingId, setRotatingId] = useState(null)
  const [rotationStart, setRotationStart] = useState(null)
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef(null)
  const colorInputRef = useRef(null)
  const navigate = useNavigate();

  // AI Decorations state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiFrameColor, setAiFrameColor] = useState(null);
  const [aiStickers, setAiStickers] = useState([]);

  const frameColors = [
    { hex: '#FFFFFF', label: 'Pure White' },
    { hex: '#000000', label: 'Jet Black' },
    { hex: '#E63946', label: 'Ruby Red' },
    { hex: '#FFE5E5', label: 'Light Pink' },
    { hex: '#457B9D', label: 'Royal Blue' },
    { hex: '#2A9D8F', label: 'Forest Green' },
    { hex: '#B76E79', label: 'Rose Gold' },
    { hex: '#B5838D', label: 'Lavender Mist' },
    { hex: '#C0C0C0', label: 'Metallic Silver' },
    { hex: '#A8DADC', label: 'Mint Cream' },
    { hex: '#D3D3D3', label: 'Light Gray' },
    { hex: null, label: 'Custom' }
  ]

  useEffect(() => {
    const root = document.querySelector('.emoji-picker-react')
    if (!root) return

    const obs = new MutationObserver(() => {
      root.querySelectorAll('button').forEach(btn => {
        if (!btn.draggable && btn.textContent.trim()) {
          btn.draggable = true
          btn.addEventListener('dragstart', e => {
            const img = btn.querySelector('img')
            const payload = img ? img.src : btn.textContent.trim()
            
            // Set multiple data formats for better Safari/Mac compatibility
            e.dataTransfer.setData('text/plain', payload)
            e.dataTransfer.setData('text', payload)
            e.dataTransfer.setData('application/x-moz-file', payload)
            
            // Set effectAllowed for better cross-browser compatibility
            e.dataTransfer.effectAllowed = 'copy'
            
            // ✅ Mac/Safari fix — setDragImage
            const dragGhost = document.createElement('div')
            dragGhost.textContent = payload
            dragGhost.style.position = 'absolute'
            dragGhost.style.top = '-9999px'
            dragGhost.style.fontSize = '32px'
            dragGhost.style.pointerEvents = 'none'
            document.body.appendChild(dragGhost)
            e.dataTransfer.setDragImage(dragGhost, 0, 0)
            setTimeout(() => {
              if (document.body.contains(dragGhost)) {
                document.body.removeChild(dragGhost)
              }
            }, 0)
          })
        }
      })
    })

    obs.observe(root, { subtree: true, childList: true })
    return () => obs.disconnect()
  }, [])

  // Fix handleDrop for touch events
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    let x, y;
    if (e.type === 'touchend' && e.changedTouches && e.changedTouches[0]) {
      const rect = containerRef.current.getBoundingClientRect();
      x = e.changedTouches[0].clientX - rect.left;
      y = e.changedTouches[0].clientY - rect.top;
    } else {
      const rect = containerRef.current.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    let data = e.dataTransfer?.getData('text/plain') || '';
    if (!data && e.dataTransfer) data = e.dataTransfer.getData('text');
    if (!data && e.dataTransfer) data = e.dataTransfer.getData('application/x-moz-file');
    if (!data && e.emoji) data = e.emoji;
    if (!data) return;
    const isUrl = data.startsWith('http');
    addSticker({
        id: Date.now(),
        x, y,
        width: 64,
        height: 64,
        ...(isUrl ? { src: data } : { char: data })
    });
  };

  const deleteSticker = id => {
    setSticks(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // Fix download for mobile
  const handleDownload = () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    setTimeout(() => {
    html2canvas(containerRef.current, { useCORS: true }).then(canvas => {
      const dataUrl = canvas.toDataURL();
        if (isMobile()) {
          // On mobile, open in new tab and show message
          const win = window.open();
          win.document.write('<img src="' + dataUrl + '" style="width:100%;height:auto;"/>');
          setTimeout(() => setIsExporting(false), 200);
          alert('Long-press the image and choose "Save Image" to save to your device.');
        } else {
          const link = document.createElement('a');
          link.download = 'photostrip.png';
          link.href = dataUrl;
          link.click();
          navigate('/download', { state: { photostripUrl: dataUrl } });
          setIsExporting(false);
        }
      });
    }, 50);
  };

  // Add sticker (drag or click) with rotation property
  const addSticker = (sticker) => {
    setSticks(prev => [
      ...prev,
      {
        ...sticker,
        rotation: 0 // default rotation
      }
    ])
  }

  // Rotation logic
  const startRotate = (e, id) => {
    e.stopPropagation();
    const sticker = sticks.find(s => s.id === id);
    if (!sticker) return;
    // Get the center of the sticker in page coordinates
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + sticker.x + sticker.width / 2;
    const centerY = containerRect.top + sticker.y + sticker.height / 2;
    const startAngle = Math.atan2(e.pageY - centerY, e.pageX - centerX) * 180 / Math.PI;
    setRotatingId(id);
    setRotationStart({
      centerX,
      centerY,
      startAngle,
      initialRotation: sticker.rotation || 0
    });
    document.body.style.cursor = 'grab';
  };

  useEffect(() => {
    if (rotatingId == null || !rotationStart) return;
    const handleMove = (e) => {
      setSticks(prev => prev.map(s => {
        if (s.id !== rotatingId) return s;
        const { centerX, centerY, startAngle, initialRotation } = rotationStart;
        const currentAngle = Math.atan2(e.pageY - centerY, e.pageX - centerX) * 180 / Math.PI;
        let newRotation = initialRotation + (currentAngle - startAngle);
        return { ...s, rotation: newRotation };
      }));
    };
    const handleUp = () => {
      setRotatingId(null);
      setRotationStart(null);
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [rotatingId, rotationStart]);

  // Add keyboard delete support for selected sticker
  useEffect(() => {
    if (selectedId == null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        setSticks(prev => prev.filter(s => s.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // AI Generate handler
  async function handleAIGenerate() {
    setAiLoading(true);
    setAiError('');
    setAiFrameColor(null);
    setAiStickers([]);
    try {
      if (!process.env.REACT_APP_OPENAI_API_KEY) {
        setAiError('OpenAI API key is missing. Please check your .env file.');
        setAiLoading(false);
        return;
      }
      // 1. Get frame color suggestion from GPT
      const colorRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that suggests a single CSS color (hex or name) for a photobooth frame based on a user prompt.' },
            { role: 'user', content: `Suggest a CSS color for a photobooth frame for this theme: ${aiPrompt}. Only output the color, nothing else.` }
          ],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const color = colorRes.data.choices[0].message.content.trim().replace(/['"`]/g, '');
      setAiFrameColor(color);

      // 2. Generate 3 stickers with DALL·E
      const stickerPromises = [1,2,3].map(i =>
        axios.post(
          'https://api.openai.com/v1/images/generations',
          {
            prompt: `${aiPrompt}, cute sticker, transparent background, illustration, no text, PNG`,
            n: 1,
            size: '256x256',
            response_format: 'url'
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )
      );
      const stickerResults = await Promise.all(stickerPromises);
      setAiStickers(stickerResults.map(r => r.data.data[0].url));
    } catch (err) {
      if (err?.response?.status === 429) {
        setAiError('Rate limit reached. Please wait 1-2 minutes and try again.');
      } else if (err?.response?.status === 401) {
        setAiError('Invalid API key. Please check your OpenAI API key.');
      } else if (err?.response?.status === 400) {
        setAiError('Invalid request. Please try a different prompt.');
      } else {
        setAiError('Failed to generate decorations. Please try again.');
      }
      // Log error for debugging
      console.error('OpenAI error:', err?.response?.data || err);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="edit-page">
      {/* LEFT PANEL */}
      <div className="edit-controls">
        <img
          src="/assets/customizequote.svg"
          alt="Customize your photostrip"
          className="edit-quote"
        />

        {/* Date Stamp Toggle */}
        <div className="toggle-row">
          <span>Display Date Stamp:</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={showDate}
              onChange={e => setShowDate(e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>

        {/* Frame Color */}
        <div className="control-group">
          <span>Frame Color:</span>
          <div className="color-options">
            {frameColors.map(c => (
              <button
                key={c.label}
                className={
                  'color-btn' +
                  (frameColor === c.hex ? ' selected' : '') +
                  (c.label === 'Metallic Silver' ? ' metallic' : '') +
                  (c.label === 'Custom' ? ' custom-btn' : '')
                }
                style={{ '--btn-color': c.hex || '#E9E1CD' }}
                onClick={() =>
                  c.label === 'Custom'
                    ? colorInputRef.current.click()
                    : setFrameColor(c.hex)
                }
              >
                {c.label}
                {c.label === 'Custom' && (
                  <input
                    type="color"
                    ref={colorInputRef}
                    className="color-picker"
                    value={frameColor}
                    onChange={e => setFrameColor(e.target.value)}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Decorations */}
        <div className="control-group ai-deco-row">
          <div className="ai-deco-col">
          <span>Draggable Sticker:</span>
          <EmojiPicker
            disableAutoFocus
            pickerStyle={{ width: '100%', height: '250px' }}
              onEmojiClick={(emojiObject, event) => {
                let x, y;
                const rect = containerRef.current?.getBoundingClientRect();
                if (event && event.touches && event.touches[0]) {
                  x = event.touches[0].clientX - rect.left;
                  y = event.touches[0].clientY - rect.top;
                } else if (rect) {
                  x = rect.width / 2 - 32;
                  y = rect.height / 2 - 32;
                }
                addSticker({
                  id: Date.now(),
                  x, y,
                  width: 64,
                  height: 64,
                  char: emojiObject.emoji
                });
              }}
            />
            <div style={{ fontSize: '0.95rem', color: '#918A87', marginTop: 6, fontStyle: 'italic' }}>
              Tip: On Mac, click a sticker to add, then drag/resize/rotate on the photostrip.
            </div>
          </div>
          <div className="ai-deco-divider" />
          {/* AI Generated Decorations */}
          <div className="ai-deco-col">
            <span>AI Generated decorations:</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe your theme (e.g. cute cats, pastel)"
                style={{ flex: 1, padding: 6, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
                disabled={aiLoading}
              />
              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{ padding: '6px 14px', borderRadius: 8, background: '#CAC8FF', border: 'none', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer' }}
              >
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {aiError && <div style={{ color: 'red', fontSize: 13 }}>{aiError}</div>}
            {aiFrameColor && (
              <div style={{ margin: '8px 0', fontSize: 14 }}>
                <span>Suggested frame color: </span>
                <span style={{ background: aiFrameColor, padding: '2px 10px', borderRadius: 6, border: '1px solid #ccc', marginLeft: 4 }}>{aiFrameColor}</span>
                <button style={{ marginLeft: 8, fontSize: 13, padding: '2px 8px', borderRadius: 6, border: '1px solid #aaa', background: '#fff', cursor: 'pointer' }} onClick={() => setFrameColor(aiFrameColor)}>Use</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {aiStickers.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`AI sticker ${idx+1}`}
                  draggable
                  style={{ width: 56, height: 56, borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'grab' }}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', url);
                    e.dataTransfer.setData('text', url);
                    e.dataTransfer.setData('application/x-moz-file', url);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    // Click to add to center
                    const rect = containerRef.current?.getBoundingClientRect();
                    const x = rect ? rect.width / 2 - 32 : 0;
                    const y = rect ? rect.height / 2 - 32 : 0;
                    addSticker({
                      id: Date.now() + idx,
                      x, y,
                      width: 64,
                      height: 64,
                      src: url
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PREVIEW */}
      <div
        className="edit-preview"
        onClick={() => setSelectedId(null)}
      >
        <img
          src="/assets/previewquote.svg"
          alt="Preview"
          className="preview-quote"
        />
        <div
          className={`preview-frame ${isDragOver ? 'drag-over' : ''}`}
          ref={containerRef}
          style={{ backgroundColor: isDragOver ? '#F0F8FF' : frameColor }}
          onDragOver={e => {
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = 'copy'
            setIsDragOver(true)
          }}
          onDragEnter={e => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragOver(true)
          }}
          onDragLeave={e => {
            e.preventDefault()
            e.stopPropagation()
            // Only set drag over to false if we're leaving the container
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsDragOver(false)
            }
          }}
          onDrop={e => {
            setIsDragOver(false)
            handleDrop(e)
          }}
        >
          {photos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`shot-${i}`}
              className="shot"
            />
          ))}

          {sticks.map(st => {
            // Calculate the center and the top-center (handle) position relative to the sticker
            const handleRadius = 32; // px from center to handle (distance from center to top)
            const handleSize = 36; // px
            const angleRad = ((st.rotation || 0) - 90) * Math.PI / 180; // -90 so 0deg is top
            const handleCenterX = st.width / 2 + handleRadius * Math.cos(angleRad) - handleSize / 2;
            const handleCenterY = st.height / 2 + handleRadius * Math.sin(angleRad) - handleSize / 2;
            return (
            <Rnd
              key={st.id}
                className={`sticker-wrapper${selectedId === st.id ? ' selected' : ''}`}
              bounds="parent"
              size={{ width: st.width, height: st.height }}
              position={{ x: st.x, y: st.y }}
              onDragStop={(_, d) =>
                setSticks(prev =>
                  prev.map(s =>
                    s.id === st.id
                      ? { ...s, x: d.x, y: d.y }
                      : s
                  )
                )
              }
              onResizeStop={(_, __, ref, ___, pos) =>
                setSticks(prev =>
                  prev.map(s =>
                    s.id === st.id
                      ? {
                          ...s,
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          x: pos.x,
                          y: pos.y
                        }
                      : s
                  )
                )
              }
              enableResizing={{
                top: true,
                right: true,
                bottom: true,
                left: true,
                topRight: true,
                bottomRight: true,
                bottomLeft: true,
                topLeft: true
              }}
              resizeHandleClasses={{
                topLeft: 'resize-handle top-left',
                topRight: 'resize-handle top-right',
                bottomLeft: 'resize-handle bottom-left',
                bottomRight: 'resize-handle bottom-right'
              }}
              onClick={e => {
                e.stopPropagation()
                setSelectedId(st.id)
                }}
              >
                {/* Canva-style always-visible, rotating handle */}
                {!isExporting && (
                  <div
                    style={{
                      position: 'absolute',
                      left: handleCenterX,
                      top: handleCenterY,
                      width: handleSize,
                      height: handleSize,
                      background: '#a084e8',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px #b39ddb',
                      border: '2.5px solid #fff',
                      cursor: 'grab',
                      zIndex: 20,
                      pointerEvents: 'auto',
                      userSelect: 'none',
                    }}
                    onMouseDown={e => {
                      e.stopPropagation();
                      const containerRect = containerRef.current.getBoundingClientRect();
                      const centerX = containerRect.left + st.x + st.width / 2;
                      const centerY = containerRect.top + st.y + st.height / 2;
                      const startAngle = Math.atan2(e.pageY - centerY, e.pageX - centerX) * 180 / Math.PI;
                      setRotatingId(st.id);
                      setRotationStart({
                        centerX,
                        centerY,
                        startAngle,
                        initialRotation: st.rotation || 0
                      });
                      document.body.style.cursor = 'grab';
                    }}
                  >
                    <span role="img" aria-label="rotate" style={{ fontSize: 22, color: '#fff', userSelect: 'none', pointerEvents: 'none' }}>⟳</span>
                  </div>
                )}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${st.rotation || 0}deg)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
              }}
            >
              {st.src ? (
                <img
                  src={st.src}
                  style={{
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: `${st.height * 0.8}px`,
                    pointerEvents: 'none'
                  }}
                >
                  {st.char}
                </span>
              )}
                </div>
              <button
                className="sticker-delete-btn"
                onClick={e => {
                  e.stopPropagation()
                  deleteSticker(st.id)
                }}
              >
                🗑️
              </button>
            </Rnd>
            )
          })}

          {showDate && (
            <div className="date-stamp">
              {new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>

        <button
          className="collect-btn"
          onClick={handleDownload}
        >
          Collect Photo
        </button>
      </div>
    </div>
  )
}
