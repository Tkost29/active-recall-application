# AI学習アプリケーション

ChatGPT APIを活用した間隔反復学習システム。用語を登録すると、AIが問題を自動生成し採点する。7段階のレベルシステムで学習効率を最大化。

## 技術スタック

### フロントエンド
- **HTML5** - セマンティックなマークアップ
- **CSS3** - Neon Glassmorphism デザイン
  - ダークグラデーション背景 (#0f172a, #1e293b)
  - グラスモーフィズム効果 (backdrop-filter + blur)
  - ネオンカラーグラデーション (pink/purple/blue)
  - フローティングアニメーション
  - レスポンシブデザイン
- **JavaScript (Vanilla JS)** - フレームワークなし
  - ES6+ 構文
  - Async/Await
  - LocalStorage API
  - Fetch API

### バックエンド
- **Node.js** - サーバーサイドランタイム
- **Express.js (v4.18.2)** - Webフレームワーク
- **CORS** - クロスオリジンリソース共有
- **dotenv** - 環境変数管理

### AI/API
- **OpenAI API** - GPT-3.5-turbo モデル
  - 問題生成 (temperature: 0.7)
  - 自動採点 (temperature: 0.3)
  - JSON形式のレスポンス

### データ管理
- **LocalStorage** - クライアントサイドデータ永続化
  - 用語データ
  - 学習履歴
  - レベル進捗

### デザインシステム
- **7段階レベルバッジ** - カラーコード付き進捗表示
- **間隔反復アルゴリズム** - 科学的な記憶定着メソッド
- **レスポンシブUI** - モバイル対応ボトムナビゲーション

## 主な機能

### 4つのセクション

1. **用語登録**
   - 用語と説明を登録
   - レベル・進捗の可視化
   - 次回復習日の自動計算
   - 正解率の統計

2. **問題を解く**
   - **練習モード**: 全用語から出題、レベル変動なし
   - **レベルアップモード**: 復習対象のみ出題、正解でレベルアップ、不正解でLv0リセット
   - AI自動問題生成
   - 70点以上で合格

3. **学習記録**
   - 問題数・平均スコア
   - 学習履歴（日時・用語・スコア・レベル変化）
   - モード別記録

4. **用語集**
   - 用語一覧
   - レベル・進捗表示
   - 検索機能
   - 次回復習日表示

### 7段階レベルシステム（間隔反復学習）

| レベル | 名称 | 復習間隔 | 条件 |
|--------|------|----------|------|
| Lv0 | 未学習 | - | 初回登録時 |
| Lv1 | 初回 | - | 初回学習完了 |
| Lv2 | 短期 | 2〜5時間後 | Lv1から正解 |
| Lv3 | 1日 | 1〜2日後 | Lv2から正解 |
| Lv4 | 3日 | 3〜4日後 | Lv3から正解 |
| Lv5 | 1週 | 7〜8日後 | Lv4から正解 |
| Lv6 | 2週 | 14〜15日後 | Lv5から正解 |
| Lv7 | 完璧 | 31〜32日後 | Lv6から正解（マスター！） |

**重要**: レベルアップモードで不正解の場合、レベルが0にリセットされる。maxHours超過時も自動リセット。

## セットアップ手順

### 1. 依存パッケージのインストール

```powershell
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーし、OpenAI APIキーを設定。

```powershell
Copy-Item .env.example .env
```

`.env`ファイルを編集:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3000
```

### 3. OpenAI APIキーの取得方法

1. [OpenAI](https://platform.openai.com/)にアクセス
2. アカウントを作成またはログイン
3. [API Keys](https://platform.openai.com/api-keys)ページへ移動
4. "Create new secret key"をクリックしてAPIキーを生成
5. 生成されたキーを`.env`ファイルに貼り付け

### 4. サーバーの起動

```powershell
npm start
```

開発モード（自動再起動）:

```powershell
npm run dev
```

### 5. 使用方法

1. ブラウザで`main-page/main.html`を開く
2. 用語を登録
3. モードを選択して問題を解く
4. 採点結果を確認

## ファイル構成

```
learning-application/
├── server.js              # バックエンドサーバー
├── package.json           # Node.js依存関係
├── .env                   # 環境変数（要作成）
├── .env.example           # 環境変数のサンプル
├── README.md              # このファイル
└── main-page/
    ├── main.html          # メインHTML
    ├── style.css          # スタイルシート
    └── app.js             # フロントエンドJavaScript
```

## 注意事項

- OpenAI API利用料金が発生
- APIキーは公開厳禁
- `.env`は`.gitignore`に追加必須

## トラブルシューティング

### サーバーが起動しない
- Node.jsインストール確認
- `npm install`実行確認
- `.env`ファイルとAPIキー確認

### 問題が生成されない
- サーバー起動確認（http://localhost:3000）
- 開発者ツールでエラー確認
- APIキー有効性確認
- API利用制限確認

### CORSエラー
- サーバー起動確認
- ポート番号確認（デフォルト: 3000）
