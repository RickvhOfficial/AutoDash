/** Minimale zichtduur van load- / refresh-spinners (ms), gelijk op alle pagina's. */
export const LOADER_MIN_VISIBLE_MS = 800

/** Koude start (geen client-cache): snelle opeenvolgende GETs tot er data is. */
export const SNAPSHOT_STARTUP_MAX_ATTEMPTS = 12
export const SNAPSHOT_STARTUP_RETRY_BASE_MS = 80
