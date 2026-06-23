"use client";

import { APP_NAME } from "@agenttoruk/shared";
import { Bot, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

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
          Access your organization dashboard
        </p>

        {registered && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Account created. Sign in to continue.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Create organization
          </Link>
        </p>
      </div>
    </div>
  );
}
