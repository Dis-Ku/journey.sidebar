// Shared constants used by background.js, sidepanel.js and options.js.

const WEBHOOK_STORAGE_KEY = "zapierWebhookUrl";
const DRAFT_STORAGE_KEY = "entryDraft";

function getStoredWebhookUrl() {
  return chrome.storage.sync.get(WEBHOOK_STORAGE_KEY).then((data) => data[WEBHOOK_STORAGE_KEY] || "");
}

function isZapierWebhookUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)zapier\.com$/.test(url.hostname);
  } catch (err) {
    return false;
  }
}
