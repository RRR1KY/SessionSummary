function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

function extractJsonFromString(str: string): string | null {
  const match = str.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    return match[1];
  }
  return str;
}

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

export async function generateGroupingPlanAndSummary(
  model: LanguageModel,
  groupingPreference: string
): Promise<{ groupingPlan: Map<string, number[]>; summary: string } | null> {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const filteredTabs = tabs.filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:') && !tab.url.startsWith('chrome-extension://'));

  // 1. Categorize and summarize each tab
  const processedTabs = await Promise.all(
    filteredTabs.map(async (tab) => {
      if (!tab.id) return null;
      const content = await getTabContent(tab.id);
      if (!content) return null;

      const truncatedContent = content.substring(0, 4000);
      const prompt = `Please provide a category and a short summary for the following text, based on the grouping preference: "${groupingPreference}". Return the response as a JSON object with "category" and "summary" keys:\n\n${truncatedContent}`;

      try {
        const response = await model.prompt(prompt);
        const jsonString = extractJsonFromString(response);
        if (jsonString) {
          const { category, summary } = JSON.parse(jsonString);
          return { tabId: tab.id, category, summary };
        }
        return null;
      } catch (e) {
        console.error(`Could not process tab ${tab.id}`, e);
        return null;
      }
    })
  );

  // 2. Prepare grouping plan and summaries
  const groupingPlan = new Map<string, number[]>();
  const summaries: string[] = [];
  processedTabs.forEach((tab) => {
    if (tab) {
      if (!groupingPlan.has(tab.category)) {
        groupingPlan.set(tab.category, []);
      }
      groupingPlan.get(tab.category)!.push(tab.tabId);
      summaries.push(tab.summary);
    }
  });

  // 3. Generate final summary
  if (summaries.length === 0) return null;

  const summariesText = summaries.join('\n\n');
  const summaryPrompt = `Please provide a general summary of the following summaries (no more than 200 words):\n\n${summariesText}`;
  const finalSummary = await model.prompt(summaryPrompt);

  return { groupingPlan, summary: finalSummary };
}

export async function executeGrouping(groupingPlan: Map<string, number[]>) {
  for (const [category, tabIds] of groupingPlan.entries()) {
    if (isNonEmptyArray(tabIds)) {
      const group = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(group, { title: category });
    }
  }
}
