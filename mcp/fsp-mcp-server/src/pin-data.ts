/**
 * Pin Data Module - Loads and indexes pin mapping and function data
 * Handles pins.json, pin_functions.json, and toc_flat.json
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Pin mapping entry from pins.json
export interface PinMapping {
  bga289_pin: string;
  power_system: string;
  io_ports: string;
  exbus_sram: string;
  ex_interrupt: string;
  scu_iic: string;
  gpt_agt: string;
  adc: string;
  mipi_glcdc_ceu: string;
}

// Pin function entry from pin_functions.json
export interface PinFunction {
  function: string;
  signal: string;
  io: string;
  description: string;
}

// TOC entry from toc_flat.json
export interface TOCEntry {
  id: string;
  title: string;
  page: number;
  level: number;
}

// Combined pin information
export interface PinInfo {
  bga289_pin: string;
  functions: {
    category: string;
    signal: string;
  }[];
  functionDetails?: PinFunction[];
}

export class PinDataLoader {
  private pins: PinMapping[] = [];
  private pinFunctions: Map<string, PinFunction[]> = new Map();
  private tocEntries: TOCEntry[] = [];
  private pinIndex: Map<string, PinMapping> = new Map();
  private functionToPinsIndex: Map<string, string[]> = new Map();
  private tocIndex: Map<string, TOCEntry> = new Map();
  private tocSearchIndex: Map<string, TOCEntry[]> = new Map();

  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  /**
   * Load all JSON data files and build indices
   */
  loadAll(): boolean {
    try {
      this.loadPins();
      this.loadPinFunctions();
      this.loadTOC();
      this.buildIndices();
      console.error(`Pin data loaded: ${this.pins.length} pins, ${this.pinFunctions.size} functions, ${this.tocEntries.length} TOC entries`);
      return true;
    } catch (error) {
      console.error('Error loading pin data:', error);
      return false;
    }
  }

  /**
   * Load pin mapping data from pins.json
   */
  private loadPins(): void {
    const path = resolve(this.dataDir, 'pins.json');
    const content = readFileSync(path, 'utf-8');
    this.pins = JSON.parse(content);
  }

  /**
   * Load pin function descriptions from pin_functions.json
   */
  private loadPinFunctions(): void {
    const path = resolve(this.dataDir, 'pin_functions.json');
    const content = readFileSync(path, 'utf-8');
    const functions: PinFunction[] = JSON.parse(content);

    // Group by signal name for quick lookup
    for (const func of functions) {
      const signal = func.signal.trim();
      if (!this.pinFunctions.has(signal)) {
        this.pinFunctions.set(signal, []);
      }
      this.pinFunctions.get(signal)!.push(func);
    }
  }

  /**
   * Load table of contents from toc_flat.json
   */
  private loadTOC(): void {
    const path = resolve(this.dataDir, 'toc_flat.json');
    const content = readFileSync(path, 'utf-8');
    const data = JSON.parse(content);
    this.tocEntries = data.entries || [];
  }

  /**
   * Build indices for fast lookups
   */
  private buildIndices(): void {
    // Pin index: bga289_pin -> PinMapping
    for (const pin of this.pins) {
      const pinName = pin.bga289_pin.trim();
      if (pinName) {
        this.pinIndex.set(pinName, pin);
      }
    }

    // Function to pins reverse index
    for (const pin of this.pins) {
      for (const [category, signal] of Object.entries(pin)) {
        if (category === 'bga289_pin') continue;
        const signals = this.parseSignals(signal);
        for (const sig of signals) {
          const sigName = sig.trim();
          if (sigName && !sigName.includes('/') && !sigName.includes(',')) {
            if (!this.functionToPinsIndex.has(sigName)) {
              this.functionToPinsIndex.set(sigName, []);
            }
            this.functionToPinsIndex.get(sigName)!.push(pin.bga289_pin);
          }
        }
      }
    }

    // TOC indices
    for (const entry of this.tocEntries) {
      // By ID
      if (entry.id) {
        this.tocIndex.set(entry.id, entry);
      }

      // Build search index for titles
      const words = entry.title.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length < 3) continue;
        if (!this.tocSearchIndex.has(word)) {
          this.tocSearchIndex.set(word, []);
        }
        this.tocSearchIndex.get(word)!.push(entry);
      }
    }
  }

  /**
   * Parse comma-separated or slash-separated signals
   */
  private parseSignals(signal: string): string[] {
    if (!signal) return [];
    // Handle both comma and slash separators
    const parts = signal.split(/[\/,]/);
    return parts.map(s => s.trim()).filter(s => s);
  }

  /**
   * Get pin information by BGA pin name
   */
  getPinInfo(pinName: string): PinInfo | null {
    const pin = this.pinIndex.get(pinName.trim().toUpperCase());
    if (!pin) return null;

    const functions: { category: string; signal: string }[] = [];
    for (const [category, signal] of Object.entries(pin)) {
      if (category === 'bga289_pin') continue;
      if (signal) {
        functions.push({ category, signal });
      }
    }

    // Get function descriptions for each signal
    const functionDetails: PinFunction[] = [];
    for (const fn of functions) {
      const signals = this.parseSignals(fn.signal);
      for (const sig of signals) {
        const details = this.pinFunctions.get(sig);
        if (details) {
          functionDetails.push(...details);
        }
      }
    }

    return {
      bga289_pin: pin.bga289_pin,
      functions,
      functionDetails: functionDetails.length > 0 ? functionDetails : undefined,
    };
  }

  /**
   * Find pins by function/signal name
   */
  findPinsByFunction(functionName: string): string[] {
    const name = functionName.trim().toUpperCase();
    const direct = this.functionToPinsIndex.get(name);
    if (direct) return direct;

    // Try partial match
    const results: string[] = [];
    const lowerName = name.toLowerCase();
    for (const [func, pins] of this.functionToPinsIndex.entries()) {
      if (func.toLowerCase().includes(lowerName) || lowerName.includes(func.toLowerCase())) {
        results.push(...pins);
      }
    }

    return [...new Set(results)];
  }

  /**
   * Get function description by signal name
   */
  getFunctionDescription(signal: string): PinFunction[] | null {
    const sig = signal.trim().toUpperCase();
    const direct = this.pinFunctions.get(sig);
    if (direct) return direct;

    // Try partial match
    const results: PinFunction[] = [];
    const lowerSig = sig.toLowerCase();
    for (const [key, funcs] of this.pinFunctions.entries()) {
      if (key.toLowerCase().includes(lowerSig) || lowerSig.includes(key.toLowerCase())) {
        results.push(...funcs);
      }
    }

    return results.length > 0 ? results : null;
  }

  /**
   * Search manual table of contents
   */
  searchTOC(query: string, maxResults: number = 10): TOCEntry[] {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    const scores = new Map<TOCEntry, number>();

    for (const word of words) {
      const entries = this.tocSearchIndex.get(word);
      if (entries) {
        for (const entry of entries) {
          scores.set(entry, (scores.get(entry) || 0) + 1);
        }
      }
    }

    // Sort by score and return top results
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxResults)
      .map(([entry]) => entry);
  }

  /**
   * Get TOC entry by ID
   */
  getTOCEntry(id: string): TOCEntry | null {
    return this.tocIndex.get(id) || null;
  }

  /**
   * Get TOC entries by page range
   */
  getTOCByPageRange(startPage: number, endPage: number): TOCEntry[] {
    return this.tocEntries.filter(e => e.page >= startPage && e.page <= endPage);
  }

  /**
   * List all available data
   */
  getStats() {
    return {
      totalPins: this.pins.length,
      totalFunctions: this.pinFunctions.size,
      totalTOCEntries: this.tocEntries.length,
      uniqueSignals: this.functionToPinsIndex.size,
    };
  }
}

// Singleton instance
let loaderInstance: PinDataLoader | null = null;

export function getPinDataLoader(dataDir?: string): PinDataLoader {
  if (!loaderInstance) {
    loaderInstance = new PinDataLoader(dataDir);
    loaderInstance.loadAll();
  }
  return loaderInstance;
}
