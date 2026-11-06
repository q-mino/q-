// Domain `conversations`: its public surface. Import it only through this file.
export {}

// Proof: a folder is reachable only through its index.ts.
export { secret } from '../bonds/internal/secret.ts'
