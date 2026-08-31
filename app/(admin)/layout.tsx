import type { Metadata } from "next";
import "../globals.css";

// A second, separate root layout (via the (admin) route group) — deliberately
// does NOT render the storefront's <Header>/<Footer>. Without this split,
// the public nav/announcement-bar/footer would wrap every admin page,
// including the login screen, since app/(site)/layout.tsx is only a root
// layout for its own route group, not the whole app.
export const metadata: Metadata = {
  title: "Studio 242 Admin",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
