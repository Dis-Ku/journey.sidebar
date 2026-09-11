const dateLabel = document.getElementById("dateLabel");
const settingsBtn = document.getElementById("settingsBtn");
const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

let draftSaveTimer = null;

function formatDate(date) {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || "";
}

function scheduleDraftSave() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(() => {
    chrome.storage.local.set({
      [DRAFT_STORAGE_KEY]: { title: titleInput.value, text: bodyInput.value },
    });
  }, 400);
}

async function restoreDraft() {
  const data = await chrome.storage.local.get(DRAFT_STORAGE_KEY);
  const draft = data[DRAFT_STORAGE_KEY];
  if (draft) {
    titleInput.value = draft.title || "";
    bodyInput.value = draft.text || "";
  }
}

async function clearDraft() {
  await chrome.storage.local.remove(DRAFT_STORAGE_KEY);
  titleInput.value = "";
  bodyInput.value = "";
}

async function sendEntry() {
  const text = bodyInput.value.trim();
  if (!text) {
    setStatus("本文を入力してください。", "error");
    bodyInput.focus();
    return;
  }

  sendBtn.disabled = true;
  setStatus("送信中…", "");

  const payload = {
    title: titleInput.value.trim(),
    text,
    created_at: new Date().toISOString(),
  };

  const result = await chrome.runtime.sendMessage({ type: "sendEntry", payload });

  sendBtn.disabled = false;
  if (result?.ok) {
    setStatus("Journeyに送信しました。", "success");
    await clearDraft();
  } else {
    setStatus(result?.error || "送信に失敗しました。", "error");
  }
}

titleInput.addEventListener("input", scheduleDraftSave);
bodyInput.addEventListener("input", scheduleDraftSave);
sendBtn.addEventListener("click", sendEntry);
settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

dateLabel.textContent = formatDate(new Date());
restoreDraft();
