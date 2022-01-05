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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMatcher = exports.addMatcherAtPath = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const command_1 = require("@actions/core/lib/command");
const readFile = (0, util_1.promisify)(fs.readFile);
function addMatcherAtPath(matcherPath) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Adding problem matcher at ${matcherPath}`);
        // Reference:
        // https://github.com/actions/setup-node/blob/1ae8f4b1fd89676f69b55d3dd6932b6df089ff7b/src/main.ts
        // uses ##[add-matcher]some-path.json
        //
        // However, https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions
        // says that commands are formatted `::some-command param1=…,param2=…`
        // and https://github.com/actions/toolkit/blob/1cc56db0ff126f4d65aeb83798852e02a2c180c3/docs/commands.md#problem-matchers
        // says to use `::add-matcher::some-path.json`
        //
        // From testing, both syntaxes are accepted.
        // console.log(`::add-matcher::${matcherPath}`);
        // console.log(`##[add-matcher]${matcherPath}`);
        //
        // Further, https://github.com/xt0rted/stylelint-problem-matcher/blob/07aaf5c97e07cd7e328337daf89964fcacbc5d00/src/main.ts
        // uses a utility `import { issueCommand } from "@actions/core/lib/command"`
        // to do this. That looks like the best choice for now.
        const fileContents = yield readFile(matcherPath, 'utf8');
        const problemMatcherDocument = JSON.parse(fileContents);
        (0, command_1.issueCommand)('add-matcher', {}, matcherPath);
        return problemMatcherDocument;
    });
}
exports.addMatcherAtPath = addMatcherAtPath;
function removeMatcher(problemMatcherDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        problemMatcherDocument.problemMatcher.forEach(({ owner }) => {
            (0, command_1.issueCommand)('remove-matcher', { owner }, '');
        });
    });
}
exports.removeMatcher = removeMatcher;
function withMatcherAtPath(matcherPath, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        const matcherDoc = yield ((() => __awaiter(this, void 0, void 0, function* () {
            try {
                // NOTE: Explicitly awaiting to make sure `catch` includes failed promise.
                return yield addMatcherAtPath(matcherPath);
            }
            catch (e) {
                core.error(`Error adding problem matcher at path ${matcherPath}: ${e}`);
                return null;
            }
        }))());
        try {
            // Explicitly awaiting to make sure `finally` runs after fn().
            return yield fn();
        }
        finally {
            if (matcherDoc != null) {
                yield removeMatcher(matcherDoc);
            }
        }
    });
}
exports.default = withMatcherAtPath;
