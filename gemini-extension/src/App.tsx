import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  ThemeProvider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import TabIcon from '@mui/icons-material/Tab';
import './App.css';
import { CORE_MODEL_OPTIONS } from './config/model-options';
import { generateGroupingPlanAndSummary, executeGrouping } from './handler/tab-grouping';
import { lightTheme } from './theme';

import DownloadingModel from './components/DownloadingModel';

/**
 * Main application component for the Session Summarizer Chrome Extension.
 * Manages state for model availability, user input, loading, errors, 
 * tab grouping plan, session summary, and UI interactions.
 * @returns {React.ReactElement} The rendered application UI.
 */
export default function App(): React.ReactElement {
  // State for user prompt/grouping preference
  const [prompt, setPrompt] = useState<string>('');
  // State for general response messages
  const [response, setResponse] = useState<string>('');
  // State to indicate if an operation is currently loading
  const [loading, setLoading] = useState<boolean>(false);
  // State to store any error messages
  const [error, setError] = useState<string>('');
  // State for the availability status of the local language model
  const [localModelAvailable, setAvailable] =
    useState<Availability>('unavailable');
  // State to hold the instance of the local language model
  const [localModelInstance, setModel] = useState<LanguageModel | undefined>(
    undefined
  );
  // State for the download progress of the local language model
  const [localModelDownloadProgress, setModelDownloadProgress] = useState<number>(0);
  // State to store the plan for grouping tabs by category
  const [groupingPlan, setGroupingPlan] = useState<Map<string, number[]> | null>(null);
  // State to store the overall summary of the browsing session
  const [summary, setSummary] = useState<string | null>(null);
  // State to store the list of currently open Chrome tabs
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  // State to control which accordion category is currently expanded
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  // State to track the time taken for the grouping operation
  const [timeTaken, setTimeTaken] = useState<number>(0);

  /**
   * useEffect hook to handle initial setup:
   * 1. Checks for local language model availability and creates an instance if available.
   * 2. Queries currently open Chrome tabs.
   * 3. Manages a timer for the loading state.
   */
  useEffect(() => {
    // Check and set local model availability
    LanguageModel.availability(CORE_MODEL_OPTIONS).then((val: Availability) => {
      console.log(val);
      setAvailable(val);

      // If model is available, create an instance
      if (val === 'available') {
        LanguageModel.create(CORE_MODEL_OPTIONS).then((model: LanguageModel) => {
          setModel(model);
        });
      }
    });
    // Query and set currently open tabs
    chrome.tabs.query({ currentWindow: true }).then((tabs: chrome.tabs.Tab[]) => setTabs(tabs));

    // Timer logic for loading state
    let timer: number | undefined;
    if (loading) {
      setTimeTaken(0); // Reset timer when loading starts
      timer = setInterval(() => {
        setTimeTaken((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timer) {
      clearInterval(timer); // Clear timer when loading stops
      setTimeTaken(0); // Reset timer when loading stops
    }
    // Cleanup function to clear the timer when component unmounts or loading state changes
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]); // Rerun effect when loading state changes

  /**
   * Handles the download process for the local language model.
   * Sets the model availability to 'downloading' and monitors progress.
   */
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

  /**
   * Handles changes to the prompt (text area) input.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} event - The change event from the textarea.
   */
  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPrompt(event.target.value);
  };

  /**
   * Initiates the tab grouping and summarization process.
   * Sets loading state, clears previous errors/responses, and calls the backend handler.
   */
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

  /**
   * Confirms the generated grouping plan and executes the tab grouping in Chrome.
   * Resets the grouping plan and summary after execution.
   */
  const handleConfirmGrouping = async () => {
    if (groupingPlan) {
      await executeGrouping(groupingPlan);
      setGroupingPlan(null);
      setSummary(null);
    }
  };

  /**
   * Cancels the current grouping plan and clears the displayed summary.
   */
  const handleCancelGrouping = () => {
    setGroupingPlan(null);
    setSummary(null);
  };

  /**
   * Handles the change event for accordion expansion.
   * @param {string} panel - The name of the panel being expanded/collapsed.
   * @returns {(event: React.SyntheticEvent, isExpanded: boolean) => void} An event handler function.
   */
  const handleAccordionChange = (panel: string) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedCategory(isExpanded ? panel : null);
  };

  return (
    <>
      {(() => {
        switch (localModelAvailable) {
          case 'unavailable':
            return <Typography variant="body1">Local model unavailable!</Typography>;

          case 'downloading':
            return (
              <DownloadingModel progress={localModelDownloadProgress} />
            );
          case 'downloadable':
            return (
              <Button variant="contained" onClick={handleDownload} sx={{ mt: 2 }}>
                Download Model
              </Button>
            );
          case 'available':
            return (
              <ThemeProvider theme={lightTheme}>
                <Box className='side-panel' sx={{ p: 2 }}>
                  <Typography variant="h5" component="h1" gutterBottom align="center">
                    Session Summary
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    placeholder='Type something, e.g. "Summarize my recent browsing session."' 
                    value={prompt}
                    onChange={handlePromptChange}
                    sx={{ mb: 2 }}
                  />
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Button variant="contained" onClick={handleGroupTabs} disabled={loading} sx={{ mr: 2 }}>
                              {loading ? <CircularProgress size={24} color="inherit" /> : 'Group Tabs'}
                            </Button>
                            {loading && (
                              <Typography variant="body2">
                                Time taken: {timeTaken}s
                              </Typography>
                            )}
                          </Box>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  {response && !groupingPlan && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {response}
                    </Alert>
                  )}

                  {groupingPlan && summary && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Confirm Tab Grouping
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {summary}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {Array.from(groupingPlan.keys()).map((category: string) => (
                          <Accordion
                            key={category}
                            expanded={expandedCategory === category}
                            onChange={handleAccordionChange(category)}
                            sx={{ mb: 1 }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <ListItemIcon>
                                <FolderIcon />
                              </ListItemIcon>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {category} ({groupingPlan.get(category)?.length} tabs)
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {groupingPlan.get(category)?.map((tabId: number) => {
                                  const tab = tabs.find((t: chrome.tabs.Tab) => t.id === tabId);
                                  return (
                                    <ListItem key={tabId}>
                                      <ListItemIcon>
                                        {tab?.favIconUrl ? (
                                          <img src={tab.favIconUrl} width="16" height="16" alt="" />
                                        ) : (
                                          <TabIcon fontSize="small" />
                                        )}
                                      </ListItemIcon>
                                      <ListItemText primary={tab?.title || `Tab ID: ${tabId}`} />
                                    </ListItem>
                                  );
                                })}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                      <Button variant="contained" onClick={handleConfirmGrouping} sx={{ mr: 1 }}>
                        Confirm
                      </Button>
                      <Button variant="outlined" onClick={handleCancelGrouping}>
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </ThemeProvider>
            );
        }
      })()}
    </>
  );
}