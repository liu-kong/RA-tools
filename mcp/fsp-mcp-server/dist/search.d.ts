/**
 * FSP Documentation Search Engine
 * Implements BM25-based search for FSP documentation
 */
import type { DocumentSection, SearchResult, SearchOptions } from './types.js';
export declare class FSPSearchEngine {
    private version;
    private indexFile;
    private sections;
    private bm25;
    private moduleIndex;
    private loaded;
    constructor(version?: string);
    loadIndex(): Promise<boolean>;
    private buildBM25Index;
    private tokenize;
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    listModules(): string[];
    getModuleSections(module: string): DocumentSection[];
}
export default FSPSearchEngine;
