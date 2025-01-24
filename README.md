# IELTS Speaking Test Simulation

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd junior-ai-integrator-task
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key
     ```
   - Add the path to your Google Cloud service account JSON file:
     ```
     GOOGLE_APPLICATION_CREDENTIALS=./speech-to-text-project.json
     ```

4. Run the server:
   ```bash
   npm start
   ```

5. Serve the frontend files:
   - Navigate to the `frontend` directory.
   - Run `http-server` to serve the frontend files:
     ```bash
     http-server
     ```

6. Open the frontend:
   - Open the provided URL (e.g., `http://localhost:8080`) in your web browser.

## API Endpoints

- `POST /transcribe`: Transcribe audio to text using Google Speech-to-Text.
- `POST /respond`: Get a simulated IELTS examiner response using OpenAI.
- `POST /practice`: Practice mode with instant feedback.
- `POST /test/:part`: Test mode with full IELTS Speaking Test.
  - `part1`: Introduction
  - `part2`: Long Turn (Cue Card Activity)
  - `part3`: Two-Way Discussion
- `POST /generate-pdf`: Generate a PDF report with scores and feedback.

## Documentation

### LLM Integration
- Integrated OpenAI API for generating examiner responses.

### Scoring System
- Evaluates fluency, lexical resource, grammatical range, and pronunciation.

### Challenges
- Ensuring real-time transcription with minimal delay.
- Providing accurate and helpful feedback.

## Demo Video

[Link to Demo Video](#)#   j u n i o r - a i - i n t e g r a t o r - t a s k  
 