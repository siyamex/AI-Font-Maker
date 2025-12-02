import React, { useState } from 'react';
import { IFont, PathCommand } from '../types';
import { transformAllGlyphs } from '../services/fontService';
import { 
  applyJitter, 
  applyExpansion, 
  applySlant, 
  applyPixelate, 
  applyFlatten,
  applyAxisScale,
  applyPunk
} from '../utils/pathUtils';

interface GlobalModifiersProps {
  font: IFont;
  onClose: () => void;
}

const GlobalModifiers: React.FC<GlobalModifiersProps> = ({ font, onClose }) => {
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const runBatch = (name: string, fn: (cmds: PathCommand[]) => PathCommand[]) => {
    setProcessing(true);
    setFeedback(`Applying ${name}...`);
    
    // Use setTimeout to allow UI to render the "processing" state before locking thread
    setTimeout(() => {
        try {
            transformAllGlyphs(font, fn);
            setFeedback(`Successfully applied ${name} to all glyphs.`);
        } catch (e) {
            console.error(e);
            setFeedback(`Error applying ${name}.`);
        } finally {
            setProcessing(false);
        }
    }, 100);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-900 p-8 flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8 border-b border-neutral-700 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Global Smart Modifiers</h2>
            <p className="text-neutral-400">Apply algorithmic transformations to the entire font family at once.</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-2xl font-bold">✕</button>
        </div>

        {processing && (
             <div className="bg-blue-900/20 border border-blue-800 text-blue-200 p-4 rounded-lg mb-6 flex items-center animate-pulse">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
                Processing {font.glyphs.length} glyphs...
             </div>
        )}

        {feedback && !processing && (
             <div className="bg-green-900/20 border border-green-800 text-green-200 p-4 rounded-lg mb-6">
                {feedback}
             </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* ROW 1: Weight & Width */}

            {/* BOLD CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-blue-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-blue-400 font-bold">Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Auto-Bold</h3>
                    <p className="text-sm text-neutral-400 mb-4">Expands glyphs from their center. Useful for creating weight variants.</p>
                    <button 
                        onClick={() => runBatch('Bold', (cmds) => applyExpansion(cmds, 1.15, 0, 0))}
                        disabled={processing}
                        className="w-full py-2 bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-800 rounded font-medium transition-colors"
                    >
                        Apply Bold
                    </button>
                </div>
            </div>

            {/* THIN CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-indigo-400 font-light" style={{ fontWeight: 100 }}>Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Thin (Light)</h3>
                    <p className="text-sm text-neutral-400 mb-4">Contracts glyphs towards their center to create a lightweight feel.</p>
                    <button 
                        onClick={() => runBatch('Thin', (cmds) => applyAxisScale(cmds, 0.9, 0.9))}
                        disabled={processing}
                        className="w-full py-2 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 border border-indigo-800 rounded font-medium transition-colors"
                    >
                        Apply Thin
                    </button>
                </div>
            </div>

            {/* WIDE CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-teal-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-teal-400 font-bold" style={{ transform: 'scaleX(1.5)' }}>Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Wide (Stretch)</h3>
                    <p className="text-sm text-neutral-400 mb-4">Stretches the font horizontally by 30% for a dramatic display look.</p>
                    <button 
                        onClick={() => runBatch('Wide', (cmds) => applyAxisScale(cmds, 1.3, 1))}
                        disabled={processing}
                        className="w-full py-2 bg-teal-900/50 hover:bg-teal-800 text-teal-200 border border-teal-800 rounded font-medium transition-colors"
                    >
                        Apply Wide
                    </button>
                </div>
            </div>

            {/* ROW 2: Style & Geometry */}

            {/* CONDENSED CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-pink-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-pink-400 font-bold" style={{ transform: 'scaleX(0.7)' }}>Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Condensed</h3>
                    <p className="text-sm text-neutral-400 mb-4">Compresses the font horizontally by 25% for a narrow profile.</p>
                    <button 
                        onClick={() => runBatch('Condensed', (cmds) => applyAxisScale(cmds, 0.75, 1))}
                        disabled={processing}
                        className="w-full py-2 bg-pink-900/50 hover:bg-pink-800 text-pink-200 border border-pink-800 rounded font-medium transition-colors"
                    >
                        Apply Condensed
                    </button>
                </div>
            </div>

            {/* ITALIC CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-cyan-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-cyan-400 italic">Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Slant (Italic)</h3>
                    <p className="text-sm text-neutral-400 mb-4">Shears the font by 15 degrees to simulate an italic style.</p>
                    <button 
                         onClick={() => runBatch('Slant', (cmds) => applySlant(cmds, 15))}
                         disabled={processing}
                        className="w-full py-2 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-200 border border-cyan-800 rounded font-medium transition-colors"
                    >
                        Apply Slant
                    </button>
                </div>
            </div>

            {/* FLATTEN CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-orange-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-orange-400 font-sans" style={{ fontFamily: 'monospace'}}>Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Angular Flatten</h3>
                    <p className="text-sm text-neutral-400 mb-4">Converts all Bezier curves into straight lines for a low-poly aesthetic.</p>
                    <button 
                         onClick={() => runBatch('Flatten', (cmds) => applyFlatten(cmds))}
                         disabled={processing}
                        className="w-full py-2 bg-orange-900/50 hover:bg-orange-800 text-orange-200 border border-orange-800 rounded font-medium transition-colors"
                    >
                        Apply Flatten
                    </button>
                </div>
            </div>

            {/* ROW 3: Creative & Chaos */}

            {/* PIXELATE CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-green-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-green-400 font-mono">Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Retro Pixelate</h3>
                    <p className="text-sm text-neutral-400 mb-4">Snaps all vector points to a coarse 50-unit grid for a blocky look.</p>
                    <button 
                         onClick={() => runBatch('Pixelate', (cmds) => applyPixelate(cmds, 50))}
                         disabled={processing}
                        className="w-full py-2 bg-green-900/50 hover:bg-green-800 text-green-200 border border-green-800 rounded font-medium transition-colors"
                    >
                        Apply Pixelate
                    </button>
                </div>
            </div>

            {/* JITTER CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-purple-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-purple-400 font-serif italic" style={{ filter: 'url(#jitter)' }}>Aa</span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Handwritten Jitter</h3>
                    <p className="text-sm text-neutral-400 mb-4">Randomizes point placement to create a rough, hand-drawn aesthetic.</p>
                    <button 
                        onClick={() => runBatch('Jitter', (cmds) => applyJitter(cmds, 20))}
                        disabled={processing}
                        className="w-full py-2 bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-800 rounded font-medium transition-colors"
                    >
                        Apply Jitter
                    </button>
                </div>
            </div>

            {/* PUNK CARD */}
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden hover:border-yellow-500 transition-colors group">
                <div className="h-32 bg-neutral-950 flex items-center justify-center border-b border-neutral-700">
                    <span className="text-5xl text-neutral-500 group-hover:text-yellow-400 font-bold relative">
                        Aa
                        <span className="absolute top-0 left-0 w-full h-full animate-pulse opacity-50 blur-[2px] text-red-500">Aa</span>
                    </span>
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Cyber Punk</h3>
                    <p className="text-sm text-neutral-400 mb-4">Chaotically shifts Bezier handles while keeping anchors fixed. Spiky & wild.</p>
                    <button 
                        onClick={() => runBatch('Punk', (cmds) => applyPunk(cmds, 80))}
                        disabled={processing}
                        className="w-full py-2 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 border border-yellow-800 rounded font-medium transition-colors"
                    >
                        Apply Punk
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default GlobalModifiers;