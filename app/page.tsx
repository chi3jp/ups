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

  const [fileStatus, setFileStatus] = useState<"idle" | "ok" | "error">("idle");
  const [fileMessage, setFileMessage] = useState<string>("");
  const [dimStatus, setDimStatus] = useState<"idle" | "ok" | "error">("ok");
  const [dimMessage, setDimMessage] = useState<string>("");

  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const MAX_FILE_BYTES = 4 * 1024 * 1024;
  const MAX_OUTPUT_PX = 5000;

  const handleFile = async (f: File | null) => {
    setDownloadUrl(null);
    if (!f) {
      setFile(null);
      setFileStatus("idle");
      setFileMessage("");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      alert("ファイルサイズが大きすぎます。4MB以内の画像を選択してください。");
      setFile(null);
      setFileStatus("error");
      setFileMessage("4MBを超えています。4MB以内の画像を選択してください。");
      return;
    }
    setFile(f);
    setFileStatus("ok");
    setFileMessage("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    void handleFile(e.dataTransfer.files[0] ?? null);
  };

  async function handleUpscale() {
    if (!file) return;
    if (!dimValue || dimValue <= 0) {
      alert("幅または高さに正の数値を入力してください");
      return;
    }
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
      setShowSuccessFlash(true);
      setTimeout(() => setShowSuccessFlash(false), 700);
    } catch (e: any) {
      alert(`アップスケールに失敗しました: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="card">
        <div className="title">
          <span className="title-text">画像ファイルアップスケール</span>
          <span className="title-version">v1.2.0</span>
        </div>

        <div className="panel" style={{ marginTop: 18 }}>
          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            className={`dropzone${isDragging ? " dragging" : ""}${file ? " has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            aria-label="画像ファイルを選択またはドラッグ&ドロップ"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <div className="dropzone-icon">{file ? "✓" : "↑"}</div>
            <div className="dropzone-text">
              {file ? file.name : "クリックまたはドラッグ&ドロップ"}
            </div>
            <div className="dropzone-sub">
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : "PNG / JPG / WebP（4MB以内）"}
            </div>
          </div>
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
            <button
              className={`primary${showSuccessFlash ? " success-flash" : ""}`}
              onClick={handleUpscale}
              disabled={!file || loading}
            >
              {loading ? (
                <><span className="loader"></span>処理中…</>
              ) : showSuccessFlash ? (
                "完了 ✓"
              ) : (
                "アップスケール開始"
              )}
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

        {/* Newsletter CTA */}
        <div className="newsletter-inline">
          <span className="newsletter-inline-text">
            AI活用のヒントをお届けする<strong>無料メルマガ</strong>を配信中！ご登録で特典プレゼント中。
          </span>
          <a
            className="newsletter-btn"
            href="https://chiii3.systeme.io/7af4ded7?ups"
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
            特典を見る →
          </a>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(PageInner), { ssr: false });
