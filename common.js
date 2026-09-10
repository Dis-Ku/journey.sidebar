// Shared constants/helpers used by background.js and options.js.

const DEFAULT_JOURNEY_URL = "https://journey.cloud/app/timeline";
const STORAGE_KEY = "journeyUrl";
const WINDOW_ID_KEY = "journeyWindowId";

function getStoredUrl() {
  return chrome.storage.sync.get(STORAGE_KEY).then((data) => data[STORAGE_KEY] || DEFAULT_JOURNEY_URL);
}
