const urlInput = document.getElementById("urlInput");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");

function showStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#e0455f" : "";
  if (text) {
    setTimeout(() => {
      statusEl.textContent = "";
    }, 3000);
  }
}

async function init() {
  urlInput.value = await getStoredUrl();
}

saveBtn.addEventListener("click", async () => {
  const raw = urlInput.value.trim();
  let parsed;
  try {
    parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("invalid protocol");
    }
  } catch (err) {
    showStatus("有効なURLを入力してください（https://... の形式）", true);
    return;
  }

  if (!isDefaultDomain(parsed.hostname)) {
    const granted = await chrome.permissions.request({
      origins: [`*://${parsed.hostname}/*`],
    });
    if (!granted) {
      showStatus("権限が許可されなかったため保存できませんでした。", true);
      return;
    }
  }

  await chrome.storage.sync.set({ [STORAGE_KEY]: parsed.href });
  showStatus("保存しました。サイドパネルを開き直すと反映されます。", false);
});

resetBtn.addEventListener("click", async () => {
  await chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_JOURNEY_URL });
  urlInput.value = DEFAULT_JOURNEY_URL;
  showStatus("初期値に戻しました。", false);
});

init();
