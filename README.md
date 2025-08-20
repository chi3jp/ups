# My Upscale App (Non-AI, Lanczos)

MidJourney等で作成した画像を **AIなし** でアップスケールするNext.jsアプリです。
- アスペクト比維持で **幅 or 高さのどちらか** を指定
- 補間は **Lanczos3**、軽いシャープで見た目を補正
- 処理完了まで **ダウンロードボタンは無効化**

## 1) ローカル実行
```bash
npm install
npm run dev
# http://localhost:3000
```

## 2) デプロイ（Vercel）
### A. GitHub経由（推奨）
1. このフォルダを新規リポジトリにpush  
2. Vercelのダッシュボード → **New Project** → 対象リポジトリを選択  
3. Framework = Next.js（自動認識）→ **Deploy**  
   - 追加設定不要（`app/api/upscale/route.ts` 内の `export const runtime = "nodejs"` によりSharpが動作）

### B. Vercel CLI経由
```bash
npm i -g vercel
vercel login
vercel        # プレビュー
vercel --prod # 本番デプロイ
```

## 3) 使い方
1. 画像を選択
2. 基準を「幅」または「高さ」に切替、値(px)を入力
3. 「アップスケール開始」を押す
4. 完了後に「ダウンロード」ボタンが有効になります

## 注意
- 非AIの補間のため「完全無劣化」ではありませんが、非AIでは高品質な部類です
- 大きすぎる拡大はぼけが目立つことがあります（長辺8K以内を推奨）
# ups
# ups
