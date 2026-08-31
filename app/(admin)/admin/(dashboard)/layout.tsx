import Link from "next/link";
import { logoutAction } from "@/app/(admin)/admin/login/actions";

// Deliberately utilitarian, not brand-styled — this is an internal tool, not
// a storefront page. Not rendered for /admin/login (see below).
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <AdminChrome />
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}

function AdminChrome() {
  return (
    <header className="border-b border-neutral-300 bg-white px-6 py-3">
      <nav className="mx-auto flex max-w-4xl items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-semibold">
            Studio 242 Admin
          </Link>
          <Link href="/admin/products" className="text-neutral-600 hover:text-neutral-900">
            Products
          </Link>
          <Link href="/admin/categories" className="text-neutral-600 hover:text-neutral-900">
            Categories
          </Link>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-neutral-600 hover:text-neutral-900">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
