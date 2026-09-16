"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EditorSave } from "@/lib/editor-save";
import { produktSpeichern } from "./actions";
import { useEditorNavigation } from "./useEditorNavigation";

const EditorContext = createContext<{ editor: EditorSave; formRef: React.RefObject<HTMLFormElement | null> } | null>(null);

export function EditorProvider({ id, version, children }: { id: string; version: number; children: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  // Neue RSC-Props bestätigen keine lokalen Eingaben. Nur die eigene Action darf
  // den Token fortschreiben; ein anderer Tab wird beim nächsten Write erkannt.
  const [editor] = useState(() => new EditorSave(version,
    () => null,
    (data, expectedVersion) => produktSpeichern(id, expectedVersion, data)));
  useEffect(() => { editor.attach(() => formRef.current ? new FormData(formRef.current) : null); return () => editor.detach(); }, [editor]);
  useEditorNavigation(editor);
  return <EditorContext.Provider value={{ editor, formRef }}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("EditorProvider fehlt.");
  const state = useSyncExternalStore(context.editor.subscribe, context.editor.getSnapshot, context.editor.getSnapshot);
  return { ...context, state };
}
