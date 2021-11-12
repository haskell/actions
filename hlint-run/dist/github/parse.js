"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFormattedProblem = void 0;
const core_1 = require("./core");
// Parses the line-by-line output we've serialized.
// This is *just* for validating the matcher JSON regexes.
const parseInt = (str) => {
    const num = Number.parseInt(str);
    if (!Number.isSafeInteger(num)) {
        throw new Error(`Bad integer: ${str}`);
    }
    return num;
};
const parseSeverity = (str) => {
    if (str !== 'error' && str !== 'warning') {
        throw new Error(`Bad severity: ${str}`);
    }
    return str;
};
const parseNullableString = (str) => str || undefined;
const PROBLEM_FIELD_PARSERS = {
    file: String,
    fromPath: parseNullableString,
    line: parseInt,
    column: parseInt,
    severity: parseSeverity,
    code: parseNullableString,
    message: String,
};
function parseFormattedProblem(def, line) {
    const defaultSeverity = def.problemMatcher[0].severity;
    const pattern = def.problemMatcher[0].pattern[0];
    const re = RegExp(pattern.regexp);
    const matchMb = re.exec(line);
    if (matchMb == null) {
        throw new Error(`RegExp (${pattern.regexp}) did not match line (${line})`);
    }
    const match = matchMb;
    function parseKey(k) {
        const groupNum = pattern[k];
        if (groupNum == null || typeof groupNum !== 'number') {
            return;
        }
        const matchVal = match[groupNum];
        if (matchVal == null) {
            return;
        }
        // https://github.com/microsoft/TypeScript/issues/29225#issuecomment-451678927
        // > […] type parameters constrained to other type parameters, where we could deduce
        // > that they are always related, but we currently don't reason about those.
        // @ts-ignore
        const parser = PROBLEM_FIELD_PARSERS[k];
        return parser(matchVal);
    }
    const prob = core_1.MATCH_LINE_KEYS
        .reduce((obj, k) => {
        const v = parseKey(k);
        return v == null ? obj : Object.assign(Object.assign({}, obj), { [k]: v });
    }, {});
    return Object.assign(Object.assign({}, prob), { severity: prob.severity || defaultSeverity });
}
exports.parseFormattedProblem = parseFormattedProblem;
