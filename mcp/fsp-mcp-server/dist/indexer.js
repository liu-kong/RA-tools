/**
 * FSP Documentation Indexer
 * Extracts and indexes content from FSP HTML documentation
 */
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { config } from './config.js';
class FSPIndexer {
    version;
    versionPath;
    sections = [];
    constructor(options = {}) {
        this.version = options.version || config.defaultVersion;
        this.versionPath = config.getVersionPath(this.version);
    }
    extractTextContent(elem) {
        if (!elem || !elem.length)
            return '';
        let text = elem.text();
        // Remove excessive whitespace
        return text.replace(/\s+/g, ' ').trim();
    }
    extractCodeBlocks($) {
        const codeBlocks = [];
        $('pre').each((_, elem) => {
            const code = $(elem).text();
            if (code.trim()) {
                codeBlocks.push({
                    code,
                    language: this.detectCodeLanguage(code)
                });
            }
        });
        return codeBlocks;
    }
    detectCodeLanguage(code) {
        if (code.includes('#include') || code.includes('/*'))
            return 'c';
        if (code.includes('typedef') && code.includes('struct'))
            return 'c';
        return 'unknown';
    }
    determineSectionType(title, content, filename) {
        const titleLower = title.toLowerCase();
        const filenameLower = filename.toLowerCase();
        if (titleLower.includes('module') || filenameLower.startsWith('group_'))
            return 'module';
        if (titleLower.includes('function') || titleLower.includes('api') || titleLower.includes('reference'))
            return 'api';
        if (titleLower.includes('struct') || titleLower.includes('typedef') || titleLower.includes('union') || titleLower.includes('enum'))
            return 'struct';
        if (titleLower.includes('example') || titleLower.includes('sample') || titleLower.includes('usage'))
            return 'example';
        return 'general';
    }
    extractModuleName(filename, pageTitle) {
        // Try to extract from filename (group___xxx format)
        if (filename.includes('group___')) {
            let module = filename.replace('group___', '').replace('.html', '');
            module = module.replace(/_+/g, '_').replace(/^_|_$/g, '');
            return module;
        }
        // Try to extract from page title
        const match = pageTitle.match(/R_([A-Z0-9_]+)_/);
        if (match)
            return match[1];
        return 'general';
    }
    parseModulePage(filePath) {
        const sections = [];
        try {
            const html = fs.readFileSync(filePath, 'utf-8');
            const $ = cheerio.load(html);
            // Extract page title
            const titleTag = $('title').text();
            const pageTitle = titleTag.trim() || path.basename(filePath, '.html');
            // Find main content
            const contentDiv = $('div.contents').first();
            const searchRoot = contentDiv.length ? contentDiv : $('body');
            // Extract sections
            searchRoot.find('h1, h2, h3, h4').each((_, header) => {
                const $header = $(header);
                const sectionTitle = this.extractTextContent($header);
                // Get content until next header
                let contentParts = [];
                let current = $header.next();
                while (current.length && !current.is('h1, h2, h3, h4')) {
                    const text = this.extractTextContent(current);
                    if (text)
                        contentParts.push(text);
                    current = current.next();
                }
                const sectionContent = contentParts.join(' ');
                const sectionType = this.determineSectionType(sectionTitle, sectionContent, path.basename(filePath));
                const module = this.extractModuleName(path.basename(filePath), pageTitle);
                if (sectionContent.length > 50) {
                    sections.push({
                        title: sectionTitle ? `${pageTitle} - ${sectionTitle}` : pageTitle,
                        content: sectionContent,
                        filePath: path.relative(config.fspDocsPath, filePath).replace(/\\/g, '/'),
                        module,
                        sectionType,
                        version: this.version,
                        urlPath: path.basename(filePath, '.html')
                    });
                }
            });
            // Extract code examples
            const codeBlocks = this.extractCodeBlocks($);
            for (const block of codeBlocks) {
                if (block.code.length > 20) {
                    sections.push({
                        title: `${pageTitle} - Code Example`,
                        content: `\`\`\`${block.language}\n${block.code}\n\`\`\``,
                        filePath: path.relative(config.fspDocsPath, filePath).replace(/\\/g, '/'),
                        module: this.extractModuleName(path.basename(filePath), pageTitle),
                        sectionType: 'example',
                        version: this.version,
                        urlPath: path.basename(filePath, '.html')
                    });
                }
            }
        }
        catch (e) {
            console.error(`Failed to read ${filePath}:`, e);
        }
        return sections;
    }
    async getAllHtmlFiles() {
        const htmlFiles = [];
        const walkDir = (dir) => {
            try {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    if (item.isDirectory()) {
                        walkDir(fullPath);
                    }
                    else if (item.isFile() && item.name.endsWith('.html')) {
                        // Skip search/index files
                        if (!item.name.includes('search') &&
                            !item.name.includes('navtree') &&
                            !item.name.includes('dynsections')) {
                            htmlFiles.push(fullPath);
                        }
                    }
                }
            }
            catch (e) {
                console.error(`Error reading directory ${dir}:`, e);
            }
        };
        walkDir(this.versionPath);
        return htmlFiles;
    }
    async indexDocumentation(forceReindex = false) {
        const indexFile = config.getIndexFile(this.version);
        if (!forceReindex && fs.existsSync(indexFile)) {
            console.log(`Index already exists for ${this.version}. Use force=true to rebuild.`);
            return 0;
        }
        if (!fs.existsSync(this.versionPath)) {
            console.error(`Documentation path not found: ${this.versionPath}`);
            return 0;
        }
        console.log(`Indexing FSP documentation version ${this.version}...`);
        console.log(`Documentation path: ${this.versionPath}`);
        const htmlFiles = await this.getAllHtmlFiles();
        console.log(`Found ${htmlFiles.length} HTML files to process`);
        let totalSections = 0;
        let indexedFiles = 0;
        for (let i = 0; i < htmlFiles.length; i++) {
            if (i % 100 === 0) {
                console.log(`Processing ${i}/${htmlFiles.length}...`);
            }
            const sections = this.parseModulePage(htmlFiles[i]);
            if (sections.length > 0) {
                this.sections.push(...sections);
                indexedFiles++;
                totalSections += sections.length;
            }
        }
        // Save index
        console.log(`Saving index to ${indexFile}...`);
        fs.mkdirSync(path.dirname(indexFile), { recursive: true });
        const writeStream = fs.createWriteStream(indexFile, { encoding: 'utf-8' });
        for (const section of this.sections) {
            writeStream.write(JSON.stringify(section) + '\n');
        }
        writeStream.end();
        return new Promise((resolve) => {
            writeStream.on('finish', () => {
                console.log(`Indexing complete:`);
                console.log(`  - Indexed ${indexedFiles} files`);
                console.log(`  - Extracted ${totalSections} sections`);
                console.log(`  - Index saved to ${indexFile}`);
                resolve(totalSections);
            });
        });
    }
}
export default FSPIndexer;
