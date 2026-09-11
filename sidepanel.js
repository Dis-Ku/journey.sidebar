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

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Journey's Zapier "text" field only understands a small tag set
// (a, br, hr, h1, i, b, strong, em, blockquote, ul, ol, li) and has no
// concept of <p>/<div>. This walks the contenteditable DOM and rebuilds it
// using only what our toolbar can actually produce, turning paragraph
// breaks into <br>.
function toJourneyHtml(root) {
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }
    const inner = Array.from(node.childNodes).map(walk).join("");
    switch (node.tagName) {
      case "B":
        return `<b>${inner}</b>`;
      case "STRONG":
        return `<strong>${inner}</strong>`;
      case "I":
        return `<i>${inner}</i>`;
      case "EM":
        return `<em>${inner}</em>`;
      case "UL":
        return `<ul>${inner}</ul>`;
      case "OL":
        return `<ol>${inner}</ol>`;
      case "LI":
        return `<li>${inner}</li>`;
      case "BR":
        return "<br>";
      case "P":
      case "DIV":
        return `${inner}<br>`;
      default:
        return inner;
    }
  }

  return Array.from(root.childNodes)
    .map(walk)
    .join("")
    .replace(/(<br>)+$/i, "");
}

// Builds the exact string Journey's "text" field expects: plain text when
// there's no formatting at all, or the whole thing wrapped in <html> when
// any markup (including a title turned into <h1>) is present.
function buildJourneyText() {
  let html = toJourneyHtml(bodyInput);
  const title = titleInput.value.trim();
  if (title) {
    html = `<h1>${escapeHtml(title)}</h1>${html}`;
  }
  return html.includes("<") ? `<html>${html}</html>` : html;
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

  const payload = { text: buildJourneyText() };

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
