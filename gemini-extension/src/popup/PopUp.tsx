function openSidePanel() {
  chrome.windows.getCurrent((w) => {
    chrome.sidePanel.open({ windowId: w.id! });
    console.log('Command/Ctrl + O triggered! :)');
  });
}

export default function PopUp() {
  return <button onClick={openSidePanel}> Open Side Panel </button>;
}
