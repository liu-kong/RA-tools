/**
 * FSP Documentation Indexer
 * Extracts and indexes content from FSP HTML documentation
 */
import type { IndexerOptions } from './types.js';
declare class FSPIndexer {
    private version;
    private versionPath;
    private sections;
    constructor(options?: IndexerOptions);
    private extractTextContent;
    private extractCodeBlocks;
    private detectCodeLanguage;
    private determineSectionType;
    private extractModuleName;
    private parseModulePage;
    private getAllHtmlFiles;
    indexDocumentation(forceReindex?: boolean): Promise<number>;
}
export default FSPIndexer;
