import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { IFont, PathCommand, Point } from '../types';
import { parsePathCommands, commandsToSvgPath, extractControlPoints, applyJitter, applyExpansion } from '../utils/pathUtils';
import { updateGlyphPath } from '../services/fontService';
import { generateGlyphPath, critiqueGlyph } from '../services/geminiService';

// Lazy load 3D viewer to avoid import errors if dependencies fail lightly
const Glyph3DViewer = React.lazy(() => import('./Glyph3DViewer'));

declare const opentype: any; // Global from CDN

interface GlyphEditorProps {
  font: IFont;
  glyphIndex: number;
  onClose: () => void;
}

const GlyphEditor: React.FC<GlyphEditorProps> = ({ font, glyphIndex, onClose }) => {
  const [commands, setCommands] = useState<PathCommand[]>([]);
  const [zoom, setZoom] = useState(0.5); // Default zoom level
  const [pan, setPan] = useState({ x: 100, y: 300 }); // Default offset
  const [selectedPoint, setSelectedPoint] = useState<{ cmdIndex: number, key: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // View State
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const [depth3D, setDepth3D] = useState(50);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiCritique, setAiCritique] = useState<string>('');

  // 1. Initialize commands from glyph
  useEffect(() => {
    const glyph = font.glyphs.get(glyphIndex);
    if (glyph && glyph.path) {
      setCommands(parsePathCommands(glyph.path));
    }
  }, [font, glyphIndex]);

  // 2. Generate SVG Path string for display
  const d = commandsToSvgPath(commands);

  // 3. Extract points for UI handles
  const controlPoints = extractControlPoints(commands);

  // Get glyph metadata safely
  const glyph = font.glyphs.get(glyphIndex);
  const unicodeHex = glyph && glyph.unicode !== undefined ? glyph.unicode.toString(16).toUpperCase() : '----';

  // Helpers for coordinate conversion
  // Font coordinates (y-up) to SVG coordinates (y-down) logic handled by group transform
  
  const handleMouseDown = (e: React.MouseEvent, cmdIndex: number, key: string) => {
    e.stopPropagation();
    setSelectedPoint({ cmdIndex, key });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedPoint || !svgRef.current) return;

    // Convert mouse delta to SVG coordinate space
    const movementX = e.movementX / zoom;
    const movementY = e.movementY / -zoom; // Invert Y because font coordinates are Y-up

    setCommands(prev => {
      const next = [...prev];
      const cmd = { ...next[selectedPoint.cmdIndex] };
      
      // Update specific coordinate
      if (selectedPoint.key === 'main') {
        if (cmd.x !== undefined) cmd.x += movementX;
        if (cmd.y !== undefined) cmd.y += movementY;
      } else if (selectedPoint.key === 'c1') {
        if (cmd.x1 !== undefined) cmd.x1 += movementX;
        if (cmd.y1 !== undefined) cmd.y1 += movementY;
      } else if (selectedPoint.key === 'c2') {
        if (cmd.x2 !== undefined) cmd.x2 += movementX;
        if (cmd.y2 !== undefined) cmd.y2 += movementY;
      }
      
      next[selectedPoint.cmdIndex] = cmd;
      return next;
    });
  }, [isDragging, selectedPoint, zoom]);

  const handleMouseUp = () => {
    setIsDragging(false);
    // Auto-save changes to font object in memory
    updateGlyphPath(font, glyphIndex, commands);
  };

  // --- Modifiers ---
  const handleJitter = () => {
    setCommands(prev => applyJitter(prev, 15)); // 15 units jitter
  };

  const handleBold = () => {
    setCommands(prev => applyExpansion(prev, 1.1, font.unitsPerEm, font.unitsPerEm));
  };

  const handleReset = () => {
    const glyph = font.glyphs.get(glyphIndex);
    if (glyph && glyph.path) {
      setCommands(parsePathCommands(glyph.path));
    }
  };

  // --- AI Features ---
  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const glyph = font.glyphs.get(glyphIndex);
    const char = glyph.unicode ? String.fromCharCode(glyph.unicode) : '?';
    
    try {
      const svgPath = await generateGlyphPath(aiPrompt, char);
      // Logic to parse SVG path string back to commands would go here
      // For now, we simulate success
      console.log("AI Generated Path:", svgPath);
      alert("AI Path Generated (See Console). Parsing implementation pending.");
    } catch (e) {
      alert("AI Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCritique = async () => {
    setIsGenerating(true);
    try {
      const c = await critiqueGlyph(d);
      setAiCritique(c);
    } catch (e) {
      setAiCritique("Failed to critique.");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="flex h-full bg-neutral-900 text-white overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-80 border-r border-neutral-800 bg-neutral-850 p-6 flex flex-col space-y-8 overflow-y-auto z-10">
        
        <div>
          <button onClick={onClose} className="mb-4 text-neutral-400 hover:text-white flex items-center text-sm">
            ← Back to Grid
          </button>
          <h2 className="text-2xl font-bold mb-1">Glyph Editor</h2>
          <p className="text-neutral-500 font-mono text-xs mb-4">
            U+{unicodeHex} • Index {glyphIndex}
          </p>

          <div className="bg-neutral-800 rounded-lg p-1 flex mb-6">
             <button 
               onClick={() => setViewMode('2D')}
               className={`flex-1 py-1 text-sm font-medium rounded transition-colors ${viewMode === '2D' ? 'bg-neutral-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
             >
               2D Edit
             </button>
             <button 
               onClick={() => setViewMode('3D')}
               className={`flex-1 py-1 text-sm font-medium rounded transition-colors ${viewMode === '3D' ? 'bg-neutral-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
             >
               3D Preview
             </button>
          </div>
        </div>

        {viewMode === '3D' && (
           <div className="space-y-4 border-b border-neutral-800 pb-6">
              <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">3D Settings</h3>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Extrusion Depth</label>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  value={depth3D} 
                  onChange={(e) => setDepth3D(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                  <span>Thin</span>
                  <span>{depth3D}</span>
                  <span>Thick</span>
                </div>
              </div>
           </div>
        )}

        {/* Modifiers */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Smart Modifiers</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleBold}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors border border-neutral-700"
            >
              Auto-Bold
            </button>
            <button 
              onClick={handleJitter}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm transition-colors border border-neutral-700"
            >
              Jitter Style
            </button>
            <button 
              onClick={handleReset}
              className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded text-sm transition-colors border border-red-900/50 col-span-2"
            >
              Reset Glyph
            </button>
          </div>
        </div>

        {/* AI Tools */}
        <div className="space-y-3 border-t border-neutral-800 pt-6">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            Gemini AI 
            <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1 rounded">3.0 Pro</span>
          </h3>
          
          <div className="space-y-2">
            <label className="text-xs text-neutral-500">Generative Edit (Prompt)</label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. 'A scary, jagged shape'"
              className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm focus:border-purple-500 outline-none resize-none h-20"
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !aiPrompt}
              className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                isGenerating ? 'bg-purple-900 text-purple-300' : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {isGenerating ? 'Thinking...' : 'Generate Shape'}
            </button>
          </div>

           <div className="space-y-2 pt-2">
            <button 
              onClick={handleCritique}
              disabled={isGenerating}
              className="w-full py-2 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 rounded text-sm transition-colors"
            >
              Critique Shape
            </button>
            {aiCritique && (
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-xs leading-relaxed text-neutral-300 italic">
                "{aiCritique}"
              </div>
            )}
           </div>
        </div>

      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:20px_20px]">
        
        {viewMode === '2D' ? (
          <>
            {/* Canvas Toolbar */}
            <div className="absolute top-4 left-4 bg-neutral-800 rounded-md p-1 shadow-xl border border-neutral-700 flex space-x-2 z-10">
              <button onClick={() => setZoom(z => z * 1.2)} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-700 rounded">+</button>
              <span className="w-12 flex items-center justify-center text-xs font-mono">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => z / 1.2)} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-700 rounded">-</button>
            </div>

            <svg 
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={(e) => {
                 setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
              }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom}, -${zoom})`}>
                 {/* Baseline */}
                 <line x1="-1000" y1="0" x2="2000" y2="0" stroke="#404040" strokeWidth={1/zoom} />
                 {/* Ascent */}
                 <line x1="-1000" y1={font.unitsPerEm * 0.8} x2="2000" y2={font.unitsPerEm * 0.8} stroke="#303030" strokeWidth={1/zoom} strokeDasharray="4 4" />

                 {/* Glyph Path */}
                 <path d={d} fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth={2/zoom} />

                 {/* Control Points */}
                 {controlPoints.map((p, i) => (
                    <React.Fragment key={`${i}-${p.key}`}>
                      {/* Connectors for handles */}
                      {p.type === 'off' && (
                         <line 
                            x1={p.x} 
                            y1={p.y} 
                            x2={commands[p.cmdIndex].x} 
                            y2={commands[p.cmdIndex].y} 
                            stroke="#606060" 
                            strokeWidth={1/zoom} 
                         />
                      )}
                      {/* The Point */}
                      {p.type === 'on' ? (
                         <rect 
                            x={p.x - 4/zoom} 
                            y={p.y - 4/zoom} 
                            width={8/zoom} 
                            height={8/zoom} 
                            fill={selectedPoint?.cmdIndex === p.cmdIndex && selectedPoint?.key === p.key ? '#ef4444' : '#ffffff'}
                            stroke="#000"
                            strokeWidth={1/zoom}
                            onMouseDown={(e) => handleMouseDown(e, p.cmdIndex, p.key)}
                            className="cursor-pointer hover:fill-red-400"
                         />
                      ) : (
                         <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r={3/zoom} 
                            fill="#fbbf24"
                            stroke="#000"
                            strokeWidth={1/zoom}
                            onMouseDown={(e) => handleMouseDown(e, p.cmdIndex, p.key)}
                            className="cursor-pointer hover:fill-yellow-200"
                         />
                      )}
                    </React.Fragment>
                 ))}
              </g>
            </svg>
            <div className="absolute bottom-4 right-4 text-neutral-500 text-xs font-mono select-none pointer-events-none">
              Use Mouse Wheel to Pan • Drag Points to Edit
            </div>
          </>
        ) : (
          <Suspense fallback={<div className="flex items-center justify-center h-full text-neutral-500">Loading 3D Engine...</div>}>
            <div className="w-full h-full bg-neutral-900">
               <Glyph3DViewer commands={commands} depth={depth3D} color="#3b82f6" />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default GlyphEditor;