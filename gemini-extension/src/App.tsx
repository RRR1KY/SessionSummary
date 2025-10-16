import { useState, useEffect, type ReactElement } from 'react';
import './App.css';
import { CORE_MODEL_OPTIONS } from './config/model-options';
import { generateGroupingPlanAndSummary, executeGrouping } from './handler/tab-grouping';

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
  const [groupingPlan, setGroupingPlan] = useState<Map<string, number[]> | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

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
    console.log('handleDownload called');
    console.log('navigator.userActivation.isActive:', navigator.userActivation.isActive);
    if (navigator.userActivation.isActive) {
      setAvailable('downloading');
      LanguageModel.create({
        ...CORE_MODEL_OPTIONS,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            setModelDownloadProgress(e.loaded * 100);
          });
        },
      })
        .then((model) => {
          setModel(model);
          setAvailable('available');
        })
        .catch((error) => {
          console.error('Error creating language model:', error);
          setError('Failed to download model. See console for details.');
        });
    }
  };



  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPrompt(event.target.value);
  };



  const handleGroupTabs = async () => {
    if (!localModelInstance) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await generateGroupingPlanAndSummary(localModelInstance, prompt);
      if (result) {
        setGroupingPlan(result.groupingPlan);
        setSummary(result.summary);
      } else {
        setError('Could not generate a grouping plan.');
      }
    } catch (e) {
      setError('An error occurred while generating the grouping plan.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmGrouping = async () => {
    if (groupingPlan) {
      await executeGrouping(groupingPlan);
      setGroupingPlan(null);
      setSummary(null);
    }
  };

  const handleCancelGrouping = () => {
    setGroupingPlan(null);
    setSummary(null);
  };



  switch (localModelAvailable) {
    case 'unavailable':
      return <div>Local model unavailable!</div>;

    case 'downloading':
      return (
        <div className="download-container">
          <h3>Downloading Model</h3>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${localModelDownloadProgress}%` }}
            ></div>
          </div>
          <p>{Math.round(localModelDownloadProgress)}%</p>
        </div>
      );
    case 'downloadable':
      return (
        <button
          id='send-button'
          onClick={handleDownload}
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
          ></textarea>
          <button onClick={handleGroupTabs}>Group Tabs</button>

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
          {response && !groupingPlan && (
            <div id='response-container' className='card'>
              {response}
            </div>
          )}

          {groupingPlan && summary && (
            <div className="card">
              <h3>Confirm Tab Grouping</h3>
              <p>The following summary has been generated and your tabs will be grouped into the following categories. Do you want to proceed?</p>
              <p>{summary}</p>
              <h4>Categories</h4>
              <ul>
                {Array.from(groupingPlan.keys()).map(category => (
                  <li key={category}>
                    <strong>{category}</strong>: {groupingPlan.get(category)?.length} tabs
                  </li>
                ))}
              </ul>
              <button onClick={handleConfirmGrouping}>Confirm</button>
              <button onClick={handleCancelGrouping}>Cancel</button>
            </div>
          )}
        </div>
      );
  }
}
