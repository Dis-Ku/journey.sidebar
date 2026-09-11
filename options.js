const emailInput = document.getElementById("emailInput");
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
  emailInput.value = await getStoredEmail();
}

function validateEmail(raw) {
  if (!isLikelyEmail(raw)) {
    showStatus("有効なメールアドレスを入力してください。", true);
    return null;
  }
  return raw;
}

saveBtn.addEventListener("click", async () => {
  const raw = emailInput.value.trim();
  const valid = validateEmail(raw);
  if (!valid) return;
  await chrome.storage.sync.set({ [EMAIL_STORAGE_KEY]: valid });
  showStatus("保存しました。", false);
});

testBtn.addEventListener("click", async () => {
  const raw = emailInput.value.trim();
  const valid = validateEmail(raw);
  if (!valid) return;
  await chrome.storage.sync.set({ [EMAIL_STORAGE_KEY]: valid });

  testBtn.disabled = true;
  showStatus("メールソフトを開いています…", false);
  const result = await chrome.runtime.sendMessage({ type: "testEmail" });
  testBtn.disabled = false;

  if (result?.ok) {
    showStatus("メールソフトを開きました。宛先が正しいか確認してください。", false);
  } else {
    showStatus(result?.error || "送信に失敗しました。", true);
  }
});

init();
