import { GEMINI_API_KEY } from './config.js';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.prompt) {
    fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: request.prompt
          }]
        }]
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Gemini API Response:', data); // Log the full response
      if (data.candidates && data.candidates.length > 0) {
        const text = data.candidates[0].content.parts[0].text;
        sendResponse({ text });
      } else {
        sendResponse({ error: 'No response from Gemini API. Check the service worker console for details.' });
      }
    })
    .catch(error => {
      console.error('Error calling Gemini API:', error);
      sendResponse({ error: 'Failed to call Gemini API.' });
    });

    return true; // Indicates that the response is sent asynchronously
  }
});
