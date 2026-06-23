"use client";

import { PageHeader } from "@/components/layout/page-header";
import { hasPermission } from "@/lib/rbac";
import {
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

interface KnowledgeDoc {
  id: string;
  name: string;
  sourceType: string;
  sourceUrl: string | null;
  status: string;
  errorMessage: string | null;
  chunkCount: number;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  INDEXED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  PENDING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default function KnowledgePage() {
  const { data: session } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [urlName, setUrlName] = useState("");
  const [error, setError] = useState("");

  const canWrite =
    session?.user?.role && hasPermission(session.user.role, "knowledge:write");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = (await res.json()) as { documents: KnowledgeDoc[] };
        setDocuments(data.documents);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      await load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleUrlSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, name: urlName || undefined }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to index URL");
        return;
      }

      setUrl("");
      setUrlName("");
      await load();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document and all its chunks?")) return;

    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function handleReindex(id: string) {
    const res = await fetch(`/api/knowledge/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reindex" }),
    });

    if (res.ok) await load();
    else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Reindex failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Knowledge base"
        description="Upload documents and URLs for RAG-powered answers with citations."
        action={
          canWrite ? (
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload file
              </button>
            </div>
          ) : undefined
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {canWrite && (
        <form
          onSubmit={handleUrlSubmit}
          className="mb-6 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <input
              type="url"
              placeholder="https://docs.example.com/policy"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none ring-blue-600 focus:ring-2"
            />
          </div>
          <input
            type="text"
            placeholder="Display name (optional)"
            value={urlName}
            onChange={(e) => setUrlName(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm sm:w-48"
          />
          <button
            type="submit"
            disabled={uploading || !url.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-700"
          >
            Index URL
          </button>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-[var(--muted)]" />
            <p className="mt-3 text-sm text-[var(--muted)]">
              No documents indexed yet. Upload a PDF or TXT file, or add a URL.
              Requires OPENAI_API_KEY for embeddings.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Chunks</th>
                <th className="px-6 py-3 font-medium">Added</th>
                {canWrite && <th className="px-6 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium">{doc.name}</p>
                    {doc.sourceUrl && (
                      <p className="max-w-xs truncate text-xs text-[var(--muted)]">
                        {doc.sourceUrl}
                      </p>
                    )}
                    {doc.errorMessage && (
                      <p className="text-xs text-red-600">{doc.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 uppercase text-[var(--muted)]">
                    {doc.sourceType}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[doc.status] ?? STATUS_STYLES.PENDING}`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {doc.chunkCount}
                  </td>
                  <td className="px-6 py-4 text-[var(--muted)]">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  {canWrite && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          title="Re-index"
                          onClick={() => handleReindex(doc.id)}
                          className="rounded p-1 text-[var(--muted)] hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => handleDelete(doc.id)}
                          className="rounded p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
