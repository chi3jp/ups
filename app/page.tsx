"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";

function PageInner() {
  const [file, setFile] = useState<File | null>(null);
  const [dimType, setDimType] = useState<"width" | "height">("width");
  const [dimValue, setDimValue] = useState<number>(2048);
  const [outFormat, setOutFormat] = useState<"png" | "webp">("png");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const downloadAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 検証用のステータス（ランプ/メッセージ表示用）
  const [fileStatus, setFileStatus] = useState<"idle" | "ok" | "error">("idle");
  const [fileMessage, setFileMessage] = useState<string>("");
  const [dimStatus, setDimStatus] = useState<"idle" | "ok" | "error">("ok");
  const [dimMessage, setDimMessage] = useState<string>("");

  // 制限: アップロード 4MB、出力の長辺 最大 5000px
  const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB
  const MAX_OUTPUT_PX = 5000; // px

  const handleFile = async (f: File | null) => {
    setDownloadUrl(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      setFileStatus("idle");
      setFileMessage("");
      return;
    }

    // サイズチェック（Vercelのサーバレス上限を考慮して4MB）
    if (f.size > MAX_FILE_BYTES) {
      alert("ファイルサイズが大きすぎます。4MB以内の画像を選択してください。");
      setFile(null);
      setPreviewUrl(null);
      setFileStatus("error");
      setFileMessage("4MBを超えています。4MB以内の画像を選択してください。");
      return;
    }

    // OK: 受け入れ
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setFileStatus("ok");
    setFileMessage("");
  };

  async function handleUpscale() {
    if (!file) return;
    if (!dimValue || dimValue <= 0) {
      alert("幅または高さに正の数値を入力してください");
      return;
    }
    // 出力側の上限チェック
    if (dimValue > MAX_OUTPUT_PX) {
      alert(`出力サイズが大きすぎます。${MAX_OUTPUT_PX}px 以下を指定してください。`);
      return;
    }
    if (fileStatus === "error" || dimStatus === "error") {
      alert("入力に不備があります。赤ランプの項目を修正してください。");
      return;
    }
    setLoading(true);
    setDownloadUrl(null);

    const form = new FormData();
    form.append("file", file);
    form.append("dimType", dimType);
    form.append("dimValue", String(dimValue));
    form.append("outFormat", outFormat);

    try {
      const res = await fetch("/api/upscale", { method: "POST", body: form });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (e: any) {
      alert(`アップスケールに失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Poppins:wght@600;700&display=swap');
  :root {
    --bg1: #0f1226;
    --bg2: #1e1b4b;
    --card: rgba(255,255,255,0.06);
    --card-border: rgba(255,255,255,0.12);
    --text: #e5e7eb;
    --muted: #a5b4fc;
    --accent: #8b5cf6;
    --accent2: #22d3ee;
    --success: #10b981;
    --warn: #f59e0b;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
    color: var(--text);
    background: radial-gradient(1200px 800px at 20% 10%, #1f1c44 0%, #0b0f2b 60%), linear-gradient(120deg, var(--bg1), var(--bg2));
  }
  .wrap {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 40px 20px;
  }
  .card {
    width: 100%;
    max-width: 860px;
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    backdrop-filter: blur(8px);
  }
  .title {
    font-weight: 800;
    font-size: clamp(20px, 5.2vw, 28px); /* 画面幅に応じて縮小して1行維持 */
    letter-spacing: 0.2px;
    display: flex;
    align-items: center;
    gap: clamp(6px, 2vw, 10px);
    white-space: nowrap;       /* 1行に固定 */
    font-family: Poppins, Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial;
  }
  .title-text { flex: 0 1 auto; min-width: 0; }
  .title-version {
    flex: 0 0 auto;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial;
    font-weight: 600;
    font-size: 11px;
    color: #c7d2fe;
    background: rgba(139,92,246,0.18);
    border: 1px solid rgba(139,92,246,0.35);
    padding: 2px 8px;
    border-radius: 9999px;
  }
  @media (max-width: 360px) {
    .title-version { font-size: 10px; padding: 1px 6px; }
  }
  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 860px) { .grid { grid-template-columns: 1.2fr 1fr; } }
  .panel {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 16px;
  }
  label { font-size: 13px; color: var(--muted); display:block; margin-bottom: 8px; }
  input[type="file"] {
    width: 100%;
    padding: 10px;
    border: 1px dashed var(--card-border);
    border-radius: 12px;
    background: rgba(0,0,0,0.2);
    color: var(--text);
  }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .select, .number, .format {
    width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1px solid var(--card-border); background: rgba(0,0,0,0.2); color: var(--text);
    outline: none;
  }
  .btns { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
  button.primary {
    padding: 12px 16px; border-radius: 12px; border: 0; cursor: pointer;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white; font-weight: 600;
    box-shadow: 0 10px 24px rgba(139,92,246,0.35);
  }
  button.ghost {
    padding: 12px 16px; border-radius: 12px; cursor: pointer;
    background: transparent; color: var(--text); border: 1px solid var(--card-border);
  }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .preview {
    height: 360px; display: grid; place-items: center; overflow: hidden;
    border-radius: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--card-border);
  }
  .preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .note { color: var(--muted); font-size: 12px; margin-top: 8px; }
  .footer { margin-top: 14px; display:flex; justify-content: space-between; align-items:center; font-size: 12px; color: var(--muted); }
  .dot { width:8px; height:8px; border-radius:50%; background: var(--success); display:inline-block; margin-right:6px; }
  .loader {
    width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%; animation: spin 0.9s linear infinite; display:inline-block; vertical-align:-3px; margin-right:8px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* inline hint */
  .hint { color: var(--muted); font-size: 12px; margin-left: 6px; }

  /* === Validation status === */
  .status { display:flex; align-items:center; gap:8px; font-size:12px; margin-top:6px; color: var(--muted); }
  .lamp { width:10px; height:10px; border-radius:50%; background: rgba(255,255,255,0.25); border: 1px solid var(--card-border); }
  .lamp.ok { background: var(--success); border-color: rgba(16,185,129,0.6); }
  .lamp.err { background: #ef4444; border-color: rgba(239,68,68,0.7); }

  /* === Newsletter（パネルと統一の背景） === */
  .newsletter {
    margin-top: 30px;
    padding: 20px;
    text-align: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--card-border);
    border-radius: 16px;
  }
  .newsletter-text {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--text);
  }
  .newsletter-note {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--muted);
  }
  .newsletter-btn {
    display: inline-block;
    margin-top: 16px;
    padding: 12px 20px;
    border-radius: 9999px;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: #fff;
    text-decoration: none;
    box-shadow: 0 6px 18px rgba(139, 92, 246, 0.35);
    transition: transform .15s ease, opacity .15s ease;
  }
  .newsletter-btn:hover {
    transform: translateY(-2px);
    opacity: .9;
  }
`}</style>


      <div className="wrap">
        <div className="card">
          <div className="title">
            <span className="title-text">画像ファイルアップスケール</span>
            <span className="title-version">v1.1.0</span>
          </div>

          <div className="grid" style={{ marginTop: 18 }}>
            {/* 左パネル */}
            <div className="panel">
              <label>
                画像ファイル <span className="hint">（4MB以内）</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0] ?? null);
                }}
              />
              <div className="status">
                <span className={`lamp ${fileStatus === "ok" ? "ok" : fileStatus === "error" ? "err" : ""}`}></span>
                <span>
                  {fileStatus === "error" ? fileMessage : fileStatus === "ok" ? "OK" : "未選択"}
                </span>
              </div>
              

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>基準</label>
                  <select
                    className="select"
                    value={dimType}
                    onChange={(e) => setDimType(e.target.value as "width" | "height")}
                  >
                    <option value="width">幅を指定</option>
                    <option value="height">高さを指定</option>
                  </select>
                </div>
                <div>
                  <label>
                    {dimType === "width" ? "幅(px)" : "高さ(px)"}
                    <span className="hint">（5000px以下）</span>
                  </label>
                  <input
                    className="number"
                    type="number"
                    min={1}
                    max={MAX_OUTPUT_PX}
                    value={dimValue}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDimValue(v);
                      if (!Number.isFinite(v) || v <= 0) {
                        setDimStatus("error");
                        setDimMessage("正の数値を入力してください。");
                      } else if (v > MAX_OUTPUT_PX) {
                        setDimStatus("error");
                        setDimMessage(`${MAX_OUTPUT_PX}px 以下にしてください。`);
                      } else {
                        setDimStatus("ok");
                        setDimMessage("");
                      }
                    }}
                  />
                  <div className="status">
                    <span className={`lamp ${dimStatus === "ok" ? "ok" : dimStatus === "error" ? "err" : ""}`}></span>
                    <span>
                      {dimStatus === "error" ? dimMessage : dimStatus === "ok" ? "OK" : "未入力"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>出力形式</label>
                  <select
                    className="format"
                    value={outFormat}
                    onChange={(e) => setOutFormat(e.target.value as "png" | "webp")}
                  >
                    <option value="png">PNG（透過保持）</option>
                    <option value="webp">WebP（軽量）</option>
                  </select>
                </div>
              </div>

              <div className="btns">
                <button className="primary" onClick={handleUpscale} disabled={!file || loading}>
                  {loading ? <><span className="loader"></span>処理中…</> : "アップスケール開始"}
                </button>
                <a
                  ref={downloadAnchorRef}
                  href={downloadUrl ?? "#"}
                  download={outFormat === "webp" ? "upscaled.webp" : "upscaled.png"}
                >
                  <button className="ghost" disabled={!downloadUrl}>
                    ダウンロード
                  </button>
                </a>
              </div>

              <div className="note">※ 完了後にダウンロードボタンが有効になります</div>
            </div>

            {/* 右パネル */}
            <div className="panel">
              <label>プレビュー</label>
              <div className="preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" />
                ) : (
                  <div style={{ opacity: 0.7 }}>画像を選択するとプレビューが表示されます</div>
                )}
              </div>
              <div className="footer">
                <div>比率は自動で維持されます</div>
              </div>
            </div>
          </div>

          {/* --- Newsletter CTA (Footer) --- */}
          <div className="newsletter">
            <p className="newsletter-text">
              アップデート情報やAI活用のヒントをお届けする<strong>無料メルマガ</strong>を配信中！<br />
              ご登録で <strong>ChatGPTプロンプト集</strong> や <strong>Midjourneyで使えるChrome拡張</strong> をプレゼント中。
            </p>
            {/* 登録URLに差し替え */}
            <a
              className="newsletter-btn"
              href="https://chi3.substack.com/about"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
                  (window as any).gtag("event", "newsletter_click", {
                    event_category: "engagement",
                    event_label: "footer_cta",
                  });
                }
              }}
            >
              📩 特典詳細確認・メルマガ無料登録する
            </a>
            <p className="newsletter-note">※ いつでも1クリックで解除できます</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(PageInner), { ssr: false });
