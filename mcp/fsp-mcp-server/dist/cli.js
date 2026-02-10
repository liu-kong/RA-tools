#!/usr/bin/env node
/**
 * CLI entry point for FSP MCP Server
 */
import FSPIndexer from './indexer.js';
import { config } from './config.js';
async function main() {
    const args = process.argv.slice(2);
    if (args[0] === 'index') {
        // Run indexer
        const version = args.includes('--version') ? args[args.indexOf('--version') + 1] : undefined;
        const force = args.includes('--force');
        const listVersions = args.includes('--list-versions') || args.includes('-l');
        if (listVersions) {
            console.log('Available FSP versions:');
            for (const v of config.listAvailableVersions()) {
                console.log(`  - ${v}`);
            }
            return;
        }
        const indexer = new FSPIndexer({ version });
        await indexer.indexDocumentation(force);
    }
    else if (args[0] === 'serve' || args[0] === 'start') {
        // Start MCP server
        await import('./server.js');
    }
    else {
        console.log(`
FSP MCP Server - Renesas FSP Documentation Search

Usage:
  fsp-mcp index [--version VERSION] [--force]    Index documentation
  fsp-mcp index --list-versions                  List available versions
  fsp-mcp serve                                  Start MCP server

Options:
  --version VERSION   FSP version to index (default: ${config.defaultVersion})
  --force, -f         Force reindex even if index exists
  --list-versions, -l List all available versions

Examples:
  fsp-mcp index                               # Index default version
  fsp-mcp index --version v6.0.0              # Index specific version
  fsp-mcp index --version v6.0.0 --force      # Force reindex
  fsp-mcp index --list-versions               # List versions
  fsp-mcp serve                               # Start server

For more information, see README.md
    `);
    }
}
main().catch(console.error);
