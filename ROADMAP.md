# 勉強時間割振ツール - ロードマップ

## 📱 ネイティブアプリ化（将来計画）

### 概要

現在の Web アプリを iOS/Android のネイティブアプリとして提供する。

### 技術スタック

- **Capacitor**: Web アプリをネイティブアプリに変換
- 既存の React/TypeScript コードをほぼそのまま利用可能

### 実装ステップ

#### Phase 1: 基本的なネイティブアプリ化

1. Capacitor のセットアップ

   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   npx cap add android
   npx cap add ios
   ```

2. ビルド設定

   - Android: Google Play 用のビルド設定
   - iOS: App Store 用のビルド設定

3. テスト
   - Android エミュレータでの動作確認
   - iOS 実機での TestFlight 配布テスト

#### Phase 2: ネイティブ機能の追加（オプション）

- **プッシュ通知**: 学習リマインダー

  ```typescript
  import { LocalNotifications } from "@capacitor/local-notifications";
  ```

- **Google アカウント連携**: データ同期用

  ```typescript
  import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
  ```

- **バックグラウンド処理**: タイマーのバックグラウンド動作

#### Phase 3: アプリストア公開

1. Google Play Store

   - 開発者登録（初回のみ $25）
   - アプリ説明・スクリーンショット準備
   - 公開申請

2. Apple App Store
   - Apple Developer Program 登録（年間 $99）
   - App Store Connect 設定
   - 審査申請

### コスト見積もり

| 項目       | Android         | iOS      |
| ---------- | --------------- | -------- |
| 開発       | 無料            | 無料     |
| 開発者登録 | $25（1 回のみ） | $99/年   |
| ストア公開 | 含まれる        | 含まれる |

### メリット

- ✅ ホーム画面から直接起動
- ✅ オフライン動作の改善
- ✅ ネイティブ通知
- ✅ よりアプリらしい UX
- ✅ App Store/Google Play での発見性

### 参考リンク

- [Capacitor 公式ドキュメント](https://capacitorjs.com/)
- [Capacitor Google Auth](https://github.com/CodetrixStudio/CapacitorGoogleAuth)

---

## 🔮 その他の将来計画

### データ同期機能

- Firebase/Supabase を使ったクラウド同期
- 複数デバイス間でのデータ共有

### 学習分析機能

- より詳細な統計グラフ
- 週次・月次レポート
- 学習パターン分析

### ソーシャル機能

- 友達との進捗共有
- ランキング機能
- 学習グループ

---

_最終更新: 2025-12-03_
