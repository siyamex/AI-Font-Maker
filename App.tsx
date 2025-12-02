import React, { useState } from 'react';
import { IFont, ViewMode } from './types';
import { loadFontFromFile, downloadFont } from './services/fontService';
import Toolbar from './components/Toolbar';
import GlyphGrid from './components/GlyphGrid';
import GlyphEditor from './components/GlyphEditor';
import MetadataEditor from './components/MetadataEditor';
import GlobalModifiers from './components/GlobalModifiers';

const App: React.FC = () => {
  const [font, setFont] = useState<IFont | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [selectedGlyphIndex, setSelectedGlyphIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const loadedFont = await loadFontFromFile(file);
      setFont(loadedFont);
      setFileName(file.name);
      setViewMode(ViewMode.GRID);
    } catch (err: any) {
      console.error("Font Loading Error:", err);
      let msg = "Failed to load font file.";
      
      if (err.message && err.message.includes("ClassDef format")) {
        msg = "Error: This font contains unsupported OpenType table data (Complex GPOS/GSUB tables). Parsing aborted.";
      } else if (err.message && err.message.includes("not a valid font")) {
        msg = "Error: The file does not appear to be a valid or supported font format.";
      } else {
        msg = `Error parsing font: ${err.message || "Unknown error"}`;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (font && fileName) {
      // Logic to download
      const newName = "Modified-" + fileName;
      downloadFont(font, newName);
    }
  };

  const handleSelectGlyph = (index: number) => {
    setSelectedGlyphIndex(index);
    setViewMode(ViewMode.EDITOR);
  };

  const handleCloseEditor = () => {
    setSelectedGlyphIndex(null);
    setViewMode(ViewMode.GRID);
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-200">
      <Toolbar 
        onLoadFile={handleFileChange} 
        onSaveFile={handleSave} 
        fileName={fileName}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-500">Parsing Font Data...</p>
          </div>
        </div>
      )}

      {!loading && !font && !error && (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-neutral-800 m-8 rounded-xl bg-neutral-900/50">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-3xl font-bold text-neutral-700 mb-4">NeuroFont</h2>
            <p className="text-neutral-500 mb-8">
              Drag and drop a font file or click "Open Font" to begin.
              <br />
              Supports TTF, OTF, WOFF.
            </p>
            <div className="flex justify-center gap-4 text-xs text-neutral-600 font-mono">
               <span>• Pythonic Architecture</span>
               <span>• React Implementation</span>
               <span>• Gemini AI</span>
            </div>
          </div>
        </div>
      )}
      
      {error && (
         <div className="flex-1 flex items-center justify-center">
            <div className="p-8 bg-red-900/20 border border-red-900/50 rounded-lg max-w-lg text-center">
              <h3 className="text-red-400 font-bold mb-2">Load Failed</h3>
              <p className="text-neutral-300 mb-4">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors"
              >
                Dismiss
              </button>
            </div>
         </div>
      )}

      {!loading && font && viewMode === ViewMode.GRID && (
        <GlyphGrid font={font} onSelectGlyph={handleSelectGlyph} />
      )}

      {!loading && font && viewMode === ViewMode.EDITOR && selectedGlyphIndex !== null && (
        <GlyphEditor 
          font={font} 
          glyphIndex={selectedGlyphIndex} 
          onClose={handleCloseEditor} 
        />
      )}

      {!loading && font && viewMode === ViewMode.MODIFIERS && (
        <GlobalModifiers 
          font={font} 
          onClose={() => setViewMode(ViewMode.GRID)} 
        />
      )}

      {!loading && font && viewMode === ViewMode.METADATA && (
        <MetadataEditor 
          font={font} 
          onClose={() => setViewMode(ViewMode.GRID)} 
        />
      )}
    </div>
  );
};

export default App;
