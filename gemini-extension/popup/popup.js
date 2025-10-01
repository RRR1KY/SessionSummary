const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const responseContainer = document.getElementById('response-container');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const closeButton = document.getElementById('close-button');

promptInput.addEventListener('input', () => {
  if (promptInput.value.trim()) {
    sendButton.removeAttribute('disabled');
  } else {
    sendButton.setAttribute('disabled', '');
  }
});

sendButton.addEventListener('click', () => {
  const prompt = promptInput.value.trim();
  showLoading();

  chrome.runtime.sendMessage({ prompt }, (response) => {
    if (response.error) {
      showError(response.error);
    } else {
      showResponse(response.text);
    }
  });
});

function showLoading() {
  responseContainer.setAttribute('hidden', '');
  error.setAttribute('hidden', '');
  loading.removeAttribute('hidden');
}

function showResponse(text) {
  loading.setAttribute('hidden', '');
  responseContainer.removeAttribute('hidden');
  responseContainer.textContent = text;
}

function showError(errorMessage) {
  loading.setAttribute('hidden', '');
  error.removeAttribute('hidden');
  error.textContent = errorMessage;
}

closeButton.addEventListener('click', () => {
  window.close();
});