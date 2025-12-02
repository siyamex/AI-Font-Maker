import { IFont, IGlyph, FontMetadata, PathCommand } from '../types';
import { parsePathCommands } from '../utils/pathUtils';

declare const opentype: any;

export const loadFontFromFile = async (file: File): Promise<IFont> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        // opentype.parse throws if it encounters fatal errors like the ClassDef issue
        const font = opentype.parse(buffer);
        if (!font) {
            reject(new Error("Parsed font object was null"));
            return;
        }
        resolve(font);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

export const createGlyphPathData = (glyph: IGlyph): string => {
  if (!glyph) return '';
  const path = glyph.getPath(0, 0, 72); // Get path for visualization
  return path.toPathData(2);
};

export const updateGlyphPath = (font: IFont, glyphIndex: number, commands: any[]) => {
  const glyph = font.glyphs.get(glyphIndex);
  if (!glyph) return;

  // Reconstruct opentype.path
  const newPath = new opentype.Path();
  commands.forEach(cmd => {
    if (cmd.type === 'M') newPath.moveTo(cmd.x, cmd.y);
    else if (cmd.type === 'L') newPath.lineTo(cmd.x, cmd.y);
    else if (cmd.type === 'Q') newPath.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    else if (cmd.type === 'C') newPath.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    else if (cmd.type === 'Z') newPath.close();
  });

  glyph.path = newPath;
};

export const transformAllGlyphs = (font: IFont, transformFn: (cmds: PathCommand[]) => PathCommand[]) => {
    const length = font.glyphs.length;
    for (let i = 0; i < length; i++) {
        const glyph = font.glyphs.get(i);
        // Only transform glyphs that actually have paths
        if (glyph.path && glyph.path.commands && glyph.path.commands.length > 0) {
            const currentCmds = parsePathCommands(glyph.path);
            const newCmds = transformFn(currentCmds);
            updateGlyphPath(font, i, newCmds);
        }
    }
};

export const downloadFont = (font: IFont, fileName: string) => {
  font.download();
};

export const getFontMetadata = (font: IFont): FontMetadata => {
  const getVal = (key: string): string => {
    const entry = font.names?.[key];
    if (!entry) return '';
    // Return English or first available locale
    return entry.en || Object.values(entry)[0] || '';
  };

  return {
    fontFamily: getVal('fontFamily'),
    fontSubfamily: getVal('fontSubfamily'),
    fullName: getVal('fullName'),
    version: getVal('version'),
    copyright: getVal('copyright'),
    manufacturer: getVal('manufacturer'),
    designer: getVal('designer'),
    description: getVal('description'),
    license: getVal('license'),
  };
};

export const updateFontMetadata = (font: IFont, metadata: FontMetadata) => {
  const setVal = (key: string, value: string) => {
    if (!font.names[key]) font.names[key] = {};
    // Default to 'en' for simplicity in this web editor
    font.names[key].en = value;
  };

  setVal('fontFamily', metadata.fontFamily);
  setVal('fontSubfamily', metadata.fontSubfamily);
  setVal('fullName', metadata.fullName);
  setVal('version', metadata.version);
  setVal('copyright', metadata.copyright);
  setVal('manufacturer', metadata.manufacturer);
  setVal('designer', metadata.designer);
  setVal('description', metadata.description);
  setVal('license', metadata.license);
};
