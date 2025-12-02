// Type definitions for opentype.js usage in TS
// Note: In a real project, we would use @types/opentype.js

export interface Point {
  x: number;
  y: number;
  onCurve: boolean; // true = on-curve (square), false = off-curve control point (circle)
  lastPointOfContour?: boolean;
}

export interface PathCommand {
  type: 'M' | 'L' | 'Q' | 'C' | 'Z';
  x?: number;
  y?: number;
  x1?: number; // Control point 1
  y1?: number;
  x2?: number; // Control point 2
  y2?: number;
}

export interface IGlyph {
  name: string;
  unicode: number;
  index: number;
  advanceWidth: number;
  path: any; // opentype.Path
  getPath: (x: number, y: number, fontSize: number) => any;
  draw: (ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) => void;
}

export interface IFont {
  names: any; // Relaxed type to allow access to all metadata fields (designer, license, etc.)
  unitsPerEm: number;
  glyphs: {
    length: number;
    get: (index: number) => IGlyph;
    items: IGlyph[]; // Internal access if needed
  };
  download: () => void;
  outlinesToSVG: (glyph: IGlyph) => string;
}

export interface GlyphMetadata {
  index: number;
  name: string;
  unicode: number;
  svgPathData: string;
}

export interface FontMetadata {
  fontFamily: string;
  fontSubfamily: string;
  fullName: string;
  version: string;
  copyright: string;
  manufacturer: string;
  designer: string;
  description: string;
  license: string;
}

export enum ToolType {
  SELECT = 'SELECT',
  PEN = 'PEN',
}

export enum ViewMode {
  GRID = 'GRID',
  EDITOR = 'EDITOR',
  METADATA = 'METADATA',
  MODIFIERS = 'MODIFIERS',
}
