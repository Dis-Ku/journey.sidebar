importScripts("common.js");

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.error("Journey Sidebar: failed to set panel behavior", err);
  });
});

async function postToWebhook(payload) {
  const webhookUrl = await getStoredWebhookUrl();
  if (!webhookUrl) {
    return { ok: false, error: "Zapier Webhook URLが設定されていません。設定画面で入力してください。" };
  }
  if (!isZapierWebhookUrl(webhookUrl)) {
    return { ok: false, error: "設定されているURLがZapierのWebhook URL（https://hooks.zapier.com/...）ではありません。" };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `送信に失敗しました（HTTP ${res.status}）。` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `送信中にエラーが発生しました: ${err.message}` };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "sendEntry") {
    postToWebhook(message.payload).then(sendResponse);
    return true;
  }
  if (message?.type === "testWebhook") {
    postToWebhook({
      title: "[テスト送信] Journey Sidebar",
      text: "この投稿は Journey Sidebar 拡張機能の接続テストです。Zap側で正しく届いているか確認してください。",
      created_at: new Date().toISOString(),
    }).then(sendResponse);
    return true;
  }
  return false;
});
