// src/components/EditPage.jsx
import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import EmojiPicker from 'emoji-picker-react'
import { Rnd } from 'react-rnd'
import './EditPage.css'

export default function EditPage() {
  const { photos = [], layout = photos.length } = useLocation().state || {}
  const [showDate, setShowDate] = useState(true)
  const [frameColor, setFrameColor] = useState('#FFFFFF')
  const [sticks, setSticks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const containerRef = useRef(null)
  const colorInputRef = useRef(null)
  const navigate = useNavigate();

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

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    
    // Try multiple data formats for better Safari/Mac compatibility
    let data = e.dataTransfer.getData('text/plain')
    if (!data) {
      data = e.dataTransfer.getData('text')
    }
    if (!data) {
      data = e.dataTransfer.getData('application/x-moz-file')
    }
    
    if (!data) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const isUrl = data.startsWith('http')

    setSticks(prev => [
      ...prev,
      {
        id: Date.now(),
        x, y,
        width: 64,
        height: 64,
        ...(isUrl ? { src: data } : { char: data })
      }
    ])
  }

  const deleteSticker = id => {
    setSticks(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleDownload = () => {
    if (!containerRef.current) return
    html2canvas(containerRef.current, { useCORS: true }).then(canvas => {
      const dataUrl = canvas.toDataURL();
      const link = document.createElement('a')
      link.download = 'photostrip.png'
      link.href = dataUrl
      link.click()
      // Navigate to Download Page and pass the photostrip dataUrl
      navigate('/download', { state: { photostripUrl: dataUrl } })
    })
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
        <div className="control-group">
          <span>Draggable Sticker:</span>
          <EmojiPicker
            disableAutoFocus
            pickerStyle={{ width: '100%', height: '250px' }}
            onEmojiClick={(emojiObject) => {
              // Fallback for Safari/Mac: click to add emoji
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                const x = rect.width / 2 - 32 // Center horizontally
                const y = rect.height / 2 - 32 // Center vertically
                setSticks(prev => [
                  ...prev,
                  {
                    id: Date.now(),
                    x, y,
                    width: 64,
                    height: 64,
                    char: emojiObject.emoji
                  }
                ])
              }
            }}
          />
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

          {sticks.map(st => (
            <Rnd
              key={st.id}
              className="sticker-wrapper"
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
          ))}

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
