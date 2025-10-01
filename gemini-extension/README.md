# Session Summary Chrome Extension

The Session & Knowledge Assistant is a Chrome extension designed to combat information overload and deepen user understanding. It operates in two modes: as a Session Assistant, it provides AI-powered summaries of browsing sessions and automatically organizes tabs; as a Knowledge Mapper, it generates self-expanding visual knowledge maps from any webpage. The extension transforms browsing chaos into structured, actionable knowledge.

## Setup and Installation

To use this extension, you will need a Gemini API key from Google.

### 1. Get Your Gemini API Key

1.  **Go to the Gemini API Website**: Open your web browser and navigate to `https://ai.google.dev/`.
2.  **Get an API Key**: Click on the **"Get API key in Google AI Studio"** button and sign in with your Google account.

### 2. Add Your API Key to the Extension

1.  **Open the Config File**: In the project files, open `service/config.js`.
2.  **Replace the Placeholder**: You will see the following line:
    ```javascript
    export const GEMINI_API_KEY = 'YOUR_API_KEY';
    ```
    Replace `'YOUR_API_KEY'` with the actual API key you copied from the Google AI Studio.
3.  **Save the File**.

### 3. Load the Extension in Chrome

1.  **Open Chrome Extensions Page**: Open your Chrome browser and navigate to `chrome://extensions`.
2.  **Enable Developer Mode**: In the top-right corner of the page, make sure the "Developer mode" toggle is switched on.
3.  **Load the Extension**: Click the **"Load unpacked"** button, navigate to the `gemini-extension` directory, and select it.

Your extension is now installed and ready to use!
