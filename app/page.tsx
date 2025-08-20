"use client";

import { useEffect, useRef, useState } from "react";

function BeforeAfter({
  beforeSrc,
  afterSrc,
  zoom = 1,
}: {
  beforeSrc: string;
  afterSrc: string;
  zoom?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState<number>(0.5); // 0..1

  // キーボード左右で微調整できると便利（フォーカス時）
  const rangeRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const el = rangeRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.02 : 0.02;
      setRatio((r) => Math.max(0, Math.min(1, r + delta)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-block",
        alignSelf: "start",
        maxWidth: "100%",
        overflow: "auto",
        borderRadius: 12,
        background: "rgba(0,0,0,0.2)",
        border: "1px solid var(--card-border)",
      }}
    >
      {/* Before（下層） */}
      <img
        src={beforeSrc}
        alt="before"
        style={{
          display: "block",
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          userSelect: "none",
        }}
        draggable={false}
      />

      {/* After（上層をマスク表示：幅で切る） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${ratio * 100}%`,
          overflow: "hidden",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <img
          src={afterSrc}
          alt="after"
          style={{
            display: "block",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            userSelect: "none",
          }}
          draggable={false}
        />
      </div>

      {/* ハンドル（中央の縦線） */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${ratio * 100}%`,
          width: 0,
          borderLeft: "2px solid rgba(255,255,255,0.8)",
          transform: "translateX(-1px)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {/* スライダーUI（アクセシブル&スマホ対応） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 8,
          display: "flex",
          justifyContent: "center",
          zIndex: 4,
          pointerEvents: "auto",
        }}
      >
        <input
          ref={rangeRef}
          type="range"
          min={0}
          max={100}
          value={Math.round(ratio * 100)}
          onChange={(e) => setRatio(Number(e.target.value) / 100)}
          style={{
            width: "60%",
            appearance: "none",
            height: 6,
            borderRadius: 999,
            background: "rgba(255,255,255,0.35)",
          }}
        />
      </div>
    </div>
  );
}

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [dimType, setDimType] = useState<"width" | "height">("width");
  const [dimValue, setDimValue] = useState<number>(2048);
  const [outFormat, setOutFormat] = useState<"png" | "webp">("png");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const downloadAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // プレビューズーム（100% / 200%）
  const [zoom, setZoom] = useState<1 | 2>(1);

  const handleFile = (f: File | null) => {
    setFile(f);
    setDownloadUrl(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  async function handleUpscale() {
    if (!file) return;
    if (!dimValue || dimValue <= 0) {
      alert("幅または高さに正の数値を入力してください");
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
      {/* ★この大きな<style>はSSR差分でHydration Errorの原因になりやすいです。
          将来は app/globals.css へ移すのをおすすめします（今はそのまま残して動かします）。 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
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
          font-size: 28px;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 860px) {
          .grid { grid-template-columns: 1.2fr 1fr; }
        }
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
        .preview { height: 360px; display: grid; place-items: center; overflow: hidden;
          border-radius: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--card-border); }
        .preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .note { color: var(--muted); font-size: 12px; margin-top: 8px; }
        .footer { margin-top: 14px; display:flex; justify-content: space-between; align-items:center; font-size: 12px; color: var(--muted); }
      `}</style>

      <div className="wrap">
        <div className="card">
          <div className="title">画像ファイルアップスケール</div>

          <div className="grid" style={{ marginTop: 18 }}>
            {/* 左：設定 */}
            <div className="panel">
              <label>画像ファイル</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>基準</label>
                  <select
                    className="select"
                    value={dimType}
                    onChange={(e) =>
                      setDimType(e.target.value as "width" | "height")
                    }
                  >
                    <option value="width">幅を指定</option>
                    <option value="height">高さを指定</option>
                  </select>
                </div>
                <div>
                  <label>{dimType === "width" ? "幅(px)" : "高さ(px)"}</label>
                  <input
                    className="number"
                    type="number"
                    min={1}
                    value={dimValue}
                    onChange={(e) => setDimValue(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <div>
                  <label>出力形式</label>
                  <select
                    className="format"
                    value={outFormat}
                    onChange={(e) =>
                      setOutFormat(e.target.value as "png" | "webp")
                    }
                  >
                    <option value="png">PNG（透過保持）</option>
                    <option value="webp">WebP（軽量）</option>
                  </select>
                </div>
              </div>

              <div className="btns">
                <button
                  className="primary"
                  onClick={handleUpscale}
                  disabled={!file || loading}
                >
                  {loading ? (
                    <>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          display: "inline-block",
                          marginRight: 8,
                          verticalAlign: -3,
                          animation: "spin 0.9s linear infinite",
                        }}
                      />
                      処理中…
                    </>
                  ) : (
                    "アップスケール開始"
                  )}
                </button>
                <a
                  ref={downloadAnchorRef}
                  href={downloadUrl ?? "#"}
                  download={
                    outFormat === "webp" ? "upscaled.webp" : "upscaled.png"
                  }
                >
                  <button className="ghost" disabled={!downloadUrl}>
                    ダウンロード
                  </button>
                </a>
              </div>
              <div className="note">
                ※ 完了後にダウンロードボタンが有効になります
              </div>
            </div>

            {/* 右：プレビュー／比較 */}
            <div className="panel">
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>プレビュー</span>
                <span style={{ display: "inline-flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                      background: zoom === 1 ? "rgba(255,255,255,0.15)" : "transparent",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(2)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--card-border)",
                      background: zoom === 2 ? "rgba(255,255,255,0.15)" : "transparent",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                  >
                    200%
                  </button>
                </span>
              </label>

              {!downloadUrl ? (
                <div className="preview" style={{ overflow: "auto" }}>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: "top left",
                        maxWidth: "none",
                        maxHeight: "none",
                        display: "block",
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div style={{ opacity: 0.7 }}>
                      画像を選択するとプレビューが表示されます
                    </div>
                  )}
                </div>
              ) : (
                <div className="preview" style={{ overflow: "visible" }}>
                  <BeforeAfter
                    beforeSrc={previewUrl!}
                    afterSrc={downloadUrl!}
                    zoom={zoom}
                  />
                </div>
              )}

              <div className="footer">
                <div>比率は自動で維持されます</div>
                <div>ズームは100%/200%、下部スライダーで比較</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
