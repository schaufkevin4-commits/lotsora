export type SaveResult = { ok: boolean; error: string | null; version?: number; conflict?: boolean };
export type EditorState = {
  dirty: boolean;
  pending: boolean;
  publishing: boolean;
  error: string | null;
  conflict: boolean;
  saved: boolean;
};

// JSON erhält Reihenfolge, doppelte Feldnamen und Sonderzeichen ohne Kollisionen.
export function formSnapshot(data: FormData): string {
  return JSON.stringify([...data.entries()].filter(([key]) => !key.startsWith("$ACTION_")));
}

/** Ein bestätigter Stand, genau ein Request und ein veränderlicher lokaler Stand. */
export class EditorSave {
  private state: EditorState = { dirty: false, pending: false, publishing: false, error: null, conflict: false, saved: false };
  private listeners = new Set<() => void>();
  private confirmed: string | null = null;
  private current = "";
  private timer: ReturnType<typeof setTimeout> | undefined;
  private active = false;

  constructor(
    private version: number,
    private read: () => FormData | null,
    private write: (data: FormData, version: number) => Promise<SaveResult>,
    private delay = 1200,
  ) {}

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(patch: Partial<EditorState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  attach(read = this.read) {
    this.read = read;
    this.active = true;
    const data = this.read();
    if (this.confirmed === null && data) this.confirmed = this.current = formSnapshot(data);
  }
  detach() { this.active = false; this.cancelTimer(); }
  private cancelTimer() { clearTimeout(this.timer); }
  private schedule() {
    this.cancelTimer();
    if (this.active && this.state.dirty && !this.state.pending && !this.state.publishing && !this.state.error) {
      this.timer = setTimeout(() => { void this.save(); }, this.delay);
    }
  }
  change = () => {
    const data = this.read();
    if (!data || this.confirmed === null) return;
    const next = formSnapshot(data);
    if (next !== this.current) {
      this.current = next;
      this.update({ dirty: next !== this.confirmed, error: this.state.conflict ? this.state.error : null });
    }
    this.schedule();
  };
  save = async () => {
    this.cancelTimer();
    if (!this.active || this.state.pending || this.state.publishing || this.state.conflict) return;
    const data = this.read();
    if (!data) return;
    const sent = formSnapshot(data);
    if (sent === this.confirmed && !this.state.error) return;
    this.current = sent;
    this.update({ pending: true, dirty: sent !== this.confirmed, error: null });
    let result: SaveResult;
    try { result = await this.write(data, this.version); }
    catch { result = { ok: false, error: "Speichern konnte nicht bestätigt werden. Ihre Eingaben bleiben hier erhalten. Bitte erneut speichern." }; }
    if (result.ok && result.version !== undefined) {
      this.confirmed = sent;
      this.version = result.version;
      this.update({ pending: false, dirty: this.current !== sent, saved: true, error: null });
      this.schedule();
    } else {
      // Auch nach einer verlorenen Antwort niemals automatisch als gespeichert markieren.
      this.update({ pending: false, dirty: this.current !== this.confirmed, error: result.error ?? "Speichern fehlgeschlagen.", conflict: !!result.conflict });
    }
  };
  isBlocked = () => this.state.pending || this.state.publishing || this.state.dirty || !!this.state.error;
  beginPublication() {
    this.change();
    if (this.isBlocked()) return null;
    this.cancelTimer();
    this.update({ publishing: true });
    return this.version;
  }
  endPublication(result: SaveResult) {
    if (result.ok && result.version !== undefined) this.version = result.version;
    // Ein abgelehnter Statuswechsel macht bestätigte Formulardaten nicht ungespeichert.
    this.update({ publishing: false, error: result.conflict ? result.error : null, conflict: !!result.conflict });
  }
}
