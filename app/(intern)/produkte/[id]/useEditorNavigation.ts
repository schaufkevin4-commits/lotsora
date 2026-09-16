"use client";

import { useEffect } from "react";
import type { EditorSave } from "@/lib/editor-save";

export function useEditorNavigation(editor: EditorSave) {
  useEffect(() => {
    let leaving = false;
    const confirmLeave = () => {
      if (leaving || !editor.isBlocked()) return true;
      const accepted = window.confirm("Es gibt ungespeicherte Änderungen oder einen laufenden Vorgang. Seite wirklich verlassen? Nicht bestätigte Eingaben können verloren gehen.");
      if (accepted) { leaving = true; editor.detach(); }
      return accepted;
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (!leaving && editor.isBlocked()) { event.preventDefault(); event.returnValue = ""; }
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return;
      if (!confirmLeave()) { event.preventDefault(); event.stopImmediatePropagation(); }
    };
    const submit = (event: SubmitEvent) => {
      if (event.target instanceof HTMLFormElement && event.target.hasAttribute("data-leaves-editor") && !confirmLeave()) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    type NavigationEvent = Event & { navigationType: string };
    const navigation = (window as unknown as { navigation?: EventTarget }).navigation;
    const navigate = (event: Event) => {
      if ((event as NavigationEvent).navigationType === "traverse" && event.cancelable && !confirmLeave()) event.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    navigation?.addEventListener("navigate", navigate);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      navigation?.removeEventListener("navigate", navigate);
    };
  }, [editor]);
}
