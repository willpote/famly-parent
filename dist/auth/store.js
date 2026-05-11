import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const CONFIG_DIR = join(homedir(), ".config", "famly-parent");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
export async function loadConfig() {
    try {
        const raw = await fs.readFile(CONFIG_PATH, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed.deviceId && parsed.installationId) {
            return parsed;
        }
        return await initialiseConfig(parsed);
    }
    catch (err) {
        if (err.code === "ENOENT") {
            return await initialiseConfig();
        }
        throw err;
    }
}
export async function saveConfig(config) {
    await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), {
        mode: 0o600,
    });
    await fs.chmod(CONFIG_PATH, 0o600);
}
export async function clearToken() {
    const config = await loadConfig();
    delete config.accessToken;
    delete config.email;
    await saveConfig(config);
}
export function configPath() {
    return CONFIG_PATH;
}
async function initialiseConfig(existing = {}) {
    const config = {
        deviceId: existing.deviceId ?? randomUUID(),
        installationId: existing.installationId ?? randomUUID(),
        accessToken: existing.accessToken,
        email: existing.email,
        timezone: existing.timezone,
    };
    await saveConfig(config);
    return config;
}
export async function checkPermissions() {
    try {
        const stat = await fs.stat(CONFIG_PATH);
        const mode = stat.mode & 0o777;
        if (mode & 0o077) {
            process.stderr.write(`warning: ${CONFIG_PATH} permissions are ${mode.toString(8)}; expected 600. Run: chmod 600 ${CONFIG_PATH}\n`);
        }
    }
    catch {
        // file may not exist yet — fine
    }
}
//# sourceMappingURL=store.js.map