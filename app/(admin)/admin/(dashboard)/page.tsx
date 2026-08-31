import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Dashboard</h1>
      <div className="flex gap-4">
        <Link
          href="/admin/products"
          className="rounded-md border border-neutral-300 bg-white px-5 py-4 text-sm hover:border-neutral-500"
        >
          Manage Products
        </Link>
        <Link
          href="/admin/categories"
          className="rounded-md border border-neutral-300 bg-white px-5 py-4 text-sm hover:border-neutral-500"
        >
          Manage Categories
        </Link>
      </div>
    </div>
  );
}
