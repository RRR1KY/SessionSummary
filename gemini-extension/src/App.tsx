import { useState, useEffect, type ReactElement } from 'react';
import './App.css';
import { CORE_MODEL_OPTIONS } from './config/model-options';

export default function App(): ReactElement {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localModelAvailable, setAvailable] =
    useState<Availability>('unavailable');
  const [localModelInstance, setModel] = useState<LanguageModel | undefined>(
    undefined
  );
  const [localModelDownloadProgress, setModelDownloadProgress] = useState(0);

  useEffect(() => {
    LanguageModel.availability(CORE_MODEL_OPTIONS).then((val) => {
      console.log(val);
      setAvailable(val);

      // Model is already available, we can create an instance
      if (val === 'available') {
        LanguageModel.create(CORE_MODEL_OPTIONS).then((model) => {
          setModel(model);
        });
      }
    });
  }, []);

  const handleDownload = () => {
    if (navigator.userActivation.isActive) {
      LanguageModel.create({
        ...CORE_MODEL_OPTIONS,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            setModelDownloadProgress(e.loaded * 100);
          });
        },
      }).then((model) => {
        setModel(model);
        setAvailable('available');
      });
    }
  };

  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPrompt(event.target.value);
  };

  const handleSend = async () => {
    if (localModelInstance == undefined) {
      console.error('Local model not available');
      return;
    }

    console.log('Sending prompt to local model');
    setLoading(true);
    setResponse('');
    setError('');

    const stream = localModelInstance.promptStreaming(prompt);
    const reader = stream.getReader();
    let fullResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      fullResponse += value;
      setResponse(fullResponse);
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  switch (localModelAvailable) {
    case 'unavailable':
      return <div>Local model unavailable!</div>;

    case 'downloading':
      return <div>Download Progress + ${localModelDownloadProgress}%</div>;
    case 'downloadable':
      return (
        <button
          id='send-button'
          onClick={handleDownload}
          disabled={!prompt.trim()}
        >
          Download Model
        </button>
      );
    case 'available':
      return (
        <div className='side-panel'>
          <h1>Session Summary</h1>
          <textarea
            id='prompt-input'
            placeholder='Type something, e.g. "Summarize my recent browsing session."'
            cols={30}
            rows={5}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
          ></textarea>
          <button
            id='send-button'
            onClick={handleSend}
            disabled={!prompt.trim()}
          >
            Send
          </button>
          {loading && (
            <div id='loading' className='card'>
              <span className='blink'>...</span>
            </div>
          )}
          {error && (
            <div id='error' className='card'>
              {error}
            </div>
          )}
          {response && (
            <div id='response-container' className='card'>
              {response}
            </div>
          )}
        </div>
      );
  }
}
