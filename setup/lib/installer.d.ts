import { OS, Tool } from './opts';
export declare function installTool(tool: Tool, version: string, os: OS): Promise<void>;
export declare function resetTool(tool: Tool, _version: string, os: OS): Promise<void>;
