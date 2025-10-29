/**
 * Checks if an array is not empty.
 * @template T
 * @param {T[]} arr - The array to check.
 * @returns {boolean} True if the array is not empty, false otherwise.
 */
function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

/**
 * Extracts a JSON string from a given string, typically from a markdown code block.
 * If no JSON markdown block is found, the original string is returned.
 * @param {string} str - The string to extract JSON from.
 * @returns {string | null} The extracted JSON string or null if not found.
 */
function extractJsonFromString(str: string): string | null {
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    return match[1];
  }
  return str;
}

/**
 * Retrieves the inner text content of a specified tab.
 * @param {number} tabId - The ID of the tab to get content from.
 * @returns {Promise<string>} A promise that resolves with the tab's inner text, or an empty string if content cannot be accessed.
 */
async function getTabContent(tabId: number): Promise<string> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.body.innerText,
    });
    if (results && results[0]) {
      return results[0].result || '';
    }
    return '';
  } catch (e) {
    console.error(`Could not access content of tab ${tabId}`, e);
    return '';
  }
}

/**
 * Generates a plan for grouping tabs and a summary of the browsing session using a language model.
 * It queries all current tabs, extracts their content, and sends this data to the model
 * to categorize and summarize.
 * @param {LanguageModel} model - The language model instance to use for categorization and summarization.
 * @param {string} groupingPreference - A user-defined preference to guide the grouping and summarization.
 * @returns {Promise<{ groupingPlan: Map<string, number[]>; summary: string } | null>} A promise that resolves with the grouping plan and summary, or null if no valid tabs are found or processing fails.
 */
export async function generateGroupingPlanAndSummary(
  model: LanguageModel,
  groupingPreference: string
): Promise<{ groupingPlan: Map<string, number[]>; summary: string } | null> {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const filteredTabs = tabs.filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') && !tab.url.startsWith('chrome-extension://'));

  const tabData = await Promise.all(
    filteredTabs.map(async (tab) => {
      if (!tab.id) return null;
      const content = await getTabContent(tab.id);
      return {
        id: tab.id,
        title: tab.title || '',
        url: tab.url || '',
        content: content.substring(0, 2000),
      };
    })
  );

  const validTabData = tabData.filter(Boolean);

  if (validTabData.length === 0) {
    return null;
  }

  const prompt = `
    Based on the following tabs and their content, please categorize them according to the user's preference: "${groupingPreference}".
    Provide a general summary of the browsing session (no more than 200 words).
    Return a JSON object with two keys:
    1. "summary": A string containing the general summary.
    2. "groups": An object where each key is a category name and the value is an array of tab IDs belonging to that category.

    Example response:
    '''json
    {
      "summary": "The user has been researching machine learning and web development.",
      "groups": {
        "Machine Learning": [101, 102],
        "Web Development": [103, 104]
      }
    }
    '''

    Here is the tab data:
    ${JSON.stringify(validTabData, null, 2)}
  `;

  try {
    const response = await model.prompt(prompt);
    const jsonString = extractJsonFromString(response);

    if (jsonString) {
      const { summary, groups } = JSON.parse(jsonString);
      const groupingPlan = new Map<string, number[]>();
      for (const category in groups) {
        groupingPlan.set(category, groups[category]);
      }
      return { groupingPlan, summary };
    }
    return null;
  } catch (e) {
    console.error('Could not process tabs', e);
    return null;
  }
}

/**
 * Executes the tab grouping in the Chrome browser based on a provided grouping plan.
 * Each category in the plan will become a new tab group with the specified tabs.
 * @param {Map<string, number[]>} groupingPlan - A map where keys are category names and values are arrays of tab IDs.
 */
export async function executeGrouping(groupingPlan: Map<string, number[]>) {
  for (const [category, tabIds] of groupingPlan.entries()) {
    if (isNonEmptyArray(tabIds)) {
      const group = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(group, { title: category });
    }
  }
}
