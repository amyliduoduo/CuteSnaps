import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './LayoutSelector.module.css'

export default function LayoutSelector() {
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const layouts = [2, 3, 4, 6]

  // 1) Handle image uploads
  const handleFileChange = e => {
     const files = Array.from(e.target.files)
     const readers = files.map(file =>
       new Promise(resolve => {
         const reader = new FileReader()
         reader.onload = () => resolve(reader.result)
         reader.readAsDataURL(file)
       })
     )
     Promise.all(readers).then(images => {
       setUploadedFiles(prev => [...prev, ...images])
       // clear input so selecting the same file again still fires
       fileInputRef.current.value = null
     })
  }

  // 2) Next button logic
  const handleNext = () => {
    if (!selected || !mode) return
    if (mode === 'upload') {
      // take only as many photos as the layout requires
      const photos = uploadedFiles.slice(0, selected)
      navigate('/edit', { state: { photos, layout: selected } })
    } else {
      navigate('/capture', { state: { layout: selected, filter: null } })
    }
  }

  // enable Next only when ready
  const canProceed = () => {
    if (!selected || !mode) return false
    if (mode === 'upload') {
      return uploadedFiles.length >= selected
    }
    return true
  }

  return (
    <div className={styles.container}>
      {/* Title */}
      <img
        src="/assets/chooselayout.svg"
        alt="Choose your layout"
        className={styles.titleImg}
      />

      {/* Layout Options */}
      <div className={styles.grid}>
        {layouts.map(n => (
          <div
            key={n}
            className={styles.option}
            onClick={() => setSelected(n)}
          >
            <div className={`${styles[`box${n}`]} ${selected === n ? styles.selected : ''}`}>
              {Array.from({ length: n }).map((_, i) => (
                <div key={i} className={styles.photo} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upload vs Camera Controls */}
      <div className={styles.controls}>
        <button
          className={`${styles.control} ${mode === 'upload' ? styles.selected : ''}`}
          onClick={() => setMode('upload')}
        >
          📁 Upload
        </button>
        <span>or</span>
        <button
          className={`${styles.control} ${mode === 'camera' ? styles.selected : ''}`}
          onClick={() => setMode('camera')}
        >
          📸 Take Photo
        </button>
      </div>

      {/* Upload Section */}
      {mode === 'upload' && (
        <div className={styles.uploadSection}>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current.click()}
          >
            Select {selected || ''} Photo{selected > 1 ? 's' : ''}
          </button>
          {uploadedFiles.length > 0 && (
            <div className={styles.previewUploads}>
              {uploadedFiles.slice(0, selected).map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`upload-${idx}`}
                  className={styles.uploadPreview}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Button */}
      <button
        className={styles.next}
        disabled={!canProceed()}
        onClick={handleNext}
      >
        Next →
      </button>
    </div>
  )
}
