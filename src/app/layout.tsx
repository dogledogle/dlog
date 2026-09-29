import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BackToTop } from "@/components/back-to-top";
import { BackgroundFX } from "@/components/background-fx";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { site } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <BackgroundFX />
        <ThemeProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <BackToTop />
        </ThemeProvider>
        {/* 控制台彩蛋：给按 F12 的朋友打个招呼。不想要就删掉这个 script。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("%c dlog() %c https://github.com/dogledogle ","color:#fff;background:#18181b;padding:4px 8px;border-radius:4px","","font-weight:bold");`,
          }}
        />
      </body>
    </html>
  );
}
