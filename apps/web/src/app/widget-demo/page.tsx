"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import Link from "next/link";

export default function WidgetDemoPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>
          Please{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            sign in
          </Link>{" "}
          to test the widget.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Widget demo</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Test the chat widget with your organization. Open the chat bubble and
          send a message — it will appear in{" "}
          <Link
            href="/dashboard/conversations"
            className="text-blue-600 hover:underline"
          >
            Conversations
          </Link>
          .
        </p>
        <p className="mt-4 rounded-lg bg-white p-4 text-sm dark:bg-slate-900">
          Organization ID: <code className="font-mono text-xs">{orgId}</code>
        </p>
      </div>

      <Script
        src="/widget.js"
        data-org={orgId}
        data-api-url={appUrl}
        strategy="afterInteractive"
      />
    </div>
  );
}
