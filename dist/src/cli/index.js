import path from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { installLocalOCometixLineTransaction, uninstallLocalOCometixLineTransaction } from "./local-plugin-transaction.js";

const DEFAULT_INSTALL_MODE = "local";
const PLUGIN_ENTRY = fileURLToPath(new URL("../index.js", import.meta.url));

function resolveGlobalPluginDir() {
    const home = homedir();
    if (process.platform === "win32") {
        return path.join(home, "AppData", "Roaming", "opencode", "plugins");
    }
    return path.join(home, ".config", "opencode", "plugins");
}

function printHelp() {
    console.log(`ocometixline CLI

Usage:
  ocometixline <command> [options]

Commands:
  install          Install OCometixLine plugin into OpenCode
  uninstall        Uninstall OCometixLine plugin from OpenCode

Options:
  --plugin-dir <path>  Override plugin directory (default: auto-detected)
  -h, --help       Show this help
`);
}

function parseArgv(argv) {
    if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") {
        return null;
    }
    
    const command = argv[0];
    if (command !== "install" && command !== "uninstall") {
        return null;
    }
    
    const options = {};
    for (let index = 1; index < argv.length; index += 1) {
        const token = argv[index];
        if (token === "--plugin-dir" && index + 1 < argv.length) {
            options.pluginDir = argv[index + 1];
            index += 1;
            continue;
        }
    }
    
    return {
        command,
        options
    };
}

function resolveTargetPluginDir(parsed) {
    if (parsed.options.pluginDir) {
        return path.resolve(parsed.options.pluginDir);
    }
    return resolveGlobalPluginDir();
}

export async function runCli(argv = process.argv.slice(2)) {
    const parsed = parseArgv(argv);
    if (!parsed) {
        printHelp();
        return 1;
    }
    
    const pluginDir = resolveTargetPluginDir(parsed);
    
    if (parsed.command === "install") {
        const result = await installLocalOCometixLineTransaction({
            pluginDirectory: pluginDir,
            pluginEntryPath: PLUGIN_ENTRY
        });
        
        if (result.kind === "failed") {
            console.error(`install failed: ${result.message}`);
            return 1;
        }
        
        console.log(result.changed 
            ? `installed local plugin: ${result.pluginPath}` 
            : `already installed local plugin: ${result.pluginPath}`);
        
        console.log('Add "OCometixLine" to your opencode.json plugin array');
        return 0;
    }
    
    if (parsed.command === "uninstall") {
        const result = await uninstallLocalOCometixLineTransaction({
            pluginDirectory: pluginDir
        });
        
        if (result.kind === "failed") {
            console.error(`uninstall failed: ${result.message}`);
            return 1;
        }
        
        console.log(result.changed 
            ? `uninstalled local plugin: ${result.pluginPath}` 
            : `already uninstalled local plugin: ${result.pluginPath}`);
        return 0;
    }
    
    return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runCli().then((exitCode) => {
        process.exit(exitCode);
    });
}
