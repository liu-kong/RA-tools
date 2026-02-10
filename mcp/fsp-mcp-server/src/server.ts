/**
 * FSP MCP Server - Main Server Implementation
 * Provides MCP tools for searching and analyzing FSP documentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config.js';
import FSPSearchEngine from './search.js';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cache search engines per version
const searchEngines = new Map<string, FSPSearchEngine>();

function getSearchEngine(version: string): FSPSearchEngine {
  if (!searchEngines.has(version)) {
    searchEngines.set(version, new FSPSearchEngine(version));
  }
  return searchEngines.get(version)!;
}

// Create server instance
const server = new Server(
  {
    name: 'fsp-docs',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available resources (FSP versions)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const versions = config.listAvailableVersions();
  return {
    resources: versions.map(v => ({
      uri: `fsp://${v}`,
      name: `FSP Documentation v${v}`,
      mimeType: 'application/json',
    })),
  };
});

// Read resource (version info)
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri.startsWith('fsp://')) {
    const version = uri.replace('fsp://', '');
    const engine = getSearchEngine(version);

    if (await engine.loadIndex()) {
      const modules = engine.listModules();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                version,
                sectionsCount: engine['sections'].length,
                modules: modules.slice(0, 50),
                totalModules: modules.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  throw new Error('Resource not found');
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [
    {
      name: 'search_docs',
      description: 'Search FSP documentation using natural language queries. Returns relevant documentation sections with code examples and API references.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query in natural language (e.g., "How to configure UART with DMA in FSP?")',
          },
          version: {
            type: 'string',
            description: `FSP version (default: ${config.defaultVersion})`,
            default: config.defaultVersion,
          },
          module: {
            type: 'string',
            description: 'Limit search to specific module (e.g., "SCI_UART", "SPI", "I2C")',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5)',
            default: 5,
          },
          section_type: {
            type: 'string',
            description: 'Filter by section type',
            enum: ['module', 'api', 'struct', 'example', 'general'],
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'list_modules',
      description: 'List all available FSP modules and peripherals. Use this to discover what modules are documented before searching.',
      inputSchema: {
        type: 'object',
        properties: {
          version: {
            type: 'string',
            description: `FSP version (default: ${config.defaultVersion})`,
            default: config.defaultVersion,
          },
          filter: {
            type: 'string',
            description: 'Filter modules by name pattern (e.g., "UART", "SPI")',
          },
        },
      },
    },
    {
      name: 'get_api_reference',
      description: 'Get detailed API reference for a specific function or structure. Returns function signatures, parameter descriptions, and usage notes.',
      inputSchema: {
        type: 'object',
        properties: {
          api_name: {
            type: 'string',
            description: 'API function or structure name (e.g., "R_SCI_UART_Open", "uart_cfg_t")',
          },
          version: {
            type: 'string',
            description: `FSP version (default: ${config.defaultVersion})`,
            default: config.defaultVersion,
          },
        },
        required: ['api_name'],
      },
    },
    {
      name: 'find_examples',
      description: 'Find code examples for specific modules or functionality. Returns actual code snippets from the documentation.',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Keyword to search for in code examples (e.g., "callback", "dma", "interrupt")',
          },
          module: {
            type: 'string',
            description: 'Limit to specific module',
          },
          version: {
            type: 'string',
            description: `FSP version (default: ${config.defaultVersion})`,
            default: config.defaultVersion,
          },
          max_results: {
            type: 'number',
            description: 'Maximum results (default: 10)',
            default: 10,
          },
        },
        required: ['keyword'],
      },
    },
    {
      name: 'get_module_info',
      description: 'Get overview information about a specific FSP module including description, configuration options, and related APIs.',
      inputSchema: {
        type: 'object',
        properties: {
          module: {
            type: 'string',
            description: 'Module name (e.g., "SCI_UART", "SPI", "I2C_SLAVE")',
          },
          version: {
            type: 'string',
            description: `FSP version (default: ${config.defaultVersion})`,
            default: config.defaultVersion,
          },
        },
        required: ['module'],
      },
    },
    {
      name: 'get_config_workflow',
      description: 'Get guided workflow for configuring a specific peripheral in FSP. Returns step-by-step configuration guidance.',
      inputSchema: {
        type: 'object',
        properties: {
          peripheral: {
            type: 'string',
            description: 'Peripheral name (e.g., "UART", "SPI", "I2C", "ADC")',
          },
          version: {
            type: 'string',
            description: `FSP version (default: ${config.defaultVersion})`,
            default: config.defaultVersion,
          },
        },
        required: ['peripheral'],
      },
    },
    {
      name: 'analyze_project_config',
      description: 'Analyze an FSP project configuration.xml file to extract configured modules, pins, clocks, and settings. Use this to understand the current project configuration before making changes.',
      inputSchema: {
        type: 'object',
        properties: {
          config_path: {
            type: 'string',
            description: 'Absolute path to the configuration.xml file (e.g., "F:\\\\projects\\\\my-project\\\\configuration.xml")',
          },
        },
        required: ['config_path'],
      },
    },
  ];

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_docs':
        return await handleSearchDocs(args);
      case 'list_modules':
        return await handleListModules(args);
      case 'get_api_reference':
        return await handleGetApiReference(args);
      case 'find_examples':
        return await handleFindExamples(args);
      case 'get_module_info':
        return await handleGetModuleInfo(args);
      case 'get_config_workflow':
        return await handleGetConfigWorkflow(args);
      case 'analyze_project_config':
        return await handleAnalyzeProjectConfig(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}\n\nPlease check that the documentation index exists.`,
        },
      ],
    };
  }
});

async function handleSearchDocs(args: any) {
  const query = args.query;
  const version = args.version || config.defaultVersion;
  const module = args.module;
  const maxResults = args.max_results || 5;
  const sectionType = args.section_type;

  const engine = getSearchEngine(version);
  const results = await engine.search(query, { maxResults, module, sectionType });

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `No results found for query: '${query}'\n\nTips:\n- Try different keywords\n- Check available modules with list_modules tool\n- Verify version ${version} is indexed`,
        },
      ],
    };
  }

  const output = [
    `## Search Results for '${query}' (FSP ${version})\n`,
    `Found ${results.length} relevant sections\n\n`,
  ];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    output.push(`### ${i + 1}. ${r.title}`);
    output.push(`**Module:** ${r.module} | **Type:** ${r.sectionType} | **Relevance:** ${r.score.toFixed(2)}`);
    output.push(`**Source:** ${r.filePath}`);
    output.push(`\n${r.content}\n`);
    output.push('---\n');
  }

  return {
    content: [{ type: 'text', text: output.join('\n') }],
  };
}

async function handleListModules(args: any) {
  const version = args.version || config.defaultVersion;
  const filter = args.filter?.toLowerCase();

  const engine = getSearchEngine(version);

  if (!(await engine.loadIndex())) {
    return {
      content: [
        {
          type: 'text',
          text: `Index not found for version ${version}. Please run the indexer first:\nnpm run index -- --version ${version}`,
        },
      ],
    };
  }

  let modules = engine.listModules();

  if (filter) {
    modules = modules.filter(m => m.toLowerCase().includes(filter));
  }

  const output = [`## Available FSP Modules (version ${version})\n`, `Total: ${modules.length} modules\n\n`];

  // Group by prefix
  const grouped = new Map<string, string[]>();
  for (const module of modules) {
    const prefix = module.split('_')[0] || module;
    if (!grouped.has(prefix)) grouped.set(prefix, []);
    grouped.get(prefix)!.push(module);
  }

  for (const [prefix, mods] of Array.from(grouped.entries()).sort()) {
    output.push(`### ${prefix}`);
    for (const module of mods.sort()) {
      const sections = engine['moduleIndex'].get(module)?.length || 0;
      output.push(`- ${module} (${sections} sections)`);
    }
    output.push('');
  }

  return {
    content: [{ type: 'text', text: output.join('\n') }],
  };
}

async function handleGetApiReference(args: any) {
  const apiName = args.api_name;
  const version = args.version || config.defaultVersion;

  const engine = getSearchEngine(version);
  const results = await engine.search(apiName, { maxResults: 3 });

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `API reference not found for: ${apiName}\n\nTry using search_docs to find related documentation.`,
        },
      ],
    };
  }

  const output = [`## API Reference: ${apiName}\n`, `FSP Version: ${version}\n\n`];

  for (const result of results) {
    output.push(`### ${result.title}`);
    output.push(`**Module:** ${result.module}`);
    output.push(`\n${result.content}\n`);
  }

  return {
    content: [{ type: 'text', text: output.join('\n') }],
  };
}

async function handleFindExamples(args: any) {
  const keyword = args.keyword;
  const module = args.module;
  const version = args.version || config.defaultVersion;
  const maxResults = args.max_results || 10;

  const engine = getSearchEngine(version);
  let results = await engine.search(keyword, {
    maxResults,
    module,
    sectionType: 'example',
  });

  const output = [`## Code Examples for '${keyword}'`];
  if (module) output.push(` in module ${module}`);
  output.push(` (FSP ${version})\n\n`);

  if (results.length === 0) {
    // Try general search if no examples found
    results = await engine.search(`${keyword} example code sample`, { maxResults, module });
  }

  if (results.length === 0) {
    output.push(
      'No code examples found. Try:\n- Using a more general keyword\n- Searching with search_docs tool\n'
    );
    return {
      content: [{ type: 'text', text: output.join('\n') }],
    };
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    output.push(`### Example ${i + 1}: ${r.title}`);
    output.push(`**Module:** ${r.module}`);
    output.push(`\n${r.content}\n`);
  }

  return {
    content: [{ type: 'text', text: output.join('\n') }],
  };
}

async function handleGetModuleInfo(args: any) {
  const module = args.module;
  const version = args.version || config.defaultVersion;

  const engine = getSearchEngine(version);

  if (!(await engine.loadIndex())) {
    return {
      content: [{ type: 'text', text: 'Index not loaded' }],
    };
  }

  // Search for module documentation
  let results = await engine.search(module, { maxResults: 5, sectionType: 'module' });

  const output = [`## Module Information: ${module}\n`, `FSP Version: ${version}\n\n`];

  if (results.length > 0) {
    for (const result of results) {
      output.push(`### ${result.title}`);
      output.push(`\n${result.content}\n`);
    }
  } else {
    // Try general search
    results = await engine.search(module, { maxResults: 5 });
    if (results.length > 0) {
      output.push('### Overview\n');
      for (const result of results.slice(0, 3)) {
        output.push(`#### ${result.title}`);
        output.push(`\n${result.content.slice(0, 500)}...\n`);
      }
    } else {
      output.push(`No documentation found for module: ${module}\n\nUse list_modules to see available modules.`);
    }
  }

  // List related APIs
  const apiResults = await engine.search(`${module} api function`, {
    maxResults: 10,
    sectionType: 'api',
  });

  if (apiResults.length > 0) {
    output.push('\n### Related APIs\n');
    for (const result of apiResults) {
      output.push(`- ${result.title}`);
    }
  }

  return {
    content: [{ type: 'text', text: output.join('\n') }],
  };
}

async function handleGetConfigWorkflow(args: any) {
  const peripheral = args.peripheral.toUpperCase();
  const version = args.version || config.defaultVersion;

  const engine = getSearchEngine(version);

  const output = [
    `# FSP Configuration Workflow: ${peripheral}\n`,
    `FSP Version: ${version}\n\n`,
    '## Configuration Steps\n\n',
  ];

  // Search for configuration documentation
  const configQueries = [
    `${peripheral} configuration setup`,
    `${peripheral} configurator properties`,
    `R_${peripheral} open`,
    `${peripheral} callback`,
  ];

  const steps: any[] = [];
  for (const query of configQueries) {
    const results = await engine.search(query, { maxResults: 2 });
    steps.push(...results);
  }

  if (steps.length > 0) {
    output.push('### Step 1: In FSP Configurator\n');
    output.push('1. Open your project in e2 studio\n');
    output.push(`2. Add the ${peripheral} module via 'Pins > Peripherals'\n`);
    output.push('3. Configure the following properties:\n\n');

    for (const result of steps.slice(0, 3)) {
      if (result.title.toLowerCase().includes('config') || result.title.toLowerCase().includes('property')) {
        output.push(`**${result.title}**\n`);
        output.push(`${result.content.slice(0, 400)}...\n\n`);
      }
    }

    output.push('\n### Step 2: Generate Project Content\n');
    output.push("Click 'Generate Project Content' to create the driver code.\n\n");

    output.push('### Step 3: Implement User Code\n');
    output.push('Add your application code:\n\n');

    // Find examples
    const exampleResults = await engine.search(`${peripheral} example usage`, {
      maxResults: 2,
      sectionType: 'example',
    });

    if (exampleResults.length > 0) {
      for (const result of exampleResults) {
        output.push(`**${result.title}**\n`);
        output.push(`${result.content.slice(0, 500)}...\n\n`);
      }
    } else {
      output.push('Use find_examples tool to get specific code examples.\n');
    }
  } else {
    output.push(
      `Specific workflow not found for ${peripheral}.\n\n` +
        'General steps:\n' +
        '1. Add the module in FSP Configurator\n' +
        '2. Configure pins and properties\n' +
        '3. Generate Project Content\n' +
        '4. Use the generated API in your code\n' +
        '\nUse search_docs for specific information.'
    );
  }

  output.push('\n---\n');
  output.push('*For detailed API reference, use get_api_reference tool*');

  return {
    content: [{ type: 'text', text: output.join('\n') }],
  };
}

async function handleAnalyzeProjectConfig(args: any) {
  const configPath = args.config_path;

  if (!configPath) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: config_path parameter is required. Provide the absolute path to configuration.xml',
        },
      ],
    };
  }

  try {
    const xmlContent = readFileSync(resolve(configPath), 'utf-8');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    const config = parser.parse(xmlContent);

    const output = [`# FSP Project Configuration Analysis\n`];
    output.push(`**File:** ${configPath}\n\n`);

    // Extract project info
    if (config.project) {
      const project = config.project;
      output.push('## Project Information\n');
      if (project.boardInfo) {
        output.push(`- **Board:** ${project.boardInfo['@_board'] || 'N/A'}`);
        output.push(`- **Part:** ${project.boardInfo['@_part'] || 'N/A'}`);
        output.push(`- **Device:** ${project.boardInfo['@_device'] || 'N/A'}`);
      }
      if (project.toolchain) {
        output.push(`- **Toolchain:** ${project.toolchain['@_version'] || 'N/A'}`);
      }
      output.push('');
    }

    // Extract FSP version
    const fspVersion = config.project?.['fsp-version'] || config.project?.fspVersion || 'Unknown';
    output.push(`- **FSP Version:** ${fspVersion}`);
    output.push('');

    // Extract configured modules
    output.push('## Configured Modules\n');
    const modules: any[] = [];

    if (config.project?.modules?.module) {
      const moduleList = Array.isArray(config.project.modules.module)
        ? config.project.modules.module
        : [config.project.modules.module];

      for (const mod of moduleList) {
        const modName = mod['@_name'] || 'Unknown';
        const modInstance = mod['@_instance'] || 'N/A';

        output.push(`### ${modName} (${modInstance})`);

        // Get module properties
        if (mod.property) {
          const props = Array.isArray(mod.property) ? mod.property : [mod.property];
          output.push('**Properties:**');
          for (const prop of props) {
            const name = prop['@_name'];
            const value = prop['@_value'] || prop['#text'] || prop.default || 'N/A';
            output.push(`  - ${name}: ${value}`);
          }
        }

        // Get callback info
        if (mod.event) {
          const events = Array.isArray(mod.event) ? mod.event : [mod.event];
          output.push('**Events/Callbacks:**');
          for (const evt of events) {
            const evtName = evt['@_name'];
            const callback = evt['@_callback'];
            if (callback) {
              output.push(`  - ${evtName}: ${callback}`);
            }
          }
        }

        output.push('');
        modules.push({ name: modName, instance: modInstance });
      }
    }

    // Extract pin configurations
    output.push('## Pin Configurations\n');
    if (config.project?.pins?.pin) {
      const pinList = Array.isArray(config.project.pins.pin)
        ? config.project.pins.pin
        : [config.project.pins.pin];

      // Group by peripheral
      const pinGroups = new Map<string, any[]>();
      for (const pin of pinList) {
        const peripheral = pin['@_peripheral'] || 'GPIO';
        if (!pinGroups.has(peripheral)) pinGroups.set(peripheral, []);
        pinGroups.get(peripheral)!.push(pin);
      }

      for (const [peripheral, pins] of Array.from(pinGroups.entries()).sort()) {
        output.push(`### ${peripheral}`);
        for (const pin of pins) {
          const pinName = pin['@_name'] || pin['@_pin'] || 'N/A';
          const direction = pin['@_direction'] || 'N/A';
          output.push(`- ${pinName} (${direction})`);
        }
        output.push('');
      }
    }

    // Extract clock configuration
    output.push('## Clock Configuration\n');
    if (config.project?.clocks) {
      const clocks = config.project.clocks;
      if (clocks['sys-clock']) {
        output.push(`- **System Clock:** ${clocks['sys-clock']['@_frequency'] || 'N/A'}`);
      }
      if (clocks['osc-clock']) {
        output.push(`- **Oscillator Clock:** ${clocks['osc-clock']['@_frequency'] || 'N/A'}`);
      }
      if (clocks['pll-clock']) {
        output.push(`- **PLL Clock:** ${clocks['pll-clock']['@_frequency'] || 'N/A'}`);
      }
      output.push('');
    }

    // Summary
    output.push('## Summary\n');
    output.push(`- **Total Configured Modules:** ${modules.length}`);
    output.push('');
    output.push('### Next Steps\n');
    output.push('Use these MCP tools to learn more:');
    output.push(`- For each module above, use \`get_module_info\` to get detailed documentation`);
    output.push(`- Use \`get_config_workflow\` to learn how to configure additional peripherals`);
    output.push(`- Use \`find_examples\` to find code examples for your configured modules`);
    output.push(`- Use \`search_docs\` to search for specific topics in the FSP documentation`);

    return {
      content: [{ type: 'text', text: output.join('\n') }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error analyzing configuration file: ${error instanceof Error ? error.message : String(error)}\n\nMake sure the path is correct and the file is a valid FSP configuration.xml.`,
        },
      ],
    };
  }
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FSP MCP Server running');
}

main().catch(console.error);
