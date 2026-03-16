import { access, constants, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const defaultFs = {
    access: async (filePath, mode) => await access(filePath, mode),
    mkdir: async (dirPath, options) => await mkdir(dirPath, options),
    readFile: async (filePath, encoding) => await readFile(filePath, encoding),
    writeFile: async (filePath, content, encoding) => await writeFile(filePath, content, encoding),
    rename: async (sourcePath, targetPath) => await rename(sourcePath, targetPath),
    rm: async (filePath, options) => await rm(filePath, options)
};

const DEFAULT_LOCAL_PLUGIN_FILENAME = "ocometixline.js";

async function exists(filePath, fsImpl) {
    try {
        await fsImpl.access(filePath, constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}

function buildLocalPluginModuleContent(entryPath) {
    const entryUrl = pathToFileURL(entryPath).href;
    return `export { default } from ${JSON.stringify(entryUrl)}\n`;
}

export async function installLocalOCometixLineTransaction(options) {
    const fsImpl = options.fs ?? defaultFs;
    const pluginFileName = options.pluginFileName ?? DEFAULT_LOCAL_PLUGIN_FILENAME;
    const pluginPath = path.join(options.pluginDirectory, pluginFileName);
    
    const entryExists = await exists(options.pluginEntryPath, fsImpl);
    if (!entryExists) {
        return {
            kind: "failed",
            reason: "invalid_entry_path",
            message: `OCometixLine plugin entry was not found: ${options.pluginEntryPath}`,
            pluginPath
        };
    }
    
    await fsImpl.mkdir(options.pluginDirectory, { recursive: true });
    const nextContent = buildLocalPluginModuleContent(options.pluginEntryPath);
    
    const pluginExists = await exists(pluginPath, fsImpl);
    if (pluginExists) {
        const currentContent = await fsImpl.readFile(pluginPath, "utf8");
        if (currentContent === nextContent) {
            return {
                kind: "installed",
                pluginPath,
                changed: false
            };
        }
    }
    
    const tempPath = `${pluginPath}.tmp.${process.pid}.${Date.now()}`;
    try {
        await fsImpl.writeFile(tempPath, nextContent, "utf8");
        await fsImpl.rename(tempPath, pluginPath);
    }
    catch {
        await fsImpl.rm(tempPath, { force: true }).catch(() => undefined);
        return {
            kind: "failed",
            reason: "write_failed",
            message: "Local plugin installation failed during temporary write or atomic rename.",
            pluginPath
        };
    }
    
    return {
        kind: "installed",
        pluginPath,
        changed: true
    };
}

export async function uninstallLocalOCometixLineTransaction(options) {
    const fsImpl = options.fs ?? defaultFs;
    const pluginFileName = options.pluginFileName ?? DEFAULT_LOCAL_PLUGIN_FILENAME;
    const pluginPath = path.join(options.pluginDirectory, pluginFileName);
    
    const pluginExists = await exists(pluginPath, fsImpl);
    if (!pluginExists) {
        return {
            kind: "uninstalled",
            pluginPath,
            changed: false
        };
    }
    
    try {
        await fsImpl.rm(pluginPath, { force: true });
    }
    catch {
        return {
            kind: "failed",
            reason: "write_failed",
            message: "Local plugin uninstall failed while removing plugin file.",
            pluginPath
        };
    }
    
    return {
        kind: "uninstalled",
        pluginPath,
        changed: true
    };
}
