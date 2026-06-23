import { PageHeader } from "@/components/layout/page-header";

export default function KnowledgePage() {
  return (
    <div>
      <PageHeader
        title="Knowledge base"
        description="Upload documents and URLs for RAG-powered answers."
        action={
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Upload document
          </button>
        }
      />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">
        No documents indexed yet. Supports PDF, DOCX, TXT, and URLs. Coming in
        Phase 7.
      </div>
    </div>
  );
}
