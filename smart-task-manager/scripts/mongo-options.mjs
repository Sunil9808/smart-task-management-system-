import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Reuse a locally installed binary on Windows before attempting a large download.
// Environment configuration still takes precedence. Never attaches to a running DB.
export function localMongoOptions() {
  if (process.env.MONGOMS_SYSTEM_BINARY || process.platform !== 'win32') return {};
  const root = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'MongoDB', 'Server');
  if (!existsSync(root)) return {};
  const versions = readdirSync(root).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
  // Prefer the locally validated 8.0 LTS series when present.
  const candidates = [...new Set(['8.0', ...versions])];
  for (const version of candidates) {
    const systemBinary = path.join(root, version, 'bin', 'mongod.exe');
    if (existsSync(systemBinary)) return { binary: { systemBinary, version: `${version}.0` } };
  }
  return {};
}
