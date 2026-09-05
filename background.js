importScripts("common.js");

// Clicking the toolbar icon opens the side panel directly.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.error("Journey Sidebar: failed to set panel behavior", err);
  });
  syncDynamicRuleForCurrentUrl();
});

chrome.runtime.onStartup.addListener(() => {
  syncDynamicRuleForCurrentUrl();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[STORAGE_KEY]) {
    syncDynamicRuleForUrl(changes[STORAGE_KEY].newValue || DEFAULT_JOURNEY_URL);
  }
});

async function syncDynamicRuleForCurrentUrl() {
  const url = await getStoredUrl();
  await syncDynamicRuleForUrl(url);
}

// The static rules.json ruleset already strips framing headers for
// journey.cloud. If the user points the panel at a different domain in the
// options page, add a matching dynamic rule (only possible once the
// necessary host permission has been granted for that origin).
async function syncDynamicRuleForUrl(urlString) {
  let hostname;
  try {
    hostname = new URL(urlString).hostname;
  } catch (err) {
    return;
  }

  const removeRuleIds = [DYNAMIC_RULE_ID];
  const addRules = [];

  if (!isDefaultDomain(hostname)) {
    const hasPermission = await chrome.permissions.contains({
      origins: [`*://${hostname}/*`],
    });
    if (hasPermission) {
      addRules.push({
        id: DYNAMIC_RULE_ID,
        priority: 1,
        action: {
          type: "modifyHeaders",
          responseHeaders: [
            { header: "x-frame-options", operation: "remove" },
            { header: "content-security-policy", operation: "remove" },
            { header: "content-security-policy-report-only", operation: "remove" },
          ],
        },
        condition: {
          requestDomains: [hostname],
          resourceTypes: ["sub_frame"],
        },
      });
    }
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  } catch (err) {
    console.error("Journey Sidebar: failed to update dynamic rules", err);
  }
}
