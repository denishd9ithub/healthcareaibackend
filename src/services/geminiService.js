const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

function buildUtterancesText(utterances) {
  return utterances
    .map((u) => `[Speaker ${u.speaker}] ${u.transcript}`)
    .join('\n');
}

async function identifyDoctorAndPatient(utterances) {
  if (!genAI) return { doctorSpeaker: 0, patientSpeaker: 1, formatted: buildUtterancesText(utterances) };
  const text = buildUtterancesText(utterances);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `You are analyzing a medical conversation transcript. Each line is labeled as Speaker 0 or Speaker 1 (or more). Determine which speaker is the DOCTOR and which is the PATIENT based on content (who asks clinical questions, gives diagnoses, prescribes; who describes symptoms, answers about themselves). Reply with ONLY a JSON object, no markdown, no extra text: {"doctorSpeaker": <number>, "patientSpeaker": <number>}. Example: {"doctorSpeaker": 0, "patientSpeaker": 1}. Transcript:\n\n${text}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  const str = response.text().trim().replace(/^```json?\s*|\s*```$/g, '');
  try {
    return JSON.parse(str);
  } catch {
    return { doctorSpeaker: 0, patientSpeaker: 1 };
  }
}

async function formatTranscriptByRole(utterances, doctorSpeaker, patientSpeaker) {
  const lines = [];
  for (const u of utterances) {
    const role = u.speaker === doctorSpeaker ? 'Doctor' : u.speaker === patientSpeaker ? 'Patient' : `Speaker ${u.speaker}`;
    lines.push(`[${role}] ${u.transcript}`);
  }
  return lines.join('\n\n');
}

async function analyzeClinical(transcriptFormatted) {
  if (!genAI) return { summary: '', clinical_notes: '', findings: [], recommendations: [], raw_response: '' };
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = `You are a clinical assistant. Analyze this doctor-patient conversation transcript and provide structured clinical reasoning and analysis. Reply with a JSON object only (no markdown, no code block), with these exact keys: "summary" (brief visit summary), "clinical_notes" (key clinical notes), "findings" (array of strings), "recommendations" (array of strings). Use empty strings/arrays if not applicable.\n\nTranscript:\n\n${transcriptFormatted}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/^```json?\s*|\s*```$/g, '');
  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || '',
      clinical_notes: parsed.clinical_notes || '',
      findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      raw_response: text,
    };
  } catch {
    return { summary: '', clinical_notes: '', findings: [], recommendations: [], raw_response: text };
  }
}

module.exports = {
  identifyDoctorAndPatient,
  formatTranscriptByRole,
  analyzeClinical,
  buildUtterancesText,
};
