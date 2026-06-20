import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const electronDir = path.join(rootDir, "electron");
const distSttDir = path.join(rootDir, "dist-stt");
const venvDir = path.join(rootDir, ".venv-stt-sidecar");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function resolvePythonLauncher() {
  if (process.platform === "win32") return { command: "py", args: ["-3.11"] };
  return { command: "python3", args: [] };
}

function pythonBinPath() {
  return process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");
}

function pyInstallerPath() {
  return process.platform === "win32"
    ? path.join(venvDir, "Scripts", "pyinstaller.exe")
    : path.join(venvDir, "bin", "pyinstaller");
}

function ensureVenv() {
  if (existsSync(pythonBinPath())) return;
  const launcher = resolvePythonLauncher();
  run(launcher.command, [...launcher.args, "-m", "venv", venvDir]);
}

function installRequirements() {
  const python = pythonBinPath();
  const reqFile = process.platform === "win32"
    ? path.join(electronDir, "requirements-windows.txt")
    : path.join(electronDir, "requirements.txt");
  run(python, ["-m", "pip", "install", "--upgrade", "pip"]);
  run(python, ["-m", "pip", "install", "-r", reqFile]);
}

function prepareModels() {
  mkdirSync(path.join(distSttDir, "models"), { recursive: true });
  if (process.platform !== "win32") return;

  const python = pythonBinPath();
  const modelSize = process.env.SKU_SW_STT_MODEL ?? "small";
  const ovDir = path.join(distSttDir, "models", `whisper-${modelSize}-ov`);
  if (existsSync(ovDir)) return;

  run(python, [
    path.join(electronDir, "prepare_openvino_model.py"),
    "--model",
    modelSize,
    "--output",
    ovDir,
  ]);
}

function buildSidecar() {
  const pyinstaller = pyInstallerPath();
  const workDir = path.join(rootDir, "build", "pyinstaller-stt");
  rmSync(path.join(distSttDir, "stt_server"), { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  const args = [
    "--noconfirm",
    "--clean",
    "--onedir",
    "--name",
    "stt_server",
    "--distpath",
    distSttDir,
    "--workpath",
    workDir,
    "--collect-all",
    "faster_whisper",
    "--collect-all",
    "ctranslate2",
    "--collect-all",
    "tokenizers",
    "--collect-all",
    "huggingface_hub",
  ];

  if (process.platform === "win32") {
    args.push(
      "--collect-all", "openvino",
      "--collect-all", "openvino_genai",
      "--collect-all", "optimum",
      "--collect-all", "transformers",
    );
  }

  args.push(path.join(electronDir, "stt_server.py"));
  run(pyinstaller, args);
}

function main() {
  mkdirSync(distSttDir, { recursive: true });
  ensureVenv();
  installRequirements();
  prepareModels();
  buildSidecar();
}

main();
