/**
 * Configuration module for FSP MCP Server
 */
export interface FSPConfig {
    fspDocsPath: string;
    indexPath: string;
    defaultVersion: string;
    maxResults: number;
    logLevel: string;
}
declare class Config implements FSPConfig {
    fspDocsPath: string;
    indexPath: string;
    defaultVersion: string;
    maxResults: number;
    logLevel: string;
    constructor();
    getVersionPath(version: string): string;
    getIndexFile(version: string): string;
    listAvailableVersions(): string[];
}
export declare const config: Config;
export {};
