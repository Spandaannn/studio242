import { loginAction } from "@/app/(admin)/admin/login/actions";

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const hasError = searchParams.error !== undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-6">
      <form
        action={loginAction}
        className="w-full max-w-sm rounded-md border border-neutral-300 bg-white p-8"
      >
        <h1 className="mb-6 text-xl font-semibold">Studio 242 Admin</h1>

        <label htmlFor="password" className="mb-1 block text-sm text-neutral-600">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mb-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {hasError && (
          <p className="mb-3 text-sm text-red-600">Incorrect password.</p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Log in
        </button>
      </form>
    </main>
  );
}
