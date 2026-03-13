/**
 * Sincroniza a versão do package.json com o tauri.conf.json.
 * Executado automaticamente antes do build via script `prebuild`.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkgPath = resolve(__dirname, "../package.json");
const tauriPath = resolve(__dirname, "../src-tauri/tauri.conf.json");

const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const tauri = JSON.parse(readFileSync(tauriPath, "utf-8"));

if (tauri.version !== pkg.version) {
  tauri.version = pkg.version;
  writeFileSync(tauriPath, JSON.stringify(tauri, null, 2) + "\n");
  console.log(`[sync-version] tauri.conf.json version → ${pkg.version}`);
} else {
  console.log(`[sync-version] versions already in sync: ${pkg.version}`);
}
