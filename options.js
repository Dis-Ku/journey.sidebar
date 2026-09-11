const urlInput = document.getElementById("urlInput");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const statusEl = document.getElementById("status");

function showStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#e0455f" : "";
  if (text) {
    setTimeout(() => {
      statusEl.textContent = "";
    }, 4000);
  }
}

async function init() {
  urlInput.value = await getStoredWebhookUrl();
}

function validateUrl(raw) {
  if (!isZapierWebhookUrl(raw)) {
    showStatus("ZapierのWebhook URL（https://hooks.zapier.com/...）を入力してください。", true);
    return null;
  }
  return raw;
}

saveBtn.addEventListener("click", async () => {
  const raw = urlInput.value.trim();
  const valid = validateUrl(raw);
  if (!valid) return;
  await chrome.storage.sync.set({ [WEBHOOK_STORAGE_KEY]: valid });
  showStatus("保存しました。", false);
});

testBtn.addEventListener("click", async () => {
  const raw = urlInput.value.trim();
  const valid = validateUrl(raw);
  if (!valid) return;
  await chrome.storage.sync.set({ [WEBHOOK_STORAGE_KEY]: valid });

  testBtn.disabled = true;
  showStatus("テスト送信中…", false);
  const result = await chrome.runtime.sendMessage({ type: "testWebhook" });
  testBtn.disabled = false;

  if (result?.ok) {
    showStatus("Webhookにテストデータを送信しました。Zapier側の履歴を確認してください。", false);
  } else {
    showStatus(result?.error || "送信に失敗しました。", true);
  }
});

init();
