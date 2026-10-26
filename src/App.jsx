import { useRef, useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [beforeImage, setBeforeImage] = useState(null)
  const [afterImage, setAfterImage] = useState(null)
  const [notice, setNotice] = useState('')
const [changeResult, setChangeResult] = useState(null)
const [sensitivity, setSensitivity] = useState(35)
const [history, setHistory] = useState([])
const [observations, setObservations] = useState('')

const [reportGenerated, setReportGenerated] = useState(false)
const [analysisId] = useState(`GEO-${Math.floor(Math.random() * 100000)}`)

  const beforeRef = useRef(null)
  const afterRef = useRef(null)

  const navItems = [
    { icon: '◫', label: 'Overview' },
    { icon: '▧', label: 'Image Analysis' },
    { icon: '⌖', label: 'Observations' },
    { icon: '▤', label: 'Reports' },
  ]

  function handleImage(event, type) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setNotice('Please select a valid image file.')
      return
    }

    const url = URL.createObjectURL(file)

    if (type === 'before') {
      setBeforeImage((old) => {
        if (old) URL.revokeObjectURL(old.url)
        return { url, name: file.name }
      })
    } else {
      setAfterImage((old) => {
        if (old) URL.revokeObjectURL(old.url)
        return { url, name: file.name }
      })
    }

    setNotice('Image uploaded successfully.')
  }

  async function startAnalysis() {
  if (!beforeImage || !afterImage) {
    setNotice('Upload both images before starting the analysis.')
    setActiveTab('Image Analysis')
    return
  }

  try {
    setNotice('Comparing images...')

    const loadImage = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })

    const [imgA, imgB] = await Promise.all([
      loadImage(beforeImage.url),
      loadImage(afterImage.url),
    ])

    const width = 320
    const height = 240
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas unavailable')

    ctx.drawImage(imgA, 0, 0, width, height)
    const a = ctx.getImageData(0, 0, width, height)

    ctx.drawImage(imgB, 0, 0, width, height)
    const b = ctx.getImageData(0, 0, width, height)

    const output = ctx.createImageData(width, height)
    let changed = 0

    for (let i = 0; i < a.data.length; i += 4) {
      const difference =
        (Math.abs(a.data[i] - b.data[i]) +
          Math.abs(a.data[i + 1] - b.data[i + 1]) +
          Math.abs(a.data[i + 2] - b.data[i + 2])) / 3

      if (difference > sensitivity) {
        output.data[i] = 255
        output.data[i + 1] = 91
        output.data[i + 2] = 74
        output.data[i + 3] = 220
        changed++
      } else {
        output.data[i] = b.data[i]
        output.data[i + 1] = b.data[i + 1]
        output.data[i + 2] = b.data[i + 2]
        output.data[i + 3] = 255
      }
    }

    ctx.putImageData(output, 0, 0)

    setChangeResult({
      overlay: canvas.toDataURL('image/png'),
      percent: (changed / (width * height)) * 100,
    })
    setHistory((prev) => [
  {
    id: `GEO-${Date.now()}`,
    percent: (changed / (width * height)) * 100,
  },
  ...prev.slice(0, 4),
])

    setNotice('Comparison complete!')
    setActiveTab('Image Analysis')
  } catch (error) {
    console.error(error)
    setNotice('Comparison failed. Please try uploading both images again.')
  }
}

  

  function resetImages() {
   
    if (beforeImage) URL.revokeObjectURL(beforeImage.url)
    if (afterImage) URL.revokeObjectURL(afterImage.url)
    setBeforeImage(null)
    setAfterImage(null)
    setNotice('Images cleared.')
    if (beforeRef.current) beforeRef.current.value = ''
    if (afterRef.current) afterRef.current.value = ''
  }
 function downloadReport() {
  if (!changeResult) return

  const report = `
GEOINTEL REPORT

Analysis ID: ${analysisId}

Date: ${new Date().toLocaleString()}

Detected Change:
${changeResult.percent.toFixed(1)}%

Observations:
${observations || "No observations entered."}

Summary:
Visual differences detected between uploaded imagery.

Confidence Notice:
Results are based on pixel comparison and require human verification.
`

  const blob = new Blob([report], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${analysisId}.txt`
  a.click()

  URL.revokeObjectURL(url)
}
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-mark">G<span>✳</span></span>
          <span className="brand-name">
            GEOINTEL
            <small>GEOSPATIAL INTELLIGENCE</small>
          </span>
        </a>

        <div className="side-label">WORKSPACE</div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeTab === item.label ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.label)
                setNotice('')
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.label === 'Image Analysis' && (
                <span className="nav-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <span className="live-dot" />
            <div>
              <strong>System operational</strong>
              <small>Local demo environment</small>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">GI</div>
            <div className="profile-info">
              <strong>Analysis Team</strong>
              <small>Project workspace</small>
            </div>
            <span className="profile-menu">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{activeTab}
          </div>
          <div className="topbar-right">
            <span className="environment">
              <span className="live-dot" /> DEMO ENVIRONMENT
            </span>
            <div className="top-avatar">GI</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                GEOSPATIAL INTELLIGENCE PLATFORM
              </div>
              <h1>
                See what <span>changed.</span>
              </h1>
              <p>
                Compare imagery. Detect visual changes. Turn observations
                into actionable insights.
              </p>
            </div>
            <div className="date-chip">
              <span>◷</span> LIVE WORKSPACE
            </div>
          </section>

          <section className="hero-panel">
            <div className="hero-grid" />
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />

            <div className="hero-copy">
              <div className="hero-badge">
                <span className="live-dot" /> GEOSPATIAL ANALYTICS
              </div>
              <h2>
                Understand the
                <br />
                <span>changing world.</span>
              </h2>
              <p>
                Bring two images together and explore where the landscape
                may have changed over time.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  setActiveTab('Image Analysis')
                  document.getElementById('analysis')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
              >
                Start an analysis <span>↗</span>
              </button>
            </div>

            <div className="radar-visual" aria-hidden="true">
              <div className="radar-ring ring-one" />
              <div className="radar-ring ring-two" />
              <div className="radar-ring ring-three" />
              <div className="radar-cross horizontal" />
              <div className="radar-cross vertical" />
              <div className="radar-sweep" />
              <span className="radar-point point-one" />
              <span className="radar-point point-two" />
              <span className="radar-point point-three" />
              <div className="radar-center">G<span>✳</span></div>
              <div className="radar-tag tag-top">VISUAL SCAN</div>
              <div className="radar-tag tag-bottom">SPATIAL INTELLIGENCE</div>
            </div>

            <div className="hero-index">01 — MONITOR / ANALYZE / REPORT</div>
          </section>
<article className="stat-card">
  <div className="stat-top">
    <span>MISSION STATUS</span>
    <span className="stat-icon">✓</span>
  </div>

  <div className="stat-value">
    Operational
  </div>

  <div className="stat-foot">
    Ready for reconnaissance analysis
  </div>

  <div className="stat-line">
    <span />
  </div>
</article>
          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>WORKSPACE STATUS</span>
                <span className="stat-icon">◉</span>
              </div>
              <div className="stat-value">
                Ready <span className="status-pill">● Online</span>
              </div>
              <div className="stat-foot">Ready for image uploads</div>
              <div className="stat-line"><span /></div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>IMAGES LOADED</span>
                <span className="stat-icon">▧</span>
              </div>
              <div className="stat-value">
                {Number(Boolean(beforeImage)) + Number(Boolean(afterImage))}
                <span className="stat-unit">/ 2</span>
              </div>
              <div className="stat-foot">Comparison image slots</div>
              <div className="stat-line"><span /></div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>ANALYSIS MODE</span>
                <span className="stat-icon">⌁</span>
              </div>
              <div className="stat-value">Visual</div>
              <div className="stat-foot">Change detection in development</div>
              <div className="stat-line"><span /></div>
            </article>
          </section>

          <section className="analysis-section" id="analysis">
            <div className="section-heading">
              <div>
                <div className="section-kicker">YOUR WORKSPACE</div>
                <h2>Image comparison</h2>
                <p>Upload two images of the same area taken at different times.</p>
              </div>
              <span className="step-indicator">STEP 01 <span>/ 03</span></span>
            </div>

            {notice && (
              <div className="notice" role="status">
                <span>ⓘ</span> {notice}
                <button onClick={() => setNotice('')} aria-label="Dismiss">
                  ×
                </button>
              </div>
            )}

            <div className="comparison-grid">
              <div className="image-card">
                <div className="image-card-header">
                  <div className="image-label">
                    <span className="image-number">A</span>
                    <div>
                      <strong>Reference image</strong>
                      <small>EARLIER CAPTURE</small>
                    </div>
                  </div>
                  <span className="image-time">T₁</span>
                </div>

                <input
                  ref={beforeRef}
                  className="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e, 'before')}
                />

                <button
                  className={`image-dropzone ${beforeImage ? 'has-image' : ''}`}
                  onClick={() => beforeRef.current?.click()}
                >
                  {beforeImage ? (
                    <>
                      <img src={beforeImage.url} alt="Earlier reference" />
                      <span className="image-overlay-label">
                        <span className="live-dot" /> REFERENCE LOADED
                      </span>
                    </>
                  ) : (
                    <span className="upload-content">
                      <span className="upload-icon">↑</span>
                      <strong>Upload reference image</strong>
                      <span>Click to browse your files</span>
                      <small>JPG, PNG or WEBP</small>
                    </span>
                  )}
                </button>

                <div className="image-card-footer">
                  <span className={beforeImage ? 'file-ready' : ''}>
                    <span className="mini-dot" />
                    {beforeImage ? beforeImage.name : 'Awaiting image'}
                  </span>
                  <span>{beforeImage ? 'READY' : 'NO DATA'}</span>
                </div>
              </div>

              <div className="comparison-connector">
                <span>→</span>
                <small>COMPARE</small>
              </div>

              <div className="image-card">
                <div className="image-card-header">
                  <div className="image-label">
                    <span className="image-number current">B</span>
                    <div>
                      <strong>Latest image</strong>
                      <small>RECENT CAPTURE</small>
                    </div>
                  </div>
                  <span className="image-time">T₂</span>
                </div>

                <input
                  ref={afterRef}
                  className="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage(e, 'after')}
                />

                <button
                  className={`image-dropzone ${afterImage ? 'has-image' : ''}`}
                  onClick={() => afterRef.current?.click()}
                >
                  {afterImage ? (
                    <>
                      <img src={afterImage.url} alt="Latest capture" />
                      <span className="image-overlay-label">
                        <span className="live-dot" /> LATEST IMAGE LOADED
                      </span>
                    </>
                  ) : (
                    <span className="upload-content">
                      <span className="upload-icon">↑</span>
                      <strong>Upload latest image</strong>
                      <span>Click to browse your files</span>
                      <small>JPG, PNG or WEBP</small>
                    </span>
                  )}
                </button>

                <div className="image-card-footer">
                  <span className={afterImage ? 'file-ready' : ''}>
                    <span className="mini-dot" />
                    {afterImage ? afterImage.name : 'Awaiting image'}
                  </span>
                  <span>{afterImage ? 'READY' : 'NO DATA'}</span>
                </div>
              </div>
            </div>
{changeResult && (
  <section className="results-panel">
    <div className="section-kicker">COMPARISON RESULTS</div>
    <h3>Visual change overview</h3>
    <p>
      <strong>{changeResult.percent.toFixed(1)}%</strong> of pixels
      were flagged as visually different.
    </p>

    <label className="sensitivity-control">
      <span>Detection sensitivity</span>
      <strong>{sensitivity}</strong>
      <input
        type="range"
        min="10"
        max="100"
        value={sensitivity}
        onChange={(event) => setSensitivity(Number(event.target.value))}
        onMouseUp={() => setNotice('Sensitivity changed. Run the analysis again to update results.')}
        onTouchEnd={() => setNotice('Sensitivity changed. Run the analysis again to update results.')}
      />
    </label>

    <div
    className="results-image-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "15px",
    marginTop: "20px"
  }}
>

  <div>
    <h4>Before</h4>

    <img
      src={beforeImage.url}
      alt="Before"
      className="result-overlay"
    />
  </div>

  <div>
    <h4>After</h4>

    <img
      src={afterImage.url}
      alt="After"
      className="result-overlay"
    />
  </div>

  <div>
    <h4>Detected Changes</h4>

    <img
      src={changeResult.overlay}
      alt="Overlay"
      className="result-overlay"
    />
  </div>

</div>

    <p className="result-disclaimer">
      Red highlights indicate pixel differences, not confirmed real-world
      changes. Lighting, shadows, alignment and image scaling may affect
      results. Review findings before drawing conclusions.
    </p>

    <button className="secondary-button" onClick={startAnalysis}>
      Re-run comparison
    </button>
    <button
  className="primary-button"
  onClick={() => setReportGenerated(true)}
>
  Generate Report
</button>

<button
  className="secondary-button"
  onClick={downloadReport}
>
  Download Report
</button>

  </section>
)}
<div className="results-panel">
  <div className="section-kicker">OBSERVATIONS</div>

  <h3>Analyst Notes</h3>

  <textarea
    value={observations}
    onChange={(e) => setObservations(e.target.value)}
    placeholder="Enter observations about detected changes..."
    style={{
      width: '100%',
      minHeight: '120px',
      marginTop: '15px',
      background: '#141d17',
      color: '#ffffff',
      border: '1px solid #405342',
      padding: '12px',
      borderRadius: '8px'
    }}
  />
</div>
{reportGenerated && changeResult && (
  <section className="results-panel">
    <div className="section-kicker">
      INTELLIGENCE REPORT
    </div>

    <h3>GeoIntel Analysis Report</h3>

    <p>
      <strong>Analysis ID:</strong> {analysisId}
    </p>

    <p>
      <strong>Date:</strong> {new Date().toLocaleString()}
    </p>

    <p>
      <strong>Detected Change:</strong>{" "}
      {changeResult.percent.toFixed(1)}%
      <p>
  <strong>Confidence:</strong>{" "}
  {changeResult.percent > 20
    ? "🟢 High"
    : changeResult.percent > 5
    ? "🟡 Medium"
    : "🔴 Low"}
</p>

    </p>

    <p>
      <strong>Observations:</strong>
      <br />
      {observations || "No observations entered."}
    </p>

    <p>
      <strong>Summary:</strong>
      <br />
      Visual differences detected between uploaded
      imagery.
    </p>

    <p className="result-disclaimer">
      Confidence Notice: Results are generated from
      pixel-based image comparison. Findings require
      human verification.
    </p>
  </section>
)}
<div className="results-panel">
  <div className="section-kicker">
    RECENT ANALYSES
  </div>

  <h3>Analysis History</h3>

  {history.length === 0 ? (
    <p>No analyses performed yet.</p>
  ) : (
    history.map((item) => (
      <p key={item.id}>
        {item.id} - {item.percent.toFixed(1)}%
      </p>
    ))
  )}
</div>

            <div className="analysis-actions">
              <div className="privacy-note">
                <span>◈</span>
                Images are previewed locally in your browser.
              </div>
              <div className="action-buttons">
                <button className="secondary-button" onClick={resetImages}>
                  Reset
                </button>
                <button className="primary-button analyze-button" onClick={startAnalysis}>
                  Prepare analysis <span>↗</span>
                </button>
              </div>
            </div>
          </section>

          <section className="bottom-grid">
            <article className="info-panel">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">HOW IT WORKS</div>
                  <h3>From imagery to insight</h3>
                </div>
                <span className="panel-symbol">✳</span>
              </div>
              <div className="workflow">
                <div className="workflow-step">
                  <span>01</span>
                  <div><strong>Collect</strong><small>Upload two images</small></div>
                </div>
                <div className="workflow-line" />
                <div className="workflow-step">
                  <span>02</span>
                  <div><strong>Compare</strong><small>Identify visual differences</small></div>
                </div>
                <div className="workflow-line" />
                <div className="workflow-step">
                  <span>03</span>
                  <div><strong>Report</strong><small>Review findings</small></div>
                </div>
              </div>
            </article>
<article className="info-panel">
  <div className="section-kicker">
    AREA OF INTEREST
  </div>

  <h3>Demo Coordinates</h3>

  <p>
    Latitude: 28.4595° N
    <br />
    Longitude: 77.0266° E
  </p>

  <p>
    SIMULATED DEMO DATA
  </p>
</article>
            <article className="info-panel integrity-panel">
              <div className="section-kicker">DATA INTEGRITY</div>
              <h3>Evidence first.</h3>
              <p>
                Visual differences can be caused by lighting, shadows,
                clouds or image alignment. Findings need human review.
              </p>
              <div className="integrity-footer">
                <span className="live-dot" /> REVIEW-ASSISTED ANALYSIS
              </div>
            </article>
          </section>

          <footer className="footer">
            <span>GEOINTEL <span className="footer-separator">/</span> HACKATHON DEMO</span>
            <span>BUILT FOR SPATIAL AWARENESS <span className="footer-cross">✳</span></span>
          </footer>
        </div>
      </main>
    </div>
  )

}

export default App 