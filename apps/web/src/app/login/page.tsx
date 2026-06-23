import { APP_NAME } from "@agenttoruk/shared";
import { Bot } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Bot className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-semibold">{APP_NAME}</span>
        </div>
        <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
          Sign in to admin
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Authentication will be enabled in Phase 2.
        </p>
        <form className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@company.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <Link
            href="/dashboard"
            className="block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Continue to dashboard
          </Link>
        </form>
      </div>
    </div>
  );
}
