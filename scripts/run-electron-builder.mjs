import { spawnSync } from "node:child_process";

const rawValue = process.env.RAWALITE_PER_MACHINE ?? "";
const normalized = rawValue.trim().toLowerCase();
const perMachine = ["1", "true", "yes", "on"].includes(normalized);

const userArgs = process.argv.slice(2);
const builderArgs = userArgs.length > 0 ? [...userArgs] : ["--win", "--x64"];

builderArgs.push(`--config.nsis.perMachine=${perMachine ? "true" : "false"}`);

if (perMachine) {
  console.log("[build] Enabling NSIS per-machine installer because RAWALITE_PER_MACHINE=%s", rawValue || "true");
}

const result = spawnSync("electron-builder", builderArgs, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (result.error) {
  console.error("[build] electron-builder failed:", result.error);
  process.exit(1);
}

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}
