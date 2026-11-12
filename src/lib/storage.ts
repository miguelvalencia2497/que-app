// localStorage can be unavailable (private mode, blocked storage), so every access is guarded
// and the app still works for the session without it.

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisted; fine for this visit.
  }
}

let memoryClientId: string | null = null;

/** Stable id for this device, created on first use. */
export function getClientId(): string {
  const stored = read('hq.clientId');
  if (stored) return stored;
  memoryClientId ??= crypto.randomUUID();
  write('hq.clientId', memoryClientId);
  return memoryClientId;
}

export function getName(): string | null {
  return read('hq.name');
}

export function setName(name: string): void {
  write('hq.name', name);
}

export function getHostToken(code: string): string | null {
  return read(`hq.host.${code}`);
}

export function setHostToken(code: string, token: string): void {
  write(`hq.host.${code}`, token);
}

export function getTvToken(code: string): string | null {
  return read(`hq.tv.${code}`);
}

export function setTvToken(code: string, token: string): void {
  write(`hq.tv.${code}`, token);
}
