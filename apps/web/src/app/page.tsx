import { APP_NAME, APP_TAGLINE } from "@agenttoruk/shared";
import Link from "next/link";
import { ArrowRight, Bot, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Bot className="h-8 w-8 text-blue-600" />
          {APP_NAME}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
            <LayoutDashboard className="h-4 w-4" />
            Enterprise AI support platform
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            {APP_NAME}
          </h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
            {APP_TAGLINE}
          </p>
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            RAG knowledge base, ticketing, human handoff, workflow automation,
            and a customizable chat widget — built for real customer support.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Get started
            </Link>
            <a
              href="https://github.com"
              className="rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View documentation
            </a>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "AI Agent Engine",
              desc: "Intent detection, planning, tools, confidence scoring, and human handoff.",
            },
            {
              title: "Knowledge Base + RAG",
              desc: "pgvector or Gemini File Search with source citations.",
            },
            {
              title: "Admin + Widget",
              desc: "Full dashboard for your team and a branded embeddable chat widget.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
