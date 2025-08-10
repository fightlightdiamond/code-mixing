import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Next + TanStack Query Starter",
  description: "Config-driven TanStack Query with entity registry & optimistic updates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
