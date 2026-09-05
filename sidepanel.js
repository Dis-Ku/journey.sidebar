const frame = document.getElementById("frame");
const homeBtn = document.getElementById("homeBtn");
const reloadBtn = document.getElementById("reloadBtn");
const openTabBtn = document.getElementById("openTabBtn");
const settingsBtn = document.getElementById("settingsBtn");
const fallbackOpenTab = document.getElementById("fallbackOpenTab");
const fallbackSettings = document.getElementById("fallbackSettings");

let currentUrl = DEFAULT_JOURNEY_URL;

function loadUrl(url) {
  currentUrl = url;
  // Force a real reload even if the URL string is unchanged.
  frame.src = "about:blank";
  requestAnimationFrame(() => {
    frame.src = url;
  });
}

async function init() {
  currentUrl = await getStoredUrl();
  frame.src = currentUrl;
}

homeBtn.addEventListener("click", () => loadUrl(currentUrl));
reloadBtn.addEventListener("click", () => loadUrl(currentUrl));
openTabBtn.addEventListener("click", () => chrome.tabs.create({ url: currentUrl }));
settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
fallbackOpenTab.addEventListener("click", () => chrome.tabs.create({ url: currentUrl }));
fallbackSettings.addEventListener("click", () => chrome.runtime.openOptionsPage());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    loadUrl(changes[STORAGE_KEY].newValue || DEFAULT_JOURNEY_URL);
  }
});

init();
