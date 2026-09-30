import { fileURLToPath } from 'url'
import path from 'path'

// Repo root, resolved from this file rather than hardcoded — these checks were written on
// Windows and must run unchanged on any machine that clones the repo.
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
