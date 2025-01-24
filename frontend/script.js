document.getElementById('startPractice').addEventListener('click', async () => {
  const audio = await recordAudio();
  console.log('Recorded audio data:', audio); // Log audio data
  try {
    const response = await fetch('http://localhost:3000/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio }),
    });
    const data = await response.json();
    console.log('Received response:', data); // Log response
    if (data.transcription) {
      document.getElementById('transcription').innerText = `Transcription: ${data.transcription}`;
      document.getElementById('scores').innerHTML = `
        <p>Scores:</p>
        <ul>
          <li>Fluency: ${data.scores.fluency.toFixed(2)}</li>
          <li>Lexical Resource: ${data.scores.lexical.toFixed(2)}</li>
          <li>Grammar: ${data.scores.grammar.toFixed(2)}</li>
          <li>Pronunciation: ${data.scores.pronunciation.toFixed(2)}</li>
        </ul>
      `;
    } else {
      document.getElementById('transcription').innerText = 'Error: Failed to transcribe audio.';
    }
  } catch (error) {
    console.error('Error in practice mode:', error);
    document.getElementById('transcription').innerText = 'Error: Failed to process practice mode.';
  }
});

document.getElementById('startTest').addEventListener('click', async () => {
  await startTest();
});

document.getElementById('downloadData').addEventListener('click', async () => {
  await downloadData();
});

document.getElementById('toggleDarkMode').addEventListener('change', (event) => {
  document.body.classList.toggle('dark-mode', event.target.checked);
});

async function startTest() {
  const parts = [
    { part: 'part1', instruction: 'Step 1: Please introduce yourself.' },
    { part: 'part2', instruction: 'Step 2: Please talk about the given topic for 2 minutes.' },
    { part: 'part3', instruction: 'Step 3: Let\'s discuss the topic further.' }
  ];
  let overallScores = { fluency: 0, lexical: 0, grammar: 0, pronunciation: 0 };
  for (const { part, instruction } of parts) {
    document.getElementById('instructions').innerText = instruction;
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds to show the instruction
    const audio = await recordAudio();
    console.log(`Recorded audio data for ${part}:`, audio); // Log audio data
    const response = await fetch(`http://localhost:3000/test/${part}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio }),
    });
    const data = await response.json();
    console.log(`Received response for ${part}:`, data); // Log response
    if (data.transcription) {
      document.getElementById('transcription').innerText += `\n\n${part.toUpperCase()} Transcription: ${data.transcription}`;
      overallScores.fluency += data.scores.fluency;
      overallScores.lexical += data.scores.lexical;
      overallScores.grammar += data.scores.grammar;
      overallScores.pronunciation += data.scores.pronunciation;
    } else {
      document.getElementById('transcription').innerText += `\n\n${part.toUpperCase()} Transcription: Error: Failed to transcribe audio.`;
    }
  }
  document.getElementById('scores').innerHTML = `
    <p>Overall Scores:</p>
    <ul>
      <li>Fluency: ${(overallScores.fluency / parts.length).toFixed(2)}</li>
      <li>Lexical Resource: ${(overallScores.lexical / parts.length).toFixed(2)}</li>
      <li>Grammar: ${(overallScores.grammar / parts.length).toFixed(2)}</li>
      <li>Pronunciation: ${(overallScores.pronunciation / parts.length).toFixed(2)}</li>
    </ul>
  `;
}

async function downloadData() {
  const transcription = document.getElementById('transcription').innerText;
  const scores = document.getElementById('scores').innerText;
  const data = { transcription, scores };
  const response = await fetch('http://localhost:3000/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'IELTS_Speaking_Test_Report.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

async function recordAudio() {
  const voiceDetect = document.getElementById('voiceDetect');
  const waveform = document.getElementById('waveform');
  voiceDetect.style.display = 'block'; // Show voice detection animation
  waveform.style.display = 'block'; // Show waveform

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  const audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.start();

  await new Promise(resolve => setTimeout(resolve, 5000)); // Record for 5 seconds

  mediaRecorder.stop();

  const audioBlob = await new Promise(resolve => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(audioChunks, { type: 'audio/webm' }));
    };
  });

  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);

  return new Promise(resolve => {
    reader.onloadend = () => {
      voiceDetect.style.display = 'none'; // Hide voice detection animation
      waveform.style.display = 'none'; // Hide waveform
      resolve(reader.result.split(',')[1]); // Return base64 encoded audio
    };
  });
}

// New voice recognition script
const recordBtn = document.querySelector(".record"),
  result = document.querySelector(".result"),
  downloadBtn = document.querySelector(".download"),
  inputLanguage = document.querySelector("#language"),
  clearBtn = document.querySelector(".clear"),
  practiceModeBtn = document.querySelector("#practice-mode"),
  testModeBtn = document.querySelector("#test-mode");

let SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition,
  recognition,
  recording = false,
  mode = "practice";

if (!SpeechRecognition) {
  alert("Speech Recognition API is not supported in this browser.");
} else {
  function populateLanguages() {
    languages.forEach((lang) => {
      const option = document.createElement("option");
      option.value = lang.code;
      option.innerHTML = lang.name;
      inputLanguage.appendChild(option);
    });
  }

  populateLanguages();

  function speechToText() {
    try {
      recognition = new SpeechRecognition();
      recognition.lang = inputLanguage.value;
      recognition.interimResults = true;
      recordBtn.classList.add("recording");
      recordBtn.querySelector("p").innerHTML = "Listening...";
      recognition.start();
      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        if (event.results[0].isFinal) {
          result.innerHTML += " " + speechResult;
          result.querySelector("p").remove();
          if (mode === "practice") {
            provideFeedback(speechResult);
          } else if (mode === "test") {
            // Handle test mode logic
          }
        } else {
          if (!document.querySelector(".interim")) {
            const interim = document.createElement("p");
            interim.classList.add("interim");
            result.appendChild(interim);
          }
          document.querySelector(".interim").innerHTML = " " + speechResult;
        }
        downloadBtn.disabled = false;
      };
      recognition.onspeechend = () => {
        speechToText();
      };
      recognition.onerror = (event) => {
        stopRecording();
        handleRecognitionError(event);
      };
    } catch (error) {
      recording = false;
      console.log(error);
    }
  }

  function provideFeedback(speechResult) {
    fetch('http://localhost:5000/practice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: speechResult }),
    })
      .then(response => response.json())
      .then(data => {
        // Display feedback
        const feedbackHtml = `
          <p>Fluency: ${data.fluency.toFixed(2)}</p>
          <p>Coherence: ${data.coherence.toFixed(2)}</p>
          <p>Lexical Resource: ${data.lexicalResource.toFixed(2)}</p>
          <p>Grammar: ${data.grammar.toFixed(2)}</p>
          <p>Pronunciation: ${data.pronunciation.toFixed(2)}</p>
        `;
        result.innerHTML += feedbackHtml;
      })
      .catch(error => console.error('Error:', error));
  }

  function handleRecognitionError(event) {
    if (event.error === "no-speech") {
      alert("No speech was detected. Stopping...");
    } else if (event.error === "audio-capture") {
      alert("No microphone was found. Ensure that a microphone is installed.");
    } else if (event.error === "not-allowed") {
      alert("Permission to use microphone is blocked.");
    } else if (event.error === "aborted") {
      alert("Listening Stopped.");
    } else {
      alert("Error occurred in recognition: " + event.error);
    }
  }

  recordBtn.addEventListener("click", () => {
    if (!recording) {
      speechToText();
      recording = true;
    } else {
      stopRecording();
    }
  });

  function stopRecording() {
    if (recognition) {
      recognition.stop();
      recordBtn.querySelector("p").innerHTML = "Start Listening";
      recordBtn.classList.remove("recording");
      recording = false;
    }
  }

  function download() {
    const text = result.innerText;
    const filename = "speech.txt";

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  downloadBtn.addEventListener("click", download);

  clearBtn.addEventListener("click", () => {
    result.innerHTML = "";
    downloadBtn.disabled = true;
  });

  practiceModeBtn.addEventListener("click", () => {
    mode = "practice";
    practiceModeBtn.classList.add("active");
    testModeBtn.classList.remove("active");
  });

  testModeBtn.addEventListener("click", () => {
    mode = "test";
    testModeBtn.classList.add("active");
    practiceModeBtn.classList.remove("active");
  });
}
