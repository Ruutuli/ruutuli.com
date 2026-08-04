import path from "path";

export const STORE_DIR = path.join(process.cwd(), "data", "store");

export const COSPLAYS_FILE = path.join(STORE_DIR, "cosplays.json");
export const WIGS_FILE = path.join(STORE_DIR, "wigs.json");
export const TASKS_FILE = path.join(STORE_DIR, "tasks.json");
export const SETTINGS_FILE = path.join(STORE_DIR, "settings.json");
