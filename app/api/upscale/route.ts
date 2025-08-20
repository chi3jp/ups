import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const dimType = String(form.get("dimType") ?? "width");
  const dimValue = Number(form.get("dimValue") ?? 0);
  const outFormat = String(form.get("outFormat") ?? "png");

  if (!file) return new Response("file is required", { status: 400 });
  if (!["width", "height"].includes(dimType)) {
    return new Response("dimType must be 'width' or 'height'", { status: 400 });
  }
  if (!Number.isFinite(dimValue) || dimValue <= 0) {
    return new Response("dimValue must be positive number", { status: 400 });
  }

  const inputBuf = Buffer.from(await file.arrayBuffer());
  let pipeline = sharp(inputBuf, { failOnError: true }).rotate();

  if (dimType === "width") {
    pipeline = pipeline.resize({ width: Math.floor(dimValue), kernel: "lanczos3" });
  } else {
    pipeline = pipeline.resize({ height: Math.floor(dimValue), kernel: "lanczos3" });
  }

  pipeline = pipeline.sharpen(0.8, 0.8, 0);
  if (outFormat === "webp") {
    pipeline = pipeline.webp({ quality: 90 });
  } else {
    pipeline = pipeline.png();
  }

  const out = await pipeline.toBuffer();
  const filename = `upscaled.${outFormat}`;
  const mime = outFormat === "webp" ? "image/webp" : "image/png";

  return new Response(out, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}