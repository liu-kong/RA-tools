/**
 * FSP Documentation Search Engine
 * Implements BM25-based search for FSP documentation
 */
import fs from 'fs';
import { config } from './config.js';
// Simple BM25 implementation
class BM25 {
    corpus;
    docFreqs;
    idf;
    dl;
    avgdl;
    k1 = 1.2;
    b = 0.75;
    constructor(corpus) {
        this.corpus = corpus;
        this.dl = corpus.map(doc => doc.length);
        this.avgdl = this.dl.reduce((a, b) => a + b, 0) / this.dl.length;
        this.docFreqs = this.calculateDocFreqs();
        this.idf = this.calculateIDF();
    }
    calculateDocFreqs() {
        const freqs = new Map();
        for (const doc of this.corpus) {
            const uniqueTerms = new Set(doc);
            for (const term of uniqueTerms) {
                freqs.set(term, (freqs.get(term) || 0) + 1);
            }
        }
        return freqs;
    }
    calculateIDF() {
        const idf = new Map();
        const N = this.corpus.length;
        for (const [term, freq] of this.docFreqs) {
            idf.set(term, Math.log((N - freq + 0.5) / (freq + 0.5) + 1));
        }
        return idf;
    }
    getScores(query) {
        const scores = [];
        for (let i = 0; i < this.corpus.length; i++) {
            const doc = this.corpus[i];
            let score = 0;
            for (const term of query) {
                const freq = doc.filter(t => t === term).length;
                if (freq > 0) {
                    const idf = this.idf.get(term) || 0;
                    const numerator = freq * (this.k1 + 1);
                    const denominator = freq + this.k1 * (1 - this.b + this.b * (this.dl[i] / this.avgdl));
                    score += idf * (numerator / denominator);
                }
            }
            scores.push(score);
        }
        return scores;
    }
}
export class FSPSearchEngine {
    version;
    indexFile;
    sections = [];
    bm25 = null;
    moduleIndex = new Map();
    loaded = false;
    constructor(version) {
        this.version = version || config.defaultVersion;
        this.indexFile = config.getIndexFile(this.version);
    }
    async loadIndex() {
        if (this.loaded)
            return true;
        if (!fs.existsSync(this.indexFile)) {
            console.error(`Index file not found: ${this.indexFile}`);
            console.info(`Please run: npm run index -- --version ${this.version}`);
            return false;
        }
        console.info(`Loading index from ${this.indexFile}...`);
        try {
            const content = fs.readFileSync(this.indexFile, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    const section = JSON.parse(line);
                    this.sections.push(section);
                    // Build module index
                    const module = section.module || 'general';
                    if (!this.moduleIndex.has(module)) {
                        this.moduleIndex.set(module, []);
                    }
                    this.moduleIndex.get(module).push(this.sections.length - 1);
                }
            }
            console.info(`Loaded ${this.sections.length} sections`);
            console.info(`Found ${this.moduleIndex.size} modules`);
            // Build BM25 index
            this.buildBM25Index();
            this.loaded = true;
            return true;
        }
        catch (e) {
            console.error(`Failed to load index: ${e}`);
            return false;
        }
    }
    buildBM25Index() {
        console.info('Building BM25 index...');
        const corpus = [];
        for (const section of this.sections) {
            const text = `${section.title} ${section.content}`;
            corpus.push(this.tokenize(text.toLowerCase()));
        }
        this.bm25 = new BM25(corpus);
        console.info(`BM25 index built with ${corpus.length} documents`);
    }
    tokenize(text) {
        // Extract words (including technical terms with underscores)
        const matches = text.match(/\b[a-z0-9_]+\b/g) || [];
        return matches;
    }
    async search(query, options = {}) {
        if (!this.loaded) {
            const loaded = await this.loadIndex();
            if (!loaded)
                return [];
        }
        const maxResults = options.maxResults || config.maxResults;
        // Determine which sections to search
        let searchIndices = Array.from({ length: this.sections.length }, (_, i) => i);
        if (options.module) {
            searchIndices = this.moduleIndex.get(options.module) || [];
        }
        if (options.sectionType) {
            searchIndices = searchIndices.filter(i => this.sections[i].sectionType === options.sectionType);
        }
        if (searchIndices.length === 0)
            return [];
        // Perform search
        const queryTokens = this.tokenize(query.toLowerCase());
        const scores = this.bm25.getScores(queryTokens);
        // Score and filter results
        const scoredResults = [];
        for (const idx of searchIndices) {
            if (scores[idx] > 0) {
                const section = this.sections[idx];
                scoredResults.push({
                    title: section.title,
                    content: section.content.slice(0, 1000),
                    module: section.module,
                    sectionType: section.sectionType,
                    filePath: section.filePath,
                    urlPath: section.urlPath,
                    score: scores[idx]
                });
            }
        }
        // Sort by score and return top results
        scoredResults.sort((a, b) => b.score - a.score);
        return scoredResults.slice(0, maxResults);
    }
    listModules() {
        if (!this.loaded) {
            return [];
        }
        return Array.from(this.moduleIndex.keys()).sort();
    }
    getModuleSections(module) {
        if (!this.loaded) {
            return [];
        }
        const indices = this.moduleIndex.get(module) || [];
        return indices.map(i => this.sections[i]);
    }
}
export default FSPSearchEngine;
