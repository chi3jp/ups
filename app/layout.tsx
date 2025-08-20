export const metadata = {
  title: "画像ファイルアップスケール",
  description: "画像のアスペクト比を維持してアップスケールします。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
