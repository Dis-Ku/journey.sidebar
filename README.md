# Journey Sidebar

Edge のサイドバー機能廃止に伴う代替として、ブラウザの**サイドパネル**に簡易日記エディタを表示し、
書いた内容を [Zapier](https://zapier.com/) のWebhook経由でオンライン日記アプリ
[Journey](https://journey.cloud/) に送信する、Chrome/Edge 用の拡張機能（Manifest V3）です。

## これまでの試行錯誤（経緯）

最初はJourneyのWebアプリをサイドパネルに `<iframe>` で直接埋め込む方式を試みましたが、
Journeyは自身がiframe内に表示されていることをJavaScriptで検知すると
「You may have been clickjacked」という警告を出し、編集機能そのものを無効化する仕組みを
持っていることが分かりました。これはブラウザが保護している `window.top` などの仕組みに
依存した、Journey側の正当なセキュリティ対策であり、拡張機能側から回避することはできません
（回避すべきでもありません）。

そこで方針を転換し、**Journeyの画面自体は埋め込まず**、拡張機能独自の簡易エディタを
サイドパネルに表示し、公式に提供されている **Zapier連携（Create Journal Entryアクション）**
を経由してJourneyにエントリーを送信する方式にしました。これにより、Journey側の
セキュリティ機構と衝突することなく、ブラウザにサイドバーとして常駐する体験を実現しています。

## 主な機能

- ツールバーのアイコンをクリックすると、ブラウザ標準の**サイドパネル**が開き（もう一度クリック
  すると閉じます）、タイトル・本文を入力できるシンプルなエディタが表示されます。
- 入力内容は自動的に下書き保存されるので、パネルを閉じても消えません。
- 「Journeyに送信」を押すと、設定したZapier Webhook URLへ内容がPOSTされます。

## セットアップ

### 1. 拡張機能の読み込み

1. このフォルダをダウンロード（またはクローン）します。
2. Edge または Chrome で `edge://extensions` （Chromeなら `chrome://extensions`）を開きます。
3. 右上の「開発者モード」を有効にします。
4. 「展開して読み込み（unpacked）」からこのフォルダを選択します。

### 2. Zapierの設定（初回のみ）

1. [Zapier](https://zapier.com/) で新しいZapを作成します。
2. トリガーに **Webhooks by Zapier → Catch Hook** を選択し、発行されたWebhook URLをコピーします。
3. 拡張機能アイコンを右クリック→「オプション」を開き、コピーしたURLを貼り付けて保存します。
4. オプション画面の「テスト送信」を押すと、Zapier側の「Test trigger」でサンプルデータを
   受信できます。
5. アクションに Journey アプリの **Create Journal Entry** を選び、受信した `title` / `text`
   フィールドをJourney側の入力欄にマッピングします。
6. Zapを有効化（On）にします。

以降、サイドパネルから「Journeyに送信」を押すと、そのZap経由でJourneyにエントリーが
作成されます。

## 送信されるデータ

```json
{
  "title": "（タイトル。空の場合あり）",
  "text": "本文",
  "created_at": "2026-09-11T09:00:00.000Z"
}
```

Zapier以外に送信されることはなく、拡張機能自身がJourneyのアカウント情報やCookieに
アクセスすることもありません。

## ファイル構成

```
manifest.json     拡張機能の定義（Manifest V3）
background.js     サービスワーカー（サイドパネルの開閉挙動、Webhookへの送信処理）
sidepanel.html/js/css  サイドパネルの簡易エディタUI
options.html/js/css    Zapier Webhook URLの設定・テスト送信画面
common.js         共通定数・バリデーション関数
icons/            ツールバー用アイコン
```

## 制約事項

- Journey側のエントリー作成はZapierのZap実行に依存します。Zapierの無料プランには
  月間タスク数の上限があるため、利用量に応じて有料プランの検討が必要になる場合があります。
- 画像添付や位置情報など、Journeyアプリ本来の高度な入力機能は現時点では扱っていません
  （タイトルと本文のみ）。

## ライセンス

MIT License（LICENSE ファイル参照）。Journey は 2Appsy 社の商標・サービスであり、本拡張機能は
非公式のサードパーティ製ツールです。
