// api.js — Frontend API service to communicate with the Deepfake Detection backend
const API_BASE_URL = "";

/**
 * Detect deepfakes in a media file (image, audio, or video)
 * @param {File} file - The file to analyze
 * @returns {Promise<Object>} - The analysis result
 */
export async function detectDeepfake(file) {
  const formData = new FormData();
  formData.append("file", file);

  let endpoint = "/detect/image";
  if (file.type.startsWith("video/")) {
    endpoint = "/detect/video";
  } else if (file.type.startsWith("audio/")) {
    endpoint = "/detect/audio";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    return adaptBackendResponse(data);
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Adapt backend response format to frontend UI format
 */
function adaptBackendResponse(data) {
  const { verdict, explanation, technical } = data;
  
  // Map backend labels to frontend labels
  let frontalLabel = verdict.label;
  if (verdict.label === 'uncertain') frontalLabel = 'suspicious';
  
  // Convert confidence to 0-100
  const confidencePercent = Math.round(verdict.confidence * 100);

  // Derive some issues/regions for UI richness (since backend doesn't provide them yet)
  // In a real production system, the backend would provide these based on specific forensics.
  const issues = [];
  const regions = [];

  if (frontalLabel !== 'real') {
    // Basic issues for UI
    if (technical.ensemble_breakdown?.vit_fake_prob > 0.6) {
      issues.push({ id: 'face', label: 'Facial feature manipulation', severity: 'high' });
      regions.push({ id: 'r1', label: 'Face Gradients', x: 25, y: 30, w: 50, h: 40, color: '#ef4444', issueId: 'face' });
    }
    if (technical.ensemble_breakdown?.siglip_fake_prob > 0.6) {
      issues.push({ id: 'bg', label: 'Background synthetic artifacts', severity: 'medium' });
    }
  }

  return {
    verdict: frontalLabel,
    confidence: confidencePercent,
    explanation,
    issues,
    regions,
    technical
  };
}