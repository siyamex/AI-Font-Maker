import React, { useMemo } from 'react';
import { IFont } from '../types';

interface GlyphGridProps {
  font: IFont;
  onSelectGlyph: (index: number) => void;
}

const GlyphGrid: React.FC<GlyphGridProps> = ({ font, onSelectGlyph }) => {
  // Memoize the glyph list to prevent expensive re-rendering of thousands of glyphs
  const glyphs = useMemo(() => {
    if (!font) return [];
    const list = [];
    // Limit for performance in this demo
    const count = Math.min(font.glyphs.length, 500); 
    for (let i = 0; i < count; i++) {
      list.push(font.glyphs.get(i));
    }
    return list;
  }, [font]);

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-900 p-6">
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
        {glyphs.map((glyph, i) => {
          // Skip empty glyphs for cleaner view
          if (!glyph.path || glyph.path.commands.length === 0) return null;
          
          const d = glyph.path.toPathData(2);
          // Scale down to fit unit box
          const scale = 32 / font.unitsPerEm;
          const transform = `scale(${scale}, -${scale}) translate(0, -${font.unitsPerEm})`;
          
          return (
            <button
              key={i}
              onClick={() => onSelectGlyph(i)}
              className="aspect-square bg-neutral-800 rounded-lg border border-neutral-700 hover:border-blue-500 hover:bg-neutral-750 transition-all flex flex-col items-center justify-center relative group"
            >
              <svg viewBox="0 0 32 32" className="w-12 h-12 fill-neutral-200">
                <g transform={transform}>
                   <path d={d} />
                </g>
              </svg>
              <span className="absolute bottom-1 right-2 text-[10px] text-neutral-500 group-hover:text-neutral-300 font-mono">
                {glyph.unicode ? String.fromCharCode(glyph.unicode) : '#'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GlyphGrid;
