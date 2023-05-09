"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/main.ts
var core4 = __toESM(require("@actions/core"));

// src/opts.ts
var core = __toESM(require("@actions/core"));
var import_fs = require("fs");
var import_js_yaml = require("js-yaml");
var import_path = require("path");

// src/versions.json
var versions_exports = {};
__export(versions_exports, {
  cabal: () => cabal,
  default: () => versions_default,
  ghc: () => ghc,
  ghcup: () => ghcup,
  stack: () => stack
});
var ghc = [
  "9.6.1",
  "9.4.5",
  "9.4.4",
  "9.4.3",
  "9.4.2",
  "9.4.1",
  "9.2.7",
  "9.2.6",
  "9.2.5",
  "9.2.4",
  "9.2.3",
  "9.2.2",
  "9.2.1",
  "9.0.2",
  "9.0.1",
  "8.10.7",
  "8.10.6",
  "8.10.5",
  "8.10.4",
  "8.10.3",
  "8.10.2",
  "8.10.1",
  "8.8.4",
  "8.8.3",
  "8.8.2",
  "8.8.1",
  "8.6.5",
  "8.6.4",
  "8.6.3",
  "8.6.2",
  "8.6.1",
  "8.4.4",
  "8.4.3",
  "8.4.2",
  "8.4.1",
  "8.2.2",
  "8.0.2",
  "7.10.3"
];
var cabal = [
  "3.10.1.0",
  "3.8.1.0",
  "3.6.2.0",
  "3.6.0.0",
  "3.4.1.0",
  "3.4.0.0",
  "3.2.0.0",
  "3.0.0.0",
  "2.4.1.0"
];
var stack = [
  "2.9.3",
  "2.9.1",
  "2.7.5",
  "2.7.3",
  "2.7.1",
  "2.5.1",
  "2.3.3",
  "2.3.1",
  "2.1.3",
  "2.1.1",
  "1.9.3",
  "1.9.1",
  "1.7.1",
  "1.6.5",
  "1.6.3",
  "1.6.1",
  "1.5.1",
  "1.5.0",
  "1.4.0",
  "1.3.2",
  "1.3.0",
  "1.2.0"
];
var ghcup = ["0.1.19.2"];
var versions_default = {
  ghc,
  cabal,
  stack,
  ghcup
};

// src/release-revisions.json
var release_revisions_exports = {};
__export(release_revisions_exports, {
  default: () => release_revisions_default,
  win32: () => win32
});
var win32 = {
  ghc: [
    { from: "9.4.3", to: "9.4.3.1" },
    { from: "9.2.5", to: "9.2.5.1" },
    { from: "8.10.2", to: "8.10.2.2" },
    { from: "8.10.1", to: "8.10.1.1" },
    { from: "8.8.4", to: "8.8.4.1" },
    { from: "8.8.3", to: "8.8.3.1" },
    { from: "8.8.2", to: "8.8.2.1" },
    { from: "8.6.1", to: "8.6.1.1" },
    { from: "8.0.2", to: "8.0.2.2" },
    { from: "7.10.3", to: "7.10.3.2" },
    { from: "7.10.2", to: "7.10.2.1" },
    { from: "7.10.1", to: "7.10.1.1" },
    { from: "7.8.4", to: "7.8.4.1" },
    { from: "7.8.3", to: "7.8.3.1" },
    { from: "7.8.2", to: "7.8.2.1" },
    { from: "7.8.1", to: "7.8.1.1" },
    { from: "7.6.3", to: "7.6.3.1" },
    { from: "7.6.2", to: "7.6.2.1" },
    { from: "7.6.1", to: "7.6.1.1" }
  ],
  cabal: [{ from: "3.10.1.0", to: "3.10.1.1" }]
};
var release_revisions_default = {
  win32
};

// src/opts.ts
var release_revisions = release_revisions_exports;
var supported_versions = versions_exports;
var ghcup_version = ghcup[0];
var yamlInputs = (0, import_js_yaml.load)(
  (0, import_fs.readFileSync)((0, import_path.join)(__dirname, "..", "action.yml"), "utf8")
  // The action.yml file structure is statically known.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
).inputs;
function getDefaults(os) {
  const mkVersion = (v, vs, t) => ({
    version: resolve(yamlInputs[v].default, vs, t, os, false),
    // verbose=false: no printout here
    supported: vs
  });
  return {
    ghc: mkVersion("ghc-version", supported_versions.ghc, "ghc"),
    cabal: mkVersion("cabal-version", supported_versions.cabal, "cabal"),
    stack: mkVersion("stack-version", supported_versions.stack, "stack"),
    general: { matcher: { enable: true } }
  };
}
function resolve(version, supported, tool, os, verbose) {
  const result = version === "latest" ? supported[0] : supported.find((v) => v.startsWith(version)) ?? version;
  if (verbose === true && version !== result)
    core.info(`Resolved ${tool} ${version} to ${result}`);
  return result;
}
function releaseRevision(version, tool, os) {
  const result = release_revisions?.[os]?.[tool]?.find(({ from }) => from === version)?.to ?? version;
  return result;
}
function parseYAMLBoolean(name, val) {
  const trueValue = ["true", "True", "TRUE"];
  const falseValue = ["false", "False", "FALSE"];
  if (trueValue.includes(val))
    return true;
  if (falseValue.includes(val))
    return false;
  throw new TypeError(
    `Action input "${name}" does not meet YAML 1.2 "Core Schema" specification: 
Supported boolean values: \`true | True | TRUE | false | False | FALSE\``
  );
}
function parseURL(name, val) {
  if (val === "")
    return void 0;
  try {
    return new URL(val);
  } catch (e2) {
    throw new TypeError(`Action input "${name}" is not a valid URL`);
  }
}
function getOpts({ ghc: ghc2, cabal: cabal2, stack: stack3 }, os, inputs) {
  core.debug(`Inputs are: ${JSON.stringify(inputs)}`);
  const stackNoGlobal = (inputs["stack-no-global"] || "") !== "";
  const stackSetupGhc = (inputs["stack-setup-ghc"] || "") !== "";
  const stackEnable = (inputs["enable-stack"] || "") !== "";
  const matcherDisable = (inputs["disable-matcher"] || "") !== "";
  const ghcupReleaseChannel = parseURL(
    "ghcup-release-channel",
    inputs["ghcup-release-channel"] || ""
  );
  const cabalUpdate = parseYAMLBoolean(
    "cabal-update",
    inputs["cabal-update"] || "true"
  );
  core.debug(`${stackNoGlobal}/${stackSetupGhc}/${stackEnable}`);
  const verInpt = {
    ghc: inputs["ghc-version"] || ghc2.version,
    cabal: inputs["cabal-version"] || cabal2.version,
    stack: inputs["stack-version"] || stack3.version
  };
  const errors = [];
  if (stackNoGlobal && !stackEnable) {
    errors.push("enable-stack is required if stack-no-global is set");
  }
  if (stackSetupGhc && !stackEnable) {
    errors.push("enable-stack is required if stack-setup-ghc is set");
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
  const ghcEnable = !stackNoGlobal;
  const cabalEnable = !stackNoGlobal;
  const opts = {
    ghc: {
      raw: verInpt.ghc,
      resolved: resolve(
        verInpt.ghc,
        ghc2.supported,
        "ghc",
        os,
        ghcEnable
        // if true: inform user about resolution
      ),
      enable: ghcEnable
    },
    ghcup: {
      releaseChannel: ghcupReleaseChannel
    },
    cabal: {
      raw: verInpt.cabal,
      resolved: resolve(
        verInpt.cabal,
        cabal2.supported,
        "cabal",
        os,
        cabalEnable
        // if true: inform user about resolution
      ),
      enable: cabalEnable,
      update: cabalUpdate
    },
    stack: {
      raw: verInpt.stack,
      resolved: resolve(
        verInpt.stack,
        stack3.supported,
        "stack",
        os,
        stackEnable
        // if true: inform user about resolution
      ),
      enable: stackEnable,
      setup: stackSetupGhc
    },
    general: { matcher: { enable: !matcherDisable } }
  };
  core.debug(`Options are: ${JSON.stringify(opts)}`);
  return opts;
}

// src/setup-haskell.ts
var core3 = __toESM(require("@actions/core"));
var io = __toESM(require("@actions/io"));
var import_ensure_error = __toESM(require("ensure-error"));
var fs2 = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_os = require("os");

// src/installer.ts
var core2 = __toESM(require("@actions/core"));
var import_exec = require("@actions/exec");
var import_io = require("@actions/io");
var tc = __toESM(require("@actions/tool-cache"));
var import_fs2 = require("fs");
var import_path2 = require("path");
var import_process = __toESM(require("process"));
var glob = __toESM(require("@actions/glob"));
var fs = __toESM(require("fs"));
var import_compare_versions = require("compare-versions");
var exec = async (cmd, args) => (0, import_exec.exec)(cmd, args, { ignoreReturnCode: true });
function failed(tool, version) {
  throw new Error(`All install methods for ${tool} ${version} failed`);
}
async function configureOutputs(tool, version, path2, os) {
  core2.setOutput(`${tool}-path`, path2);
  core2.setOutput(`${tool}-exe`, await (0, import_io.which)(tool));
  if (tool == "stack") {
    const sr = import_process.default.env["STACK_ROOT"] ?? (os === "win32" ? "C:\\sr" : `${import_process.default.env.HOME}/.stack`);
    core2.setOutput("stack-root", sr);
    if (os === "win32")
      core2.exportVariable("STACK_ROOT", sr);
  }
  core2.setOutput(`${tool}-version`, version);
}
async function success(tool, version, path2, os) {
  core2.addPath(path2);
  await configureOutputs(tool, version, path2, os);
  core2.info(
    `Found ${tool} ${version} in cache at path ${path2}. Setup successful.`
  );
  return true;
}
function warn(tool, version) {
  core2.debug(
    `${tool} ${version} was not found in the cache. It will be downloaded.
If this is unexpected, please check if version ${version} is pre-installed.
The list of pre-installed versions is available from here: https://github.com/actions/runner-images#available-images
If the list is outdated, please file an issue here: https://github.com/actions/runner-images/issues
by using the appropriate tool request template: https://github.com/actions/runner-images/issues/new/choose`
  );
}
function aptVersion(tool, version) {
  return tool === "cabal" ? /[^.]*\.?[^.]*/.exec(version)[0] : version;
}
async function isInstalled(tool, version, os) {
  const toolPath = tc.find(tool, version);
  if (toolPath)
    return success(tool, version, toolPath, os);
  const ghcupPath = os === "win32" ? "C:/ghcup/bin" : `${import_process.default.env.HOME}/.ghcup/bin`;
  const v = aptVersion(tool, version);
  const aptPath = `/opt/${tool}/${v}/bin`;
  const chocoPath = await getChocoPath(
    tool,
    version,
    releaseRevision(version, tool, os)
  );
  const locations = {
    stack: [],
    // Always installed into the tool cache
    cabal: {
      win32: [chocoPath, ghcupPath],
      linux: [aptPath, ghcupPath],
      darwin: [ghcupPath]
    }[os],
    ghc: {
      win32: [chocoPath, ghcupPath],
      linux: [aptPath, ghcupPath],
      darwin: [ghcupPath]
    }[os]
  };
  core2.debug(`isInstalled ${tool} ${version} ${locations[tool]}`);
  const f = await exec(await ghcupBin(os), ["whereis", tool, version]);
  core2.info(`
`);
  core2.debug(`isInstalled whereis ${f}`);
  for (const p of locations[tool]) {
    core2.info(`Attempting to access tool ${tool} at location ${p}`);
    const installedPath = await import_fs2.promises.access(p).then(() => p).catch(() => void 0);
    if (installedPath == void 0) {
      core2.info(`Failed to access tool ${tool} at location ${p}`);
    } else {
      core2.info(`Succeeded accessing tool ${tool} at location ${p}`);
    }
    if (installedPath) {
      core2.debug(`isInstalled installedPath: ${installedPath}`);
      if (installedPath === ghcupPath) {
        const ghcupSetResult = await exec(await ghcupBin(os), [
          "set",
          tool,
          version
        ]);
        if (ghcupSetResult == 0) {
          return success(tool, version, installedPath, os);
        } else {
          await exec(await ghcupBin(os), ["unset", tool]);
        }
      } else {
        return success(tool, version, installedPath, os);
      }
    }
  }
  return false;
}
async function installTool(tool, version, os) {
  if (await isInstalled(tool, version, os))
    return;
  warn(tool, version);
  if (tool === "stack") {
    await stack2(version, os);
    if (await isInstalled(tool, version, os))
      return;
    return failed(tool, version);
  }
  switch (os) {
    case "linux":
      if (tool === "ghc" && version === "head") {
        if (!await aptBuildEssential())
          break;
        await ghcupGHCHead();
        break;
      }
      if (tool === "ghc" && (0, import_compare_versions.compareVersions)("8.3", version)) {
        await aptLibNCurses5();
      }
      await ghcup2(tool, version, os);
      if (await isInstalled(tool, version, os))
        return;
      await apt(tool, version);
      break;
    case "win32":
      await choco(tool, version);
      if (await isInstalled(tool, version, os))
        return;
      await ghcup2(tool, version, os);
      break;
    case "darwin":
      await ghcup2(tool, version, os);
      break;
  }
  if (await isInstalled(tool, version, os))
    return;
  return failed(tool, version);
}
async function resetTool(tool, _version, os) {
  if (tool === "stack") {
    return;
  }
  let bin = "";
  switch (os) {
    case "linux":
      bin = await ghcupBin(os);
      await exec(bin, ["unset", tool]);
      return;
    case "darwin":
      bin = await ghcupBin(os);
      await exec(bin, ["unset", tool]);
      return;
    case "win32":
      return;
  }
}
async function stack2(version, os) {
  core2.info(`Attempting to install stack ${version}`);
  const build = {
    linux: `linux-x86_64${(0, import_compare_versions.compareVersions)(version, "2.3.1") >= 0 ? "" : "-static"}`,
    darwin: "osx-x86_64",
    win32: "windows-x86_64"
  }[os];
  const url = `https://github.com/commercialhaskell/stack/releases/download/v${version}/stack-${version}-${build}.tar.gz`;
  const p = await tc.downloadTool(`${url}`).then(tc.extractTar);
  const [stackPath] = await glob.create(`${p}/stack*`, {
    implicitDescendants: false
  }).then(async (g) => g.glob());
  await tc.cacheDir(stackPath, "stack", version);
}
async function aptBuildEssential() {
  core2.info(`Installing build-essential using apt-get (for ghc-head)`);
  const returnCode = await exec(
    `sudo -- sh -c "apt-get update && apt-get -y install build-essential"`
  );
  return returnCode === 0;
}
async function aptLibNCurses5() {
  core2.info(
    `Installing libcurses5 and libtinfo5 using apt-get (for ghc < 8.3)`
  );
  const returnCode = await exec(
    `sudo -- sh -c "apt-get update && apt-get -y install libncurses5 libtinfo5"`
  );
  return returnCode === 0;
}
async function apt(tool, version) {
  const toolName = tool === "ghc" ? "ghc" : "cabal-install";
  const v = aptVersion(tool, version);
  core2.info(`Attempting to install ${toolName} ${v} using apt-get`);
  await exec(
    `sudo -- sh -c "add-apt-repository -y ppa:hvr/ghc && apt-get update && apt-get -y install ${toolName}-${v}"`
  );
}
async function choco(tool, version) {
  core2.info(`Attempting to install ${tool} ${version} using chocolatey`);
  const revision = releaseRevision(version, tool, "win32");
  console.log("::stop-commands::SetupHaskellStopCommands");
  const args = [
    "choco",
    "install",
    tool,
    "--version",
    revision,
    // Andreas, 2023-03-13:
    // Removing the following (deprecated) option confuses getChocoPath, so we keep it for now.
    // TODO: remove this option and update ghc and cabal locations in getChocoPath.
    "--allow-multiple-versions",
    // Andreas, 2023-03-13, issue #202:
    // When installing GHC, skip automatic cabal installation.
    tool == "ghc" ? "--ignore-dependencies" : "",
    // Verbosity options:
    "--no-progress",
    core2.isDebug() ? "--debug" : "--limit-output"
  ];
  if (await exec("powershell", args) !== 0)
    await exec("powershell", [...args, "--pre"]);
  console.log("::SetupHaskellStopCommands::");
  const chocoPath = await getChocoPath(tool, version, revision);
  if (tool == "ghc")
    core2.addPath(chocoPath);
}
async function ghcupBin(os) {
  core2.debug(`ghcupBin : ${os}`);
  if (os === "win32") {
    return "ghcup";
  }
  const cachedBin = tc.find("ghcup", ghcup_version);
  if (cachedBin)
    return (0, import_path2.join)(cachedBin, "ghcup");
  const bin = await tc.downloadTool(
    `https://downloads.haskell.org/ghcup/${ghcup_version}/x86_64-${os === "darwin" ? "apple-darwin" : "linux"}-ghcup-${ghcup_version}`
  );
  await import_fs2.promises.chmod(bin, 493);
  return (0, import_path2.join)(
    await tc.cacheFile(bin, "ghcup", "ghcup", ghcup_version),
    "ghcup"
  );
}
async function addGhcupReleaseChannel(channel, os) {
  core2.info(`Adding ghcup release channel: ${channel}`);
  const bin = await ghcupBin(os);
  await exec(bin, ["config", "add-release-channel", channel.toString()]);
}
async function ghcup2(tool, version, os) {
  core2.info(`Attempting to install ${tool} ${version} using ghcup`);
  const bin = await ghcupBin(os);
  const returnCode = await exec(bin, ["install", tool, version]);
  if (returnCode === 0)
    await exec(bin, ["set", tool, version]);
}
async function ghcupGHCHead() {
  core2.info(`Attempting to install ghc head using ghcup`);
  const bin = await ghcupBin("linux");
  const returnCode = await exec(bin, [
    "install",
    "ghc",
    "-u",
    "https://gitlab.haskell.org/ghc/ghc/-/jobs/artifacts/master/raw/ghc-x86_64-deb9-linux-integer-simple.tar.xz?job=validate-x86_64-linux-deb9-integer-simple",
    "head"
  ]);
  if (returnCode === 0)
    await exec(bin, ["set", "ghc", "head"]);
}
async function getChocoPath(tool, version, revision) {
  core2.debug(
    `getChocoPath(): ChocolateyToolsLocation = ${import_process.default.env.ChocolateyToolsLocation}`
  );
  const chocoToolsLocation = import_process.default.env.ChocolateyToolsLocation ?? (0, import_path2.join)(`${import_process.default.env.SystemDrive}`, "tools");
  let chocoToolPath = (0, import_path2.join)(chocoToolsLocation, `${tool}-${version}`);
  if (!fs.existsSync(chocoToolPath)) {
    chocoToolPath = (0, import_path2.join)(
      `${import_process.default.env.ChocolateyInstall}`,
      "lib",
      `${tool}.${revision}`
    );
  }
  core2.debug(`getChocoPath(): chocoToolPath = ${chocoToolPath}`);
  const pattern = `${chocoToolPath}/**/${tool}.exe`;
  const globber = await glob.create(pattern);
  for await (const file of globber.globGenerator()) {
    core2.debug(`getChocoPath(): found ${tool} at ${file}`);
    return (0, import_path2.dirname)(file);
  }
  core2.debug(`getChocoPath(): cannot find binary for ${tool}`);
  return "<not-found>";
}

// src/setup-haskell.ts
var import_exec2 = require("@actions/exec");
async function cabalConfig() {
  let out = Buffer.from("");
  const append = (b) => out = Buffer.concat([out, b]);
  await (0, import_exec2.exec)("cabal", ["--help"], {
    silent: true,
    listeners: { stdout: append, stderr: append }
  });
  return out.toString().trim().split("\n").slice(-1)[0].trim();
}
async function run(inputs) {
  try {
    core3.info("Preparing to setup a Haskell environment");
    const os = process.platform;
    const opts = getOpts(getDefaults(os), os, inputs);
    core3.debug(`run: inputs = ${JSON.stringify(inputs)}`);
    core3.debug(`run: os     = ${JSON.stringify(os)}`);
    core3.debug(`run: opts   = ${JSON.stringify(opts)}`);
    if (opts.ghcup.releaseChannel) {
      await core3.group(
        `Preparing ghcup environment`,
        async () => addGhcupReleaseChannel(opts.ghcup.releaseChannel, os)
      );
    }
    for (const [t, { resolved }] of Object.entries(opts).filter(
      (o) => o[1].enable
    )) {
      await core3.group(
        `Preparing ${t} environment`,
        async () => resetTool(t, resolved, os)
      );
      await core3.group(
        `Installing ${t} version ${resolved}`,
        async () => installTool(t, resolved, os)
      );
    }
    if (opts.stack.setup)
      await core3.group(
        "Pre-installing GHC with stack",
        async () => (0, import_exec2.exec)("stack", ["setup", opts.ghc.resolved])
      );
    if (opts.cabal.enable)
      await core3.group("Setting up cabal", async () => {
        if (process.platform !== "win32")
          io.mkdirP(`${process.env.HOME}/.cabal/bin`);
        await (0, import_exec2.exec)("cabal", ["user-config", "init"], {
          silent: true,
          ignoreReturnCode: true
        });
        const configFile = await cabalConfig();
        const storeDir = process.platform === "win32" ? "C:\\sr" : `${process.env.HOME}/.cabal/store`;
        fs2.appendFileSync(configFile, `store-dir: ${storeDir}${import_os.EOL}`);
        core3.setOutput("cabal-store", storeDir);
        if (process.platform === "win32") {
          fs2.appendFileSync(configFile, `install-method: copy${import_os.EOL}`);
          fs2.appendFileSync(configFile, `overwrite-policy: always${import_os.EOL}`);
        } else {
          const installdir = `${process.env.HOME}/.cabal/bin`;
          core3.info(`Adding ${installdir} to PATH`);
          core3.addPath(installdir);
        }
        if (opts.ghc.resolved === "7.10.3" && os !== "win32") {
          fs2.appendFileSync(
            configFile,
            ["program-default-options", "  ghc-options: -optl-no-pie"].join(
              import_os.EOL
            ) + import_os.EOL
          );
        }
        if (opts.cabal.update && !opts.stack.enable)
          await (0, import_exec2.exec)("cabal update");
      });
    core3.info(`##[add-matcher]${path.join(__dirname, "..", "matcher.json")}`);
  } catch (_error) {
    const error = (0, import_ensure_error.default)(_error);
    if (core3.isDebug()) {
      core3.setOutput("failed", true);
      core3.debug(error.message);
    } else {
      core3.setFailed(error.message);
    }
  }
}

// src/main.ts
run(
  Object.fromEntries(Object.keys(yamlInputs).map((k) => [k, core4.getInput(k)]))
);
//# sourceMappingURL=index.js.map