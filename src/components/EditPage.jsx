// src/components/EditPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import EmojiPicker from 'emoji-picker-react';
import { Rnd } from 'react-rnd';
import './EditPage.css';

export default function EditPage() {
  const { photos = [], layout = photos.length } = useLocation().state || {};

  const [showDate, setShowDate]     = useState(true);
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [sticks, setSticks]         = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);

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
    { hex: '#D3D3D3', label: 'Light Gray' }
  ];

  useEffect(() => {
    const root = document.querySelector('.emoji-picker-react');
    if (!root) return;
    const obs = new MutationObserver(() => {
      root.querySelectorAll('button').forEach(btn => {
        if (!btn.draggable && btn.textContent.trim()) {
          btn.draggable = true;
          btn.addEventListener('dragstart', e => {
            const img = btn.querySelector('img');
            const payload = img ? img.src : btn.textContent.trim();
            e.dataTransfer.setData('text/plain', payload);
          });
        }
      });
    });
    obs.observe(root, { subtree: true, childList: true });
    return () => obs.disconnect();
  }, []);

  const handleDrop = e => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const isUrl = data.startsWith('http');
    setSticks(prev => [
      ...prev,
      { id: Date.now(), x, y, width: 64, height: 64,
        ...(isUrl ? { src: data } : { char: data })
      }
    ]);
  };

  const deleteSticker = id => {
    setSticks(prev => prev.filter(st => st.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDownload = () => {
    if (!containerRef.current) return;
    html2canvas(containerRef.current, { useCORS: true }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'photostrip.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  return (
    <div className="edit-page">
      {/* LEFT PANEL */}
      <div className="edit-controls">
        <img src="/assets/customizequote.svg" alt="Customize" className="edit-quote" />
        <div className="toggle-row">
  <span>Display Date Stamp:</span>
  <label className="switch">
    <input
      type="checkbox"
      checked={showDate}
      onChange={e => setShowDate(e.target.checked)}
    />
    <span className="slider"></span>
  </label>
</div>
        <div className="control-group">
          <span>Frame Color:</span>
          <div className="color-options">
            {frameColors.map(c => (
              <button
                key={c.hex}
                className={`color-btn ${frameColor === c.hex ? 'selected' : ''}`}
                style={{ backgroundColor: c.hex }}
                onClick={() => setFrameColor(c.hex)}
              >{c.label}</button>
            ))}
            <button className="color-btn custom-btn" onClick={() => {
              const hex = prompt('Enter hex code:', frameColor);
              if (hex) setFrameColor(hex);
            }}>Custom</button>
          </div>
        </div>
        <div className="control-group">
          <span>Decorations:</span>
          <EmojiPicker disableAutoFocus pickerStyle={{width:'100%',height:'200px'}} />
        </div>
      </div>
      {/* RIGHT PREVIEW */}
      <div className="edit-preview" onClick={() => setSelectedId(null)}>
        <img src="/assets/previewquote.svg" alt="Preview" className="preview-quote" />
        <div
          className="preview-frame"
          ref={containerRef}
          style={{ backgroundColor: frameColor }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {photos.map((photo,i)=>(
            <img key={i} src={photo} alt={`shot-${i}`} className={`shot shot-${layout}`} />
          ))}
          {sticks.map(st=>(
            <Rnd
              key={st.id}
              className="sticker-wrapper"
              bounds="parent"
              size={{width:st.width,height:st.height}}
              position={{x:st.x,y:st.y}}
              onDragStop={(_,d)=>setSticks(prev=>prev.map(s=>s.id===st.id?{...s,x:d.x,y:d.y}:s))}
              onResizeStop={(_,__,ref,___,pos)=>setSticks(prev=>prev.map(s=>s.id===st.id?{...s,width:parseInt(ref.style.width),height:parseInt(ref.style.height),x:pos.x,y:pos.y}:s))}
              enableResizing={{top:true,right:true,bottom:true,left:true,topRight:true,bottomRight:true,bottomLeft:true,topLeft:true}}
              resizeHandleClasses={{
                topLeft:'resize-handle top-left',topRight:'resize-handle top-right',
                bottomLeft:'resize-handle bottom-left',bottomRight:'resize-handle bottom-right'
              }}
              onClick={e=>{e.stopPropagation();setSelectedId(st.id)}}
            >
              {st.src ? <img src={st.src} style={{width:'100%',height:'100%',pointerEvents:'none'}}/> : <span style={{fontSize:`${st.height*0.8}px`,pointerEvents:'none'}}>{st.char}</span>}
              <button
                className="sticker-delete-btn"
                onClick={e=>{e.stopPropagation();deleteSticker(st.id)}}
              >🗑️</button>
            </Rnd>
          ))}
          {showDate && <div className="date-stamp">{new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}</div>}
        </div>
        <button className="collect-btn" onClick={handleDownload}>Collect Photo</button>
      </div>
    </div>
  );
}