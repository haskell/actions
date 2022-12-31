"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const hlint_1 = require("./hlint");
const bufferedExec_1 = __importDefault(require("./util/bufferedExec"));
const withMatcherAtPath_1 = __importDefault(require("./util/withMatcherAtPath"));
;
async function runHLint(cmd, args) {
    // In order to make regexable output without e.g. tripping over quotes, we need to transform the lines.
    core.info(`Running ${cmd} ${args.join(' ')}`);
    const { stdout: hlintOutputStr, statusCode } = await (0, bufferedExec_1.default)(cmd, args);
    core.info(`hlint completed with status code ${statusCode}`);
    const ideas = JSON.parse(hlintOutputStr);
    ideas.map(hlint_1.serializeProblem).forEach(line => console.log(line));
    return { ideas, statusCode };
}
function getOverallCheckResult(failOn, { ideas, statusCode }) {
    const hintsBySev = hlint_1.SEVERITY_LEVELS.map(sev => ([sev, ideas.filter(hint => hint.severity === sev).length]));
    const hintSummary = hintsBySev
        .filter(([_sevName, numHints]) => numHints > 0)
        .map(([sev, num]) => `${sev} (${num})`).join(', ');
    let ok;
    if (failOn === 'STATUS' && statusCode !== 0) {
        ok = false;
    }
    else if (failOn === 'STATUS' || failOn === 'NEVER') {
        ok = true;
    }
    else {
        // Check the number of hints at or below the selected level.
        // (Low index means high severity).
        // Note that the summary still shows all counts.
        const failedBySev = hintsBySev
            .slice(0, hlint_1.SEVERITY_LEVELS.indexOf(failOn) + 1)
            .filter(([_sevName, numHints]) => numHints > 0);
        ok = failedBySev.length === 0;
    }
    return { ok, hintSummary };
}
async function run({ baseDir, hlintCmd, pathList, failOn }) {
    const hlintArgs = ['-j', '--json', '--', ...pathList];
    const matcherDefPath = path.join(baseDir, hlint_1.MATCHER_DEF_PATH);
    const { ideas, statusCode } = await (0, withMatcherAtPath_1.default)(matcherDefPath, () => runHLint(hlintCmd, hlintArgs));
    const { ok, hintSummary } = getOverallCheckResult(failOn, { ideas, statusCode });
    return { ok, statusCode, ideas, hintSummary };
}
exports.default = run;
