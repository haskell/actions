"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleLineMatcherFormat = exports.MATCH_LINE_KEYS = void 0;
exports.MATCH_LINE_KEYS = [
    'file',
    'fromPath',
    'line',
    'column',
    'severity',
    'code',
    'message',
];
// Constructs a string matching the problem matcher format defined in .github/hlint.json
function getSerializedProblem(toolName, prob) {
    const fields = exports.MATCH_LINE_KEYS
        .map(key => prob[key])
        .map(field => String(field || '').replace(/(\n|\t)/g, ' ').replace(/\s+/g, ' '))
        .join('\t');
    return `${toolName}\t${fields}`;
}
// Construct the regex that can deconstruct the fields
function getMatchLineRegexString(toolName) {
    return [
        `^${toolName}\\t`,
        ...(exports.MATCH_LINE_KEYS
            .map(key => `(?<${key}>[^\\t]*)`)
            .join('\\t')),
        '$',
    ].join('');
}
const MATCH_LINE_REGEX_GROUPS = (exports.MATCH_LINE_KEYS
    .map((key, index) => ([key, index + 1]))
    .reduce((obj, [key, matchGroup]) => ({ ...obj, [key]: matchGroup }), {}));
function getMatcherPatternObj(toolName) {
    return {
        regexp: getMatchLineRegexString(toolName),
        ...MATCH_LINE_REGEX_GROUPS,
    };
}
function getMatcherDef(toolName) {
    return {
        problemMatcher: [{
                owner: toolName,
                pattern: [getMatcherPatternObj(toolName)],
            }],
    };
}
class SingleLineMatcherFormat {
    constructor(toolName) {
        this.toolName = toolName;
    }
    get definition() {
        return getMatcherDef(this.toolName);
    }
    serialize(problem) {
        return getSerializedProblem(this.toolName, problem);
    }
}
exports.SingleLineMatcherFormat = SingleLineMatcherFormat;
