importScripts("common.js");

const WINDOW_WIDTH = 420;

async function getJourneyWindowId() {
  const data = await chrome.storage.session.get(WINDOW_ID_KEY);
  return typeof data[WINDOW_ID_KEY] === "number" ? data[WINDOW_ID_KEY] : null;
}

async function setJourneyWindowId(id) {
  if (id === null) {
    await chrome.storage.session.remove(WINDOW_ID_KEY);
  } else {
    await chrome.storage.session.set({ [WINDOW_ID_KEY]: id });
  }
}

// Dock the popup window to the right edge of the primary display, spanning
// its full working height, so it behaves like a pinned sidebar.
async function getDockedBounds() {
  try {
    const displays = await chrome.system.display.getInfo();
    const primary = displays.find((d) => d.isPrimary) || displays[0];
    const wa = primary.workArea;
    return {
      left: wa.left + wa.width - WINDOW_WIDTH,
      top: wa.top,
      width: WINDOW_WIDTH,
      height: wa.height,
    };
  } catch (err) {
    console.error("Journey Sidebar: failed to read display info", err);
    return { width: WINDOW_WIDTH, height: 900 };
  }
}

async function openJourneyWindow() {
  const url = await getStoredUrl();
  const bounds = await getDockedBounds();
  const win = await chrome.windows.create({
    url,
    type: "popup",
    ...bounds,
  });
  await setJourneyWindowId(win.id);
}

// Clicking the toolbar icon toggles the docked window: open it if closed,
// close it if already open.
async function toggleJourneyWindow() {
  const existingId = await getJourneyWindowId();
  if (existingId !== null) {
    try {
      await chrome.windows.get(existingId);
      await chrome.windows.remove(existingId);
    } catch (err) {
      // Window was already closed some other way; nothing to remove.
    }
    await setJourneyWindowId(null);
    return;
  }
  await openJourneyWindow();
}

chrome.action.onClicked.addListener(() => {
  toggleJourneyWindow();
});

chrome.windows.onRemoved.addListener(async (closedId) => {
  const currentId = await getJourneyWindowId();
  if (closedId === currentId) {
    await setJourneyWindowId(null);
  }
});

// If the configured URL changes while the docked window is open, navigate it
// to the new URL immediately.
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "sync" || !changes[STORAGE_KEY]) return;
  const windowId = await getJourneyWindowId();
  if (windowId === null) return;
  try {
    const tabs = await chrome.tabs.query({ windowId });
    if (tabs[0]) {
      await chrome.tabs.update(tabs[0].id, { url: changes[STORAGE_KEY].newValue || DEFAULT_JOURNEY_URL });
    }
  } catch (err) {
    console.error("Journey Sidebar: failed to navigate open window", err);
  }
});
