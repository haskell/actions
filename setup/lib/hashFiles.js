"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Copied from https://github.com/actions/runner/blob/master/src/Misc/expressionFunc/hashFiles/src/hashFiles.ts
// TODO: replace with @actions/cache::hashFiles when exposed in actions/toolkit
const glob = __importStar(require("@actions/glob"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const stream = __importStar(require("stream"));
const util = __importStar(require("util"));
const path = __importStar(require("path"));
async function hashFiles(patterns, followSymbolicLinks = true) {
    const matchPatterns = patterns || '';
    console.log(`Match Pattern: ${matchPatterns}`);
    let hasMatch = false;
    const githubWorkspace = process.cwd();
    const result = crypto.createHash('sha256');
    const globber = await glob.create(matchPatterns, { followSymbolicLinks });
    for await (const file of globber.globGenerator()) {
        console.log(file);
        if (!file.startsWith(`${githubWorkspace}${path.sep}`)) {
            console.log(`Ignore '${file}' since it is not under GITHUB_WORKSPACE.`);
            continue;
        }
        if (fs.statSync(file).isDirectory()) {
            console.log(`Skip directory '${file}'.`);
            continue;
        }
        const hash = crypto.createHash('sha256');
        const pipeline = util.promisify(stream.pipeline);
        await pipeline(fs.createReadStream(file), hash);
        result.write(hash.digest());
        if (!hasMatch) {
            hasMatch = true;
        }
    }
    result.end();
    return result.digest('hex');
}
exports.default = hashFiles;
