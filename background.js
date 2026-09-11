importScripts("common.js");

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.error("Journey Sidebar: failed to set panel behavior", err);
  });
});

async function openMailto(subject, body) {
  const email = await getStoredEmail();
  if (!email) {
    return { ok: false, error: "Journeyの投稿用メールアドレスが設定されていません。設定画面で入力してください。" };
  }
  if (!isLikelyEmail(email)) {
    return { ok: false, error: "設定されているメールアドレスの形式が正しくないようです。設定画面を確認してください。" };
  }

  try {
    const tab = await chrome.tabs.create({ url: buildMailtoUrl(email, subject, body) });
    // Chrome hands mailto: off to the OS/registered mail app but leaves the
    // new tab behind at about:blank; clean it up so it doesn't linger.
    setTimeout(() => {
      chrome.tabs.get(tab.id).then((t) => {
        if (t.url === "about:blank" || t.pendingUrl === "about:blank") {
          chrome.tabs.remove(tab.id).catch(() => {});
        }
      }).catch(() => {});
    }, 1500);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `メールを開けませんでした: ${err.message}` };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "sendEntry") {
    openMailto(message.subject, message.body).then(sendResponse);
    return true;
  }
  if (message?.type === "testEmail") {
    openMailto(
      "[テスト送信] Journey Sidebar",
      "この投稿は Journey Sidebar 拡張機能の接続テストです。\n\nメールソフトが正しいアドレス宛に開けば設定は成功です。"
    ).then(sendResponse);
    return true;
  }
  return false;
});
