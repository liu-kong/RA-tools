/**
 * Configuration module for FSP MCP Server
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class Config {
    fspDocsPath;
    indexPath;
    defaultVersion;
    maxResults;
    logLevel;
    constructor() {
        this.fspDocsPath = process.env.FSP_DOCS_PATH ||
            path.join(__dirname, '..', 'fsp_documentation');
        this.indexPath = process.env.FSP_INDEX_PATH ||
            path.join(__dirname, '..', 'indexes');
        this.defaultVersion = process.env.FSP_DEFAULT_VERSION || 'v6.0.0';
        this.maxResults = parseInt(process.env.FSP_MAX_RESULTS || '10', 10);
        this.logLevel = process.env.LOG_LEVEL || 'info';
    }
    getVersionPath(version) {
        return path.join(this.fspDocsPath, version);
    }
    getIndexFile(version) {
        return path.join(this.indexPath, `fsp_${version.replace(/\./g, '_')}_index.jsonl`);
    }
    listAvailableVersions() {
        const fs = require('fs');
        const versions = [];
        try {
            if (fs.existsSync(this.fspDocsPath)) {
                const items = fs.readdirSync(this.fspDocsPath, { withFileTypes: true });
                for (const item of items) {
                    if (item.isDirectory() && item.name.startsWith('v')) {
                        versions.push(item.name);
                    }
                }
            }
        }
        catch (e) {
            console.error('Error listing versions:', e);
        }
        return versions.sort().reverse();
    }
}
export const config = new Config();
