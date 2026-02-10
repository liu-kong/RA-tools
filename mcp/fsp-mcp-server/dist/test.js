/**
 * Test script for FSP MCP Server
 */
import FSPSearchEngine from './search.js';
import { config } from './config.js';
async function testSearch() {
    console.log('='.repeat(60));
    console.log('FSP MCP Server - Search Test');
    console.log('='.repeat(60));
    const version = config.defaultVersion;
    console.log(`\nVersion: ${version}`);
    console.log(`Docs path: ${config.fspDocsPath}`);
    console.log(`Index path: ${config.indexPath}`);
    // Check if index exists
    const engine = new FSPSearchEngine(version);
    if (!(await engine.loadIndex())) {
        console.log('\n❌ Index not found!');
        console.log(`Please run: npm run index -- --version ${version}`);
        return;
    }
    console.log(`\n✅ Index loaded: ${engine['sections'].length} sections`);
    console.log(`✅ Modules: ${engine['moduleIndex'].size}`);
    // Test 1: List modules
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: List Modules');
    console.log('='.repeat(60));
    const modules = engine.listModules();
    console.log(`\nFound ${modules.length} modules`);
    console.log('\nFirst 20 modules:');
    for (const module of modules.slice(0, 20)) {
        console.log(`  - ${module}`);
    }
    // Test 2: Search for UART
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Search for UART Configuration');
    console.log('='.repeat(60));
    const query = 'UART configuration interrupt callback';
    const results = await engine.search(query, { maxResults: 3 });
    console.log(`\nQuery: '${query}'`);
    console.log(`Results: ${results.length}\n`);
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        console.log(`${i + 1}. ${r.title}\n   Module: ${r.module} | Score: ${r.score.toFixed(2)}\n   Content: ${r.content.slice(0, 100)}...`);
    }
    // Test 3: Find examples
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Find Code Examples');
    console.log('='.repeat(60));
    const exampleResults = await engine.search('UART example', {
        maxResults: 3,
        sectionType: 'example',
    });
    console.log(`\nFound ${exampleResults.length} examples\n`);
    for (let i = 0; i < exampleResults.length; i++) {
        const r = exampleResults[i];
        console.log(`${i + 1}. ${r.title}\n   Module: ${r.module}\n   Content preview: ${r.content.slice(0, 150)}...`);
    }
    // Test 4: Specific module
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Get Module Info');
    console.log('='.repeat(60));
    const uartModules = modules.filter(m => m.toLowerCase().includes('uart') || m.toLowerCase().includes('sci'));
    if (uartModules.length > 0) {
        const module = uartModules[0];
        console.log(`\nModule: ${module}`);
        const sections = engine.getModuleSections(module);
        console.log(`Sections: ${sections.length}`);
        console.log('\nSection types:');
        const typeCount = new Map();
        for (const s of sections) {
            const type = s.sectionType;
            typeCount.set(type, (typeCount.get(type) || 0) + 1);
        }
        for (const [type, count] of Array.from(typeCount.entries()).sort((a, b) => b[1] - a[1])) {
            console.log(`  - ${type}: ${count}`);
        }
    }
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));
}
testSearch().catch(console.error);
