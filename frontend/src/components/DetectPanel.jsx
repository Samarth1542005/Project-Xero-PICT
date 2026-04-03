// DetectPanel.jsx — Core analysis panel (upload + results + visual explainability)
import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Image as ImageIcon, CheckCircle2, XCircle, AlertTriangle,
  Eye, EyeOff, Layers, RefreshCw, Loader2, Info, File
} from 'lucide-react';
import FileRow from './FileRow';
import { isImage, createPreviewUrl, simulateAnalysis, getVerdictMeta } from '../utils/fileUtils';
import { detectDeepfake } from '../services/api'; 
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const VERDICT_ICON = {
  real:       <CheckCircle2 size={22} />,
  fake:       <XCircle      size={22} />,
  suspicious: <AlertTriangle size={22} />,
};

const VERDICT_COLOR = {
  real:       'var(--color-real)',
  fake:       'var(--color-fake)',
  suspicious: 'var(--color-suspicious)',
};

const VERDICT_GLOW = {
  real:       'var(--color-real-glow)',
  fake:       'var(--color-fake-glow)',
  suspicious: 'var(--color-suspicious-glow)',
};

/* ── Region Overlay ── */
function RegionOverlay({ regions, activeRegion, setActiveRegion, showHeatmap }) {
  if (!showHeatmap || !regions?.length) return null;
  return (
    <>
      {regions.map((r) => {
        const isActive = activeRegion === r.id || activeRegion === r.issueId;
        return (
          <div
            key={r.id}
            className={`region-box ${isActive ? 'highlighted' : ''}`}
            onMouseEnter={() => setActiveRegion(r.id)}
            onMouseLeave={() => setActiveRegion(null)}
            style={{
              left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`,
              borderColor: r.color, color: r.color,
              backgroundColor: isActive ? `${r.color}20` : `${r.color}08`,
              boxShadow: isActive ? `0 0 0 2px ${r.color}, 0 0 20px ${r.color}60` : 'none',
            }}
          >
            <span className="region-label" style={{ background: r.color, color: '#000' }}>
              {r.label}
            </span>
          </div>
        );
      })}
    </>
  );
}

/* ── Scan Animation ── */
function ScanAnimation({ active }) {
  if (!active) return null;
  return (
    <div className="scan-overlay" style={{ position: 'absolute', inset: 0, zIndex: 5, overflow: 'hidden' }}>
      <div className="scanline-overlay" />
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => {
        const s = {
          'top-left':     { top: 12, left: 12,   borderRight: 'none', borderBottom: 'none' },
          'top-right':    { top: 12, right: 12,   borderLeft:  'none', borderBottom: 'none' },
          'bottom-left':  { bottom: 12, left: 12,  borderRight: 'none', borderTop: 'none' },
          'bottom-right': { bottom: 12, right: 12, borderLeft:  'none', borderTop: 'none' },
        };
        return <div key={pos} style={{ position: 'absolute', width: 24, height: 24, border: '2px solid var(--color-cyan)', ...s[pos], opacity: 0.8 }} />;
      })}
    </div>
  );
}

/* ── Confidence Bar ── */
function ConfidenceBar({ value, verdict }) {
  const color = VERDICT_COLOR[verdict] || '#6366f1';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Confidence Score</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 700, color, textShadow: `0 0 16px ${color}80` }}>
          {value}%
        </span>
      </div>
      <div className="progress-track" style={{ height: '10px', borderRadius: '5px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
        <div 
          className="progress-fill" 
          style={{ 
            height: '100%',
            width: `${value}%`, 
            background: `linear-gradient(90deg, ${color}88, ${color})`, 
            boxShadow: `0 0 20px ${color}40`,
            transition: 'width 1.5s var(--ease-out-expo)',
            animation: 'drawIn 1.5s var(--ease-out-expo) both'
          }} 
        />
      </div>
    </div>
  );
}

/* ── Issue List ── */
function IssueList({ issues, activeRegion, setActiveRegion }) {
  if (!issues?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-real)', fontSize: '0.875rem' }}>
        <CheckCircle2 size={28} style={{ margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 600 }}>No anomalies detected</div>
        <div style={{ color: 'var(--color-text-subtle)', fontSize: '0.78rem', marginTop: '4px' }}>All facial features appear authentic</div>
      </div>
    );
  }
  const SEV = { high: '#ef4444', medium: '#f59e0b', low: '#22d3ee' };
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      maxHeight: '340px',
      overflowY: 'auto',
      paddingRight: '6px',
    }}>
      {issues.length > 0 ? (
        issues.map((issue, index) => {
          const isActive = activeRegion === issue.id;
          const sc = SEV[issue.severity] || '#94a3b8';
          return (
            <div
              key={issue.id}
              onMouseEnter={() => setActiveRegion(issue.id)}
              onMouseLeave={() => setActiveRegion(null)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                padding: '14px 16px', borderRadius: '12px',
                border: `1px solid ${isActive ? sc + '66' : 'var(--color-border)'}`,
                background: isActive ? `${sc}15` : 'rgba(255,255,255,0.02)',
                cursor: 'default', 
                transition: 'all var(--transition)',
                transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                animation: `fadeInUp 0.6s ${0.6 + index * 0.08}s var(--ease-out-expo) both`
              }}
            >
              <div style={{ 
                width: 32, height: 32, borderRadius: '8px', 
                background: `${sc}15`, color: sc, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: '2px'
              }}>
                <AlertTriangle size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.81rem', color: 'var(--color-text)', fontWeight: 600, marginBottom: '2px' }}>{issue.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', lineHeight: 1.4 }}>Forensic anomaly detected in localized raster data.</div>
              </div>
            </div>
          );
        })
      ) : (
        /* No anomalies detected alert row */
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 18px', borderRadius: '10px',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.15)',
          animation: 'fadeInUp 0.6s 0.6s var(--ease-out-expo) both'
        }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: '50%', 
            background: 'rgba(34,197,94,0.2)', color: '#22c55e', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={18} strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>No anomalies detected</div>
            <div style={{ fontSize: '12px', color: 'rgba(34,197,94,0.7)', fontWeight: 500 }}>All facial features appear authentic</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main DetectPanel ── */
export default function DetectPanel() {
  const [files,        setFiles]        = useState([]);
  const [selectedIdx,  setSelectedIdx]  = useState(null);
  const [dragging,     setDragging]     = useState(false);
  const [showHeatmap,  setShowHeatmap]  = useState(true);
  const [showExplain,  setShowExplain]  = useState(true);
  const [activeRegion, setActiveRegion] = useState(null);
  const fileInputRef = useRef(null);

  const current     = selectedIdx !== null ? files[selectedIdx] : null;
  const isAnalyzing = current?.status === 'analyzing';
  const verdictMeta  = current?.result ? getVerdictMeta(current.result.verdict) : null;
  const verdictColor = current?.result ? VERDICT_COLOR[current.result.verdict] : '#6366f1';

  const analyzeFile = useCallback(async (file, idx) => {
    setFiles((prev) => { const c = [...prev]; if (c[idx]) c[idx] = { ...c[idx], status: 'analyzing', error: null }; return c; });
    try {
      // Temporarily using simulation to check UI/UX changes
      const result = await simulateAnalysis(file);
      setFiles((prev) => { const c = [...prev]; if (c[idx]) c[idx] = { ...c[idx], status: result.verdict, result }; return c; });
    } catch (err) {
      setFiles((prev) => { const c = [...prev]; if (c[idx]) c[idx] = { ...c[idx], status: 'error', error: err.message }; return c; });
    }
    setSelectedIdx(idx);
  }, []);

  const addFiles = useCallback((rawFiles) => {
    const valid = Array.from(rawFiles);
    if (!valid.length) return;
    const entries = valid.map((f) => ({ file: Object.assign(f, { previewUrl: createPreviewUrl(f) }), status: 'pending', result: null }));
    setFiles((prev) => {
      const updated = [...prev, ...entries];
      if (selectedIdx === null) setSelectedIdx(prev.length);
      return updated;
    });
    entries.forEach((entry, i) => analyzeFile(entry.file, files.length + i));
  }, [files, selectedIdx, analyzeFile]);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    if (selectedIdx === idx) setSelectedIdx(null);
    else if (selectedIdx > idx) setSelectedIdx((p) => p - 1);
  }, [selectedIdx]);

  const reScan = useCallback(() => {
    if (selectedIdx === null) return;
    setActiveRegion(null);
    analyzeFile(files[selectedIdx].file, selectedIdx);
  }, [selectedIdx, files, analyzeFile]);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);

  return (
    <section id="detect" className="section" style={{ position: 'relative' }}>
      <div className="orb orb-purple" style={{ width: 500, height: 500, top: -100, right: -150, position: 'absolute', opacity: 0.5 }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="section-header">
          <div className="section-label"><Layers size={13} /> Detection Engine</div>
          <h2 className="section-title">Analyze Your Files</h2>
          <p className="section-subtitle">Upload multiple files of any format and receive a full AI-powered authenticity report with region-level visual explanation.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: current ? '1fr 1.15fr' : '1fr', gap: '24px', maxWidth: current ? '1100px' : '680px', margin: '0 auto', transition: 'all 0.4s ease' }}>

          {/* LEFT — upload + file list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Drop zone */}
            <div
              id="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                borderRadius: 'var(--radius-lg)', padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
                background: dragging ? 'rgba(99,102,241,0.07)' : 'var(--color-surface-subtle)',
                transition: 'all 0.25s ease',
                boxShadow: dragging ? '0 0 40px var(--color-accent-glow)' : 'none',
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))',
                border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                transform: dragging ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.3s',
              }}>
                <Upload size={26} color="var(--color-accent)" />
              </div>
              <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px', color: 'var(--color-text)' }}>
                {dragging ? 'Drop to analyze' : 'Drop files here or click to upload'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>Any format · up to 100 MB</p>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: '4px' }}>
                  {files.length} file{files.length !== 1 ? 's' : ''}
                </div>
                {files.map((entry, i) => (
                  <FileRow key={i} file={entry.file} status={entry.status} result={entry.result}
                    isSelected={selectedIdx === i} onSelect={() => setSelectedIdx(i)} onRemove={() => removeFile(i)} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — results */}
          {current && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeInUp 0.5s ease' }}>

              {/* Image preview */}
              <div className="card" style={{ padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ 
                  position: 'relative', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  background: '#0a0a10', 
                  minHeight: '280px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)'
                }}>
                  {/* Container that shrinks to the image size */}
                  <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '400px', display: 'inline-block' }}>
                    {current.file.previewUrl && isImage(current.file) ? (
                      <img 
                        src={current.file.previewUrl} 
                        alt="Forensic Preview" 
                        style={{ 
                          width: 'auto', 
                          maxWidth: '100%', 
                          height: 'auto', 
                          maxHeight: '400px', 
                          objectFit: 'contain', 
                          display: 'block', 
                          filter: isAnalyzing ? 'brightness(0.5) contrast(1.2)' : 'none', 
                          transition: 'all 0.4s var(--transition)' 
                        }} 
                      />
                    ) : (
                      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--color-text-subtle)' }}>
                        <File size={64} style={{ opacity: 0.2 }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Forensic preview unavailable</span>
                      </div>
                    )}

                    {/* OVERLAY: Pinned exactly to the image boundaries */}
                    {current.result && (
                      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <RegionOverlay regions={current.result.regions} activeRegion={activeRegion} setActiveRegion={setActiveRegion} showHeatmap={showHeatmap} />
                      </div>
                    )}

                    {/* SCANNER: Pinned exactly to the image boundaries */}
                    <ScanAnimation active={isAnalyzing} />
                  </div>

                  {isAnalyzing && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(1px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', zIndex: 20 }}>
                      <Loader2 size={40} color="var(--color-cyan)" style={{ animation: 'spin 0.8s linear infinite', filter: 'drop-shadow(0 0 10px var(--color-cyan-glow))' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Neural Scan Active</span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                {current.result && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {current.result.verdict !== 'real' && (
                      <button id="toggle-heatmap" onClick={() => setShowHeatmap((p) => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: showHeatmap ? 'rgba(99,102,241,0.15)' : 'var(--color-surface-subtle)', border: `1px solid ${showHeatmap ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`, color: showHeatmap ? 'var(--color-accent)' : 'var(--color-text-muted)', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s' }}>
                        {showHeatmap ? <Eye size={13} /> : <EyeOff size={13} />} Heatmap
                      </button>
                    )}
                    <button id="toggle-explain" onClick={() => setShowExplain((p) => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: showExplain ? 'rgba(34,211,238,0.1)' : 'var(--color-surface-subtle)', border: `1px solid ${showExplain ? 'rgba(34,211,238,0.3)' : 'var(--color-border)'}`, color: showExplain ? 'var(--color-cyan)' : 'var(--color-text-muted)', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s' }}>
                      <Layers size={13} /> Explanation
                    </button>
                    <button id="btn-rescan" onClick={reScan} disabled={isAnalyzing} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'var(--color-surface-subtle)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.2s', marginLeft: 'auto', opacity: isAnalyzing ? 0.5 : 1 }}>
                      <RefreshCw size={13} style={{ animation: isAnalyzing ? 'spin 0.8s linear infinite' : 'none' }} /> Re-scan
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
              {/* Result card with staggered entry */}
              {current.result && !isAnalyzing && (
                <Card 
                  className="glass-strong" 
                  style={{ 
                    background: 'var(--color-surface)',
                    border: '0.5px solid var(--color-border-strong)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    width: '100%',
                    padding: '20px',
                    animation: 'slideInRight 0.6s var(--ease-out-expo) both'
                  }}
                >
                  {/* Single Row Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', animation: 'fadeInUp 0.6s 0.1s var(--ease-out-expo) both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>REPORT</span>
                      <Badge variant="default" style={{ 
                        backgroundColor: verdictColor, 
                        color: '#fff', 
                        padding: '4px 12px',
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        border: 'none'
                      }}>
                        {verdictMeta?.label}
                      </Badge>
                    </div>
                    <RefreshCw size={15} className="opacity-40 cursor-pointer hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Neural Confidence Section — Secondary Surface Block */}
                  <div style={{ 
                    padding: '14px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '8px',
                    marginBottom: '20px',
                    animation: 'fadeInUp 0.6s 0.2s var(--ease-out-expo) both'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-subtle)', opacity: 0.5 }}>Neural Confidence</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: verdictColor, lineHeight: 1 }}>{current.result.confidence}%</div>
                    </div>
                    <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${current.result.confidence}%`, 
                        background: verdictColor, 
                        borderRadius: '99px',
                        transition: 'width 1.5s var(--ease-out-expo)',
                        animation: 'drawIn 1.5s var(--ease-out-expo) both'
                      }} />
                    </div>
                  </div>

                  {current.result.explanation && (
                    <div style={{ 
                      marginBottom: '20px', 
                      fontSize: '13px', 
                      color: 'var(--color-text-muted)', 
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      width: '100%',
                      animation: 'fadeInUp 0.8s 0.4s var(--ease-out-expo) both'
                    }}>
                      {current.result.explanation}
                    </div>
                  )}

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em', 
                      color: 'var(--color-text-subtle)', 
                      opacity: 0.5,
                      margin: '14px 0',
                      animation: 'fadeInUp 0.8s 0.5s var(--ease-out-expo) both'
                    }}>
                      Forensic Indicators
                    </div>
                    <IssueList issues={current.result.issues} activeRegion={activeRegion} setActiveRegion={setActiveRegion} />
                  </div>
                </Card>
              )}
              </div>

              {/* Analyzing placeholder */}
              {isAnalyzing && (
                <div className="card" style={{ padding: '32px', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulseGlow 2s ease infinite' }}>
                    <Loader2 size={24} color="var(--color-accent)" style={{ animation: 'spin 0.8s linear infinite' }} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>Analyzing image…</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>Running neural pipeline — this takes a few seconds</p>
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    {['Face detection', 'Feature extraction', 'Frequency analysis', 'Generating report'].map((step, i) => (
                      <div key={step} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Loader2 size={12} color="var(--color-accent)" style={{ animation: `spin ${0.8 + i * 0.15}s linear infinite`, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-subtle)' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty state hints */}
        {files.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '32px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { icon: <Upload size={20} />,                                             label: 'Drag & drop files' },
                { icon: <CheckCircle2 size={20} color="var(--color-real)" />,             label: 'Instant verdict' },
                { icon: <Eye size={20} color="var(--color-cyan)" />,                      label: 'Visual heatmap' },
              ].map((hint) => (
                <div key={hint.label} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.82rem', color: 'var(--color-text-subtle)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{hint.icon}</span> {hint.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
