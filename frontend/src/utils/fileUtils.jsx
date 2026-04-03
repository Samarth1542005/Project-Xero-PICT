import React from 'react';

export const EXT_MAP = {
  image: ["PNG", "JPG", "JPEG", "WEBP", "GIF", "BMP", "TIFF"],
  video: ["MP4", "MOV", "AVI", "WEBM", "MKV", "FLV"],
  audio: ["MP3", "WAV", "OGG", "M4A", "FLAC", "AAC"],
};

export function getType(filename) {
  const ext = filename.split(".").pop().toUpperCase();
  if (EXT_MAP.image.includes(ext)) return "image";
  if (EXT_MAP.video.includes(ext)) return "video";
  if (EXT_MAP.audio.includes(ext)) return "audio";
  return "unknown";
}

export function isValidImageType(file) {
  return file.type.startsWith('image/');
}

export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename) {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toUpperCase();
}

export function getVerdictMeta(verdict) {
  const meta = {
    real: { label: 'Authentic', color: 'var(--color-real)' },
    fake: { label: 'Deepfake', color: 'var(--color-fake)' },
    suspicious: { label: 'Suspicious', color: 'var(--color-suspicious)' },
  };
  return meta[verdict] || { label: 'Unknown', color: 'var(--color-text-muted)' };
}

export async function simulateAnalysis(file) {
  await new Promise(r => setTimeout(r, 2200 + Math.random() * 1500));
  const rand = Math.random();
  const verdict = rand > 0.6 ? 'fake' : (rand > 0.35 ? 'suspicious' : 'real');
  const confidence = Math.floor(75 + rand * 24);
  
  const explanations = {
    fake: "Our neural pipeline has detected significant forensic artifacts in the primary facial region. We've identified inconsistent pixel gradients that do not align with natural skin subsurface scattering. Additionally, high-frequency noise analysis reveals localized frequency peaks commonly associated with GAN-based generation methods. Multiple temporal jitters were also found in the orbital regions, suggesting that this media was manipulated using an advanced auto-encoder architecture. The forensic probability of this being a synthetic asset is extremely high.",
    suspicious: "The analysis shows minor architectural anomalies in the eye regions and unusual lighting global-consistency scores. While the primary facial features appear consistent, there is a measurable discrepancy in the background's semantic continuity compared to the foreground subjects. We recommend manual review of these specific forensic indicators before final validation.",
    real: "After a comprehensive multi-modal forensic audit, no traces of structural or architectural manipulation were found. The image maintains consistent grain noise, natural lighting gradients, and perfect semantic continuity across all detected regions. Neural confidence for authenticity is established within high-certainty parameters."
  };

  const regions = verdict === 'real' ? [] : [
    { id: 'r1', label: 'Face Gradients', x: 30, y: 25, w: 40, h: 45, color: '#ef4444', issueId: 'i1' },
    { id: 'r2', label: 'Eye Artifacts', x: 38, y: 38, w: 24, h: 10, color: '#f59e0b', issueId: 'i2' },
    { id: 'r3', label: 'Lip Sync Jitter', x: 42, y: 55, w: 16, h: 8, color: '#f59e0b', issueId: 'i3' },
    { id: 'r4', label: 'Ear Blurring', x: 26, y: 40, w: 6, h: 12, color: '#22d3ee', issueId: 'i4' },
    { id: 'r5', label: 'Hair Line Grain', x: 32, y: 20, w: 35, h: 15, color: '#ef4444', issueId: 'i5' }
  ];

  const issues = verdict === 'real' ? [] : [
    { id: 'i1', label: 'Neural surface scattering anomaly detected on right cheek region.', severity: 'high' },
    { id: 'i2', label: 'Bilateral asymmetry in orbital reflections confirms synthetic origin.', severity: 'medium' },
    { id: 'i5', label: 'Frequency-domain noise mismatch at hair-background boundary.', severity: 'high' },
    { id: 'i3', label: 'Temporal Lip-Sync inconsistency detected (Latent mismatch).', severity: 'medium' },
    { id: 'i4', label: 'Peripheral ear region shows semantic blur artifacts.', severity: 'low' },
    { id: 'i6', label: 'Unexpected spectral peak at 14.2kHz (Spatial Noise).', severity: 'medium' },
    { id: 'i7', label: 'Subtle lighting vector divergence in background shadows.', severity: 'low' }
  ];

  return { verdict, confidence, regions, issues, explanation: explanations[verdict] };
}

export const TYPE_ICON = {
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
  video: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
    </svg>
  ),
  audio: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  unknown: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7.5 20 7.5"/>
    </svg>
  ),
};

export const TYPE_LABEL = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  unknown: "File",
};
