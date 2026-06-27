"use client";

import { PresswallEditorPanel } from "@/components/presswall/presswall-editor";
import { usePresswallEditor } from "@/hooks/use-presswall-editor";

export function AdminDashboard() {
  const editor = usePresswallEditor();

  return <PresswallEditorPanel editor={editor} />;
}
