import { afterEach, describe, expect, it, vi } from "vitest";
import { EditorSave, formSnapshot, type SaveResult } from "./editor-save";

afterEach(() => vi.useRealTimers());
function data(name: string, materials = ["Baumwolle", "Leinen"]) {
  const fd = new FormData(); fd.set("name", name); materials.forEach((m) => fd.append("material_name", m)); return fd;
}
function setup(write = vi.fn<(fd: FormData, version: number) => Promise<SaveResult>>().mockResolvedValue({ ok: true, error: null, version: 2 })) {
  vi.useFakeTimers(); let form = data("Alt");
  const editor = new EditorSave(1, () => form, write); editor.attach();
  return { editor, write, edit: (fd: FormData) => { form = fd; editor.change(); } };
}
describe("N9: bestätigtes Autosave", () => {
  it("speichert nicht beim Mount und entprellt Änderungen", async () => {
    const { editor, write, edit } = setup();
    await vi.advanceTimersByTimeAsync(2000); expect(write).not.toHaveBeenCalled();
    edit(data("A")); await vi.advanceTimersByTimeAsync(800); edit(data("B"));
    await vi.advanceTimersByTimeAsync(800); expect(write).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(400); expect(write).toHaveBeenCalledOnce();
    expect(write.mock.calls[0][0].get("name")).toBe("B"); expect(editor.isBlocked()).toBe(false);
  });
  it("bestätigt bei verspäteter Antwort nur gesendete Eingaben und sendet neuere danach", async () => {
    let complete!: (value: SaveResult) => void;
    const write = vi.fn<(fd: FormData, version: number) => Promise<SaveResult>>()
      .mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }))
      .mockResolvedValue({ ok: true, error: null, version: 3 });
    const { editor, edit } = setup(write);
    edit(data("Gesendet")); const saving = editor.save(); edit(data("Neu"));
    expect(editor.beginPublication()).toBeNull(); await editor.save(); expect(write).toHaveBeenCalledOnce();
    complete({ ok: true, error: null, version: 2 }); await saving;
    expect(editor.getSnapshot()).toMatchObject({ pending: false, dirty: true });
    await vi.advanceTimersByTimeAsync(1200);
    expect(write.mock.calls[1][0].get("name")).toBe("Neu"); expect(write.mock.calls[1][1]).toBe(2);
    expect(editor.isBlocked()).toBe(false);
  });
  it("sichert Rückänderung auf den alten Ausgangswert während eines Saves erneut", async () => {
    let complete!: (value: SaveResult) => void;
    const write = vi.fn<(fd: FormData, version: number) => Promise<SaveResult>>().mockImplementationOnce(() => new Promise((r) => { complete = r; })).mockResolvedValue({ ok: true, error: null, version: 3 });
    const { editor, edit } = setup(write); edit(data("A")); const saving = editor.save(); edit(data("Alt"));
    complete({ ok: true, error: null, version: 2 }); await saving; expect(editor.isBlocked()).toBe(true);
    await vi.advanceTimersByTimeAsync(1200); expect(write.mock.calls[1][0].get("name")).toBe("Alt");
  });
  it.each(["returned", "thrown"])("stoppt nach Fehler (%s) und erlaubt bewusste Wiederholung", async (kind) => {
    const write = vi.fn<(fd: FormData, version: number) => Promise<SaveResult>>();
    if (kind === "thrown") write.mockRejectedValueOnce(new Error("offline"));
    else write.mockResolvedValueOnce({ ok: false, error: "Fehler" });
    write.mockResolvedValue({ ok: true, error: null, version: 2 });
    const { editor, edit } = setup(write); edit(data("Neu")); await vi.advanceTimersByTimeAsync(1200);
    await vi.advanceTimersByTimeAsync(60000); expect(write).toHaveBeenCalledOnce(); expect(editor.isBlocked()).toBe(true);
    await editor.save(); expect(write).toHaveBeenCalledTimes(2); expect(editor.isBlocked()).toBe(false);
  });
  it("behält einen Versionskonflikt auch nach weiterem Tippen bei", async () => {
    const write = vi.fn<(fd: FormData, version: number) => Promise<SaveResult>>().mockResolvedValue({ ok: false, error: "Konflikt", conflict: true });
    const { editor, edit } = setup(write); edit(data("A")); await editor.save(); edit(data("B"));
    await vi.advanceTimersByTimeAsync(5000); await editor.save(); expect(write).toHaveBeenCalledOnce(); expect(editor.beginPublication()).toBeNull();
  });
  it("sichert reine Materialentfernung einschließlich der letzten Zeile", async () => {
    const { editor, write, edit } = setup(); edit(data("Alt", ["Baumwolle"])); await editor.save();
    edit(data("Alt", [])); await vi.advanceTimersByTimeAsync(1200); expect(write).toHaveBeenCalledTimes(2);
    expect(write.mock.calls[1][0].getAll("material_name")).toEqual([]);
  });
  it("koordiniert manuelles Speichern, Autosave und Veröffentlichung", async () => {
    const { editor, write, edit } = setup(); edit(data("A")); await editor.save();
    await vi.advanceTimersByTimeAsync(2000); expect(write).toHaveBeenCalledOnce();
    expect(editor.beginPublication()).toBe(2); expect(editor.beginPublication()).toBeNull();
    await editor.save(); expect(write).toHaveBeenCalledOnce();
    editor.endPublication({ ok: true, error: null, version: 3 });
    edit(data("B")); await editor.save(); expect(write.mock.calls[1][1]).toBe(3);
  });
  it("bricht geplantes Autosave beim Verlassen ab", async () => {
    const { editor, write, edit } = setup(); edit(data("A")); editor.detach(); await vi.advanceTimersByTimeAsync(5000); expect(write).not.toHaveBeenCalled();
  });
  it("lässt einen fehlgeschlagenen Statuswechsel wiederholen, ohne bestätigte Eingaben umzudeuten", () => {
    const { editor } = setup(); expect(editor.beginPublication()).toBe(1);
    editor.endPublication({ ok: false, error: "Statuswechsel fehlgeschlagen" });
    expect(editor.getSnapshot()).toMatchObject({ dirty: false, error: null });
    expect(editor.beginPublication()).toBe(1);
  });
  it("vergleicht Sonderzeichen und doppelte Materialfelder eindeutig", () => {
    const a = new FormData(); a.append("a", "x&b=y");
    const b = new FormData(); b.append("a", "x"); b.append("b", "y");
    expect(formSnapshot(a)).not.toBe(formSnapshot(b));
  });
});
