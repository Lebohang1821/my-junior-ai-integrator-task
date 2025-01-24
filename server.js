const express = require('express');
const bodyParser = require('body-parser');
const { SpeechClient } = require('@google-cloud/speech');
const { Configuration, OpenAIApi } = require('openai');
const pdfkit = require('pdfkit');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

const speechClient = new SpeechClient({
  keyFilename: path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS),
});
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

const evaluateFluency = (transcription) => {
  // Example logic: count the number of words and pauses
  const words = transcription.split(' ').length;
  const pauses = (transcription.match(/,/g) || []).length;
  return Math.min(9, (words - pauses) / 10); // Placeholder logic
};

const evaluateLexicalResource = (transcription) => {
  // Example logic: count unique words
  const words = transcription.split(' ');
  const uniqueWords = new Set(words).size;
  return Math.min(9, uniqueWords / 10); // Placeholder logic
};

const evaluateGrammar = (transcription) => {
  // Example logic: count sentences and errors
  const sentences = transcription.split('.').length;
  const errors = (transcription.match(/(is|are|was|were|has|have|had|do|does|did|will|would|shall|should|may|might|must|can|could|ought|need|dare)/g) || []).length;
  return Math.min(9, (sentences - errors) / 10); // Placeholder logic
};

const evaluatePronunciation = (transcription) => {
  // Example logic: count phonemes (simplified)
  const phonemes = transcription.length / 3; // Simplified logic
  return Math.min(9, phonemes / 10); // Placeholder logic
};

const generateFeedback = (transcription) => {
  // Example feedback logic
  const correctedSentences = transcription.replace(/is/g, 'was'); // Placeholder logic
  const pronunciationTips = 'Try to pronounce "th" sounds more clearly.'; // Placeholder logic
  const vocabularySuggestions = 'Use more advanced vocabulary like "elaborate" instead of "explain".'; // Placeholder logic
  return { correctedSentences, pronunciationTips, vocabularySuggestions };
};

app.post('/transcribe', async (req, res) => {
  try {
    const audio = req.body.audio;
    console.log('Received audio data:', audio); // Log audio data
    const [response] = await speechClient.recognize({
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      },
      audio: {
        content: audio,
      },
    });
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
    console.log('Transcription:', transcription); // Log transcription
    res.json({ transcription });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

app.post('/respond', async (req, res) => {
  try {
    const userInput = req.body.input;
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Simulate an IELTS examiner response to: ${userInput}`,
      max_tokens: 150,
    });
    res.json({ response: response.data.choices[0].text });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.post('/generate-pdf', (req, res) => {
  try {
    const { transcription, scores, feedback } = req.body;
    const doc = new pdfkit();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="IELTS_Speaking_Test_Report.pdf"');
    doc.pipe(res);
    doc.text('IELTS Speaking Test Report', { align: 'center' });
    doc.text(`\nTranscription:\n${transcription}`);
    doc.text('\nScores:');
    doc.text(scores);
    doc.text('\nFeedback:');
    doc.text(feedback);
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.post('/practice', async (req, res) => {
  try {
    const audio = req.body.audio;
    console.log('Received audio data for practice mode:', audio); // Log audio data
    const [response] = await speechClient.recognize({
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      },
      audio: {
        content: audio,
      },
    });
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
    console.log('Transcription for practice mode:', transcription); // Log transcription
    const fluency = evaluateFluency(transcription);
    const lexical = evaluateLexicalResource(transcription);
    const grammar = evaluateGrammar(transcription);
    const pronunciation = evaluatePronunciation(transcription);
    const feedback = generateFeedback(transcription);
    res.json({ transcription, scores: { fluency, lexical, grammar, pronunciation }, feedback });
  } catch (error) {
    console.error('Error in practice mode:', error);
    res.status(500).json({ error: 'Failed to process practice mode', details: error.message });
  }
});

app.post('/test/:part', async (req, res) => {
  try {
    const audio = req.body.audio;
    const part = req.params.part;
    console.log(`Processing test mode for ${part}`); // Log part being processed
    const [response] = await speechClient.recognize({
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      },
      audio: {
        content: audio,
      },
    });
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
    console.log(`Transcription for ${part}:`, transcription); // Log transcription
    const fluency = evaluateFluency(transcription);
    const lexical = evaluateLexicalResource(transcription);
    const grammar = evaluateGrammar(transcription);
    const pronunciation = evaluatePronunciation(transcription);
    const feedback = generateFeedback(transcription);
    res.json({ transcription, scores: { fluency, lexical, grammar, pronunciation }, feedback, part });
  } catch (error) {
    console.error(`Error in test mode (${req.params.part}):`, error);
    res.status(500).json({ error: `Failed to process test mode (${req.params.part})`, details: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
