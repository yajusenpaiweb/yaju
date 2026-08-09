# High Precision Alarm Application

指定された日時（2026年8月10日 11時45分14秒）に高精度で音が鳴るWebアプリケーションです。

## 特徴
1. **高精度ネットワーク時刻同期**: API から日本標準時を取得し、ローカル環境の時計のズレをミリ秒単位で補正します。
2. **Web Audio APIによるシンセサイザー合成音**: 外部ファイルの読み込みが必要ないため軽量で、確実に動作します。
3. **GitHub Pages対応**: HTML/CSS/JS の静的な単一ページ構成のため、GitHub Pagesにデプロイするだけで動作します。

## GitHub Pages へのデプロイ手順

このプロジェクトは静的ファイルのみで構成されているため、非常に簡単に GitHub Pages へ公開できます。

1. **GitHubリポジトリの作成**:
   - 新規のリポジトリを作成します（例: `high-precision-alarm`）。

2. **ファイルのプッシュ**:
   - 以下の3つのファイルをリポジトリのルートにプッシュします。
     - `index.html`
     - `style.css`
     - `app.js`

3. **GitHub Pagesの有効化**:
   - 作成したリポジトリの **Settings (設定)** タブを開きます。
   - 左側のメニューから **Pages** を選択します。
   - **Build and deployment** セクションの **Source** で `Deploy from a branch` を選択します。
   - **Branch** に `main` (または `master`) を選択し、フォルダを `/ (root)` のままにして **Save** をクリックします。

4. **確認**:
   - 数分後、`https://<ユーザー名>.github.io/<リポジトリ名>/` にてサイトが公開されます。
