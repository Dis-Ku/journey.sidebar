const dateLabel = document.getElementById("dateLabel");
const settingsBtn = document.getElementById("settingsBtn");
const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");

let draftSaveTimer = null;

document.execCommand("defaultParagraphSeparator", false, "p");

function formatDate(date) {
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || "";
}

// Converts the contenteditable body into lightweight Markdown, so the entry
// still reads sensibly even if Journey's Zapier action only stores plain text.
function nodeToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const inner = Array.from(node.childNodes).map(nodeToMarkdown).join("");

  switch (node.tagName) {
    case "B":
    case "STRONG":
      return inner.trim() ? `**${inner}**` : inner;
    case "I":
    case "EM":
      return inner.trim() ? `*${inner}*` : inner;
    case "BR":
      return "\n";
    case "LI": {
      const isOrdered = node.parentElement?.tagName === "OL";
      const prefix = isOrdered ? `${Array.from(node.parentElement.children).indexOf(node) + 1}. ` : "- ";
      return `${prefix}${inner}\n`;
    }
    case "P":
    case "DIV":
    case "UL":
    case "OL":
      return `${inner}\n`;
    default:
      return inner;
  }
}

function bodyToMarkdown() {
  return Array.from(bodyInput.childNodes)
    .map(nodeToMarkdown)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function scheduleDraftSave() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(() => {
    chrome.storage.local.set({
      [DRAFT_STORAGE_KEY]: { title: titleInput.value, html: bodyInput.innerHTML },
    });
  }, 400);
}

async function restoreDraft() {
  const data = await chrome.storage.local.get(DRAFT_STORAGE_KEY);
  const draft = data[DRAFT_STORAGE_KEY];
  if (draft) {
    titleInput.value = draft.title || "";
    bodyInput.innerHTML = draft.html || "";
  }
}

async function clearDraft() {
  await chrome.storage.local.remove(DRAFT_STORAGE_KEY);
  titleInput.value = "";
  bodyInput.innerHTML = "";
}

async function sendEntry() {
  if (!bodyInput.textContent.trim()) {
    setStatus("本文を入力してください。", "error");
    bodyInput.focus();
    return;
  }

  sendBtn.disabled = true;
  setStatus("送信中…", "");

  const payload = {
    title: titleInput.value.trim(),
    text: bodyToMarkdown(),
    html: bodyInput.innerHTML,
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

document.querySelectorAll("#richToolbar button[data-cmd]").forEach((btn) => {
  // Prevent the button from stealing focus/selection away from the editor
  // before the formatting command runs.
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => {
    document.execCommand(btn.dataset.cmd, false, null);
    bodyInput.focus();
    scheduleDraftSave();
  });
});

titleInput.addEventListener("input", scheduleDraftSave);
bodyInput.addEventListener("input", scheduleDraftSave);
sendBtn.addEventListener("click", sendEntry);
settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

dateLabel.textContent = formatDate(new Date());
restoreDraft();
