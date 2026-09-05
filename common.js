// Shared constants/helpers used by background.js, sidepanel.js and options.js.

const DEFAULT_JOURNEY_URL = "https://journey.cloud/webapp/#/login";
const DEFAULT_JOURNEY_DOMAIN = "journey.cloud";
const STORAGE_KEY = "journeyUrl";
const DYNAMIC_RULE_ID = 1000;

function getStoredUrl() {
  return chrome.storage.sync.get(STORAGE_KEY).then((data) => data[STORAGE_KEY] || DEFAULT_JOURNEY_URL);
}

function isDefaultDomain(hostname) {
  return hostname === DEFAULT_JOURNEY_DOMAIN || hostname.endsWith("." + DEFAULT_JOURNEY_DOMAIN);
}
