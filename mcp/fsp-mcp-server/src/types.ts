/**
 * Type definitions for FSP MCP Server
 */

export interface DocumentSection {
  title: string;
  content: string;
  filePath: string;
  module: string;
  sectionType: 'module' | 'api' | 'struct' | 'example' | 'general';
  version: string;
  urlPath: string;
}

export interface SearchResult {
  title: string;
  content: string;
  module: string;
  sectionType: string;
  filePath: string;
  urlPath: string;
  score: number;
}

export interface SearchOptions {
  maxResults?: number;
  module?: string;
  sectionType?: string;
}

export interface IndexerOptions {
  version?: string;
  force?: boolean;
}
