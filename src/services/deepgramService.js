const config = require('../config/env');

async function transcribe(buffer, contentType = 'audio/mpeg') {
  const params = new URLSearchParams({
    model: 'nova-3-medical',
    diarize: 'true',
    punctuate: 'true',
    utterances: 'true',
    smart_format: 'true',
    language: 'en',
  });
  const url = `https://api.deepgram.com/v1/listen?${params}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${config.deepgramApiKey}`,
      'Content-Type': contentType,
    },
    body: buffer,
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Deepgram error ${response.status}: ${errBody}`);
  }
  const data = await response.json();
  const channel = data.results?.channels?.[0];
  if (!channel) throw new Error('No transcription results');


  const alternatives = channel.alternatives?.[0];
  const utterances = data.results?.utterances || channel.utterances || [];
  
  const rawTranscript = alternatives?.transcript || '';
  const duration = data.metadata?.duration;
  return {
    rawTranscript,
    duration,
    utterances: utterances.map((u) => ({
      speaker: u.speaker,
      transcript: u.transcript,
      start: u.start,
      end: u.end,
    })),
    fullResponse: data,
  };
}

module.exports = { transcribe };
