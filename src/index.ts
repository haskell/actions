import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as os from 'os'
import * as path from 'path'

const TAR_ARCHIVE = {ext: 'tar.gz', extract: tc.extractTar};
const ZIP_ARCHIVE = {ext: 'zip', extract: tc.extractZip};

interface PlatformArchiveConfig {
  toolType: {pkgPlatform: string, ext: string},
  archiveType: {ext: string, extract: (archivePath: string, toDir: string) => Promise<string>},
};

// process.platform are (linux, darwin, win32, …)
// hlint releases are (linux, osx, windows, …)
const HLINT_PLATFORM_ARCHIVE_CONFIG: Record<string, PlatformArchiveConfig> = {
  darwin: {toolType: {pkgPlatform: 'osx', ext: ''}, archiveType: TAR_ARCHIVE},
  linux: {toolType: {pkgPlatform: 'linux', ext: ''}, archiveType: TAR_ARCHIVE},
  win32: {toolType: {pkgPlatform: 'windows', ext: 'exe'}, archiveType: ZIP_ARCHIVE},
};

interface ToolConfig {
  arch: string,
  name: string,
  exeName: string,
  platform: string,
  version: string,
}

interface ArchiveConfig {
  url: string,
  fileName: string,
  extractionSubdir: string,
  extract: (archivePath: string, toDir: string) => Promise<string>,
}

interface HLintReleaseConfig {
  tool: ToolConfig,
  archive: ArchiveConfig,
};

function mkHlintReleaseConfig(nodeOsPlatform: string, hlintVersion: string): HLintReleaseConfig {
  const config = HLINT_PLATFORM_ARCHIVE_CONFIG[nodeOsPlatform];
  if (!config) {
    throw Error(`Invalid platform for hlint: ${nodeOsPlatform}`);
  }
  const {toolType: {pkgPlatform, ext: exeExt}, archiveType: {ext: archiveExt, extract}} = config;

  // At least as of hlint 3.1.6, all platforms are x86_64.
  const arch = 'x86_64';
  const toolName = 'hlint';
  const releaseName = `${toolName}-${hlintVersion}`;
  const archiveName = `${releaseName}-${arch}-${pkgPlatform}.${archiveExt}`;
  return {
    tool: {
      arch,
      name: toolName,
      exeName: exeExt ? `${toolName}.${exeExt}` : toolName,
      platform: nodeOsPlatform,
      version: hlintVersion,
    },
    archive: {
      // URL for downloading the archive
      url: `https://github.com/ndmitchell/hlint/releases/download/v${hlintVersion}/${archiveName}`,
      // Filename of the archive
      fileName: archiveName,
      // Subdirectory contents will extract under
      extractionSubdir: releaseName,
      // Function of (archiveFile, extractTo).
      // Archive files will be in `${extractTo}/${extractionSubdir}`.
      extract,
    },
  };
}

async function getHlintExistingPath(hlintReleaseConfig: HLintReleaseConfig): Promise<string> {
  const {tool} = hlintReleaseConfig;
  return tc.find(tool.name, tool.version, tool.arch);
}

// https://github.com/actions/toolkit/tree/main/packages/tool-cache
async function downloadHlint(hlintReleaseConfig: HLintReleaseConfig): Promise<string> {
  const {tool, archive} = hlintReleaseConfig;
  const {extract: extractArchive, extractionSubdir} = archive;
  const archivePath = await tc.downloadTool(archive.url);
  const extractedFolder = await extractArchive(archivePath, os.homedir());
  const releaseFolder = path.join(extractedFolder, extractionSubdir);
  const cachedDir = await tc.cacheDir(releaseFolder, tool.name, tool.version, tool.arch);
  return cachedDir;
}

async function findOrDownloadHlint(hlintReleaseConfig: HLintReleaseConfig): Promise<string> {
  const existingHlintDir = await getHlintExistingPath(hlintReleaseConfig);
  if (existingHlintDir) {
    core.debug(`Found cached hlint at ${existingHlintDir}`);
    return existingHlintDir;
  } else {
    core.debug('hlint not cached, so attempting to download');
    return core.group('Downloading hlint', async () => await downloadHlint(hlintReleaseConfig));
  }
}

const HLINT_DEFAULT_VERSION = '3.1.6';

const INPUT_KEY_HLINT_VERSION = 'version';
const OUTPUT_KEY_HLINT_DIR = 'hlint-dir';
const OUTPUT_KEY_HLINT_PATH = 'hlint-path';
const OUTPUT_KEY_HLINT_VERSION = 'version';

async function run() {
  try {
    const hlintVersion = core.getInput(INPUT_KEY_HLINT_VERSION) || HLINT_DEFAULT_VERSION;
    const config = mkHlintReleaseConfig(process.platform, hlintVersion);
    const hlintDir = await findOrDownloadHlint(config);
    core.addPath(hlintDir);
    core.info(`hlint ${config.tool.version} is now set up at ${hlintDir}`);
    core.setOutput(OUTPUT_KEY_HLINT_DIR, hlintDir);
    core.setOutput(OUTPUT_KEY_HLINT_PATH, path.join(hlintDir, config.tool.exeName));
    core.setOutput(OUTPUT_KEY_HLINT_VERSION, config.tool.version);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
