import Script from "next/script";

export const metadata = {
  title: "画像ファイルアップスケール",
  description: "画像のアスペクト比を維持してアップスケールします。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}

        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PNX36RCEHV"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag; // ほかのコンポーネントからも使えるように
            gtag('js', new Date());
            gtag('config', 'G-PNX36RCEHV', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
