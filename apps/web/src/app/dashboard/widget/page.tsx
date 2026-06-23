import { PageHeader } from "@/components/layout/page-header";
import { WidgetThemeEditor } from "@/components/widget/widget-theme-editor";

export default function WidgetThemePage() {
  return (
    <div>
      <PageHeader
        title="Widget"
        description="Customize colors, layout, and welcome message for your embeddable chat widget."
      />
      <WidgetThemeEditor />
    </div>
  );
}
