// Shared constants used by background.js, sidepanel.js and options.js.

const EMAIL_STORAGE_KEY = "journeyEmail";
const DRAFT_STORAGE_KEY = "entryDraft";

function getStoredEmail() {
  return chrome.storage.sync.get(EMAIL_STORAGE_KEY).then((data) => data[EMAIL_STORAGE_KEY] || "");
}

function isLikelyEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildMailtoUrl(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
