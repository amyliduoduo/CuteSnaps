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
        style={{ display: 'block', margin: '0 auto 0.5rem' }}
      />
      {/* Pick layout quote SVG */}
      <img
        src="/assets/picklayout.svg"
        alt="Pick a layout to start your photo session"
        style={{ margin: '0 auto 0.2rem', display: 'block', maxWidth: '340px', width: '100%' }}
      />

      {/* Layout Options */}
      <div className={styles.grid}>
        {/* Layout A (2 Poses) */}
        <div
          className={styles.option}
          onClick={() => setSelected(2)}
        >
          <div className={`${styles.box2} ${selected === 2 ? styles.selected : ''}`}
            style={{ position: 'relative' }}>
            <img src="/assets/pose1layout1.png" alt="Pose 1" className={styles.photo} />
            <img src="/assets/pose2layout1.png" alt="Pose 2" className={styles.photo} />
            <div className={styles.layoutLabel}>2 Pose</div>
          </div>
        </div>

        {/* Layout B (3 Poses) */}
        <div
          className={styles.option}
          onClick={() => setSelected(3)}
        >
          <div className={`${styles.box3} ${selected === 3 ? styles.selected : ''}`}
            style={{ position: 'relative' }}>
            <img src="/assets/pose1layout2.png" alt="Pose 1" className={styles.photo} />
            <img src="/assets/pose2layout2.png" alt="Pose 2" className={styles.photo} />
            <img src="/assets/pose3layout2.png" alt="Pose 3" className={styles.photo} />
            <div className={styles.layoutLabel}>3 Pose</div>
          </div>
        </div>

        {/* Layout C (4 Poses) */}
        <div
          className={styles.option}
          onClick={() => setSelected(4)}
        >
          <div className={`${styles.box4} ${selected === 4 ? styles.selected : ''}`}
            style={{ position: 'relative' }}>
            <img src="/assets/pose1layout3.png" alt="Pose 1" className={styles.photo} />
            <img src="/assets/pose2layout3.png" alt="Pose 2" className={styles.photo} />
            <img src="/assets/pose3layout3.png" alt="Pose 3" className={styles.photo} />
            <img src="/assets/pose4layout3.png" alt="Pose 4" className={styles.photo} />
            <div className={styles.layoutLabel}>4 Pose</div>
          </div>
        </div>

        {/* Layout D (6 Poses) */}
        <div
          className={styles.option}
          onClick={() => setSelected(6)}
        >
          <div className={`${styles.box6} ${selected === 6 ? styles.selected : ''}`}
            style={{ position: 'relative' }}>
            <img src="/assets/pose1layout4.png" alt="Pose 1" className={styles.photo} />
            <img src="/assets/pose2layout4.png" alt="Pose 2" className={styles.photo} />
            <img src="/assets/pose3layout4.png" alt="Pose 3" className={styles.photo} />
            <img src="/assets/pose4layout4.png" alt="Pose 4" className={styles.photo} />
            <img src="/assets/pose5layout4.png" alt="Pose 5" className={styles.photo} />
            <img src="/assets/pose6layout4.png" alt="Pose 6" className={styles.photo} />
            <div className={styles.layoutLabel}>6 Pose</div>
          </div>
        </div>
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
