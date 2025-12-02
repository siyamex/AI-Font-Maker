import React from 'react';
import { ViewMode } from '../types';

interface ToolbarProps {
  onLoadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveFile: () => void;
  fileName: string | null;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onLoadFile, onSaveFile, fileName, viewMode, setViewMode }) => {
  return (
    <div className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          NeuroFont
        </h1>
        
        <div className="h-6 w-px bg-neutral-700 mx-2" />
        
        <label className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-2 rounded-md text-sm transition-colors border border-neutral-700 font-medium">
          Open Font
          <input type="file" className="hidden" accept=".ttf,.otf,.woff,.woff2" onChange={onLoadFile} />
        </label>
        
        {fileName && (
          <span className="text-neutral-400 text-sm font-mono flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            {fileName}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {fileName && (
          <>
            <div className="flex bg-neutral-800 rounded-md p-1 border border-neutral-700">
              <button
                onClick={() => setViewMode(ViewMode.GRID)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === ViewMode.GRID 
                    ? 'bg-neutral-600 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode(ViewMode.EDITOR)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === ViewMode.EDITOR 
                    ? 'bg-neutral-600 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode(ViewMode.MODIFIERS)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === ViewMode.MODIFIERS 
                    ? 'bg-neutral-600 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Batch
              </button>
              <button
                onClick={() => setViewMode(ViewMode.METADATA)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  viewMode === ViewMode.METADATA 
                    ? 'bg-neutral-600 text-white shadow-sm' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Metadata
              </button>
            </div>
            
            <button
              onClick={onSaveFile}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
            >
              Export Font
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
