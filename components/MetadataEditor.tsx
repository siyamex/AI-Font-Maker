import React, { useState, useEffect } from 'react';
import { IFont, FontMetadata } from '../types';
import { getFontMetadata, updateFontMetadata } from '../services/fontService';

interface MetadataEditorProps {
  font: IFont;
  onClose: () => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ font, onClose }) => {
  const [formData, setFormData] = useState<FontMetadata>({
    fontFamily: '',
    fontSubfamily: '',
    fullName: '',
    version: '',
    copyright: '',
    manufacturer: '',
    designer: '',
    description: '',
    license: ''
  });

  useEffect(() => {
    if (font) {
      setFormData(getFontMetadata(font));
    }
  }, [font]);

  const handleChange = (key: keyof FontMetadata, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateFontMetadata(font, formData);
    onClose();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-900 p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-neutral-800 rounded-xl border border-neutral-700 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-neutral-700 pb-4">
          <h2 className="text-2xl font-bold text-white">Font Metadata</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl font-bold">✕</button>
        </div>

        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <Field label="Font Family" value={formData.fontFamily} onChange={(v: string) => handleChange('fontFamily', v)} />
              <Field label="Subfamily" value={formData.fontSubfamily} onChange={(v: string) => handleChange('fontSubfamily', v)} />
           </div>
           
           <Field label="Full Name" value={formData.fullName} onChange={(v: string) => handleChange('fullName', v)} />
           <Field label="Version" value={formData.version} onChange={(v: string) => handleChange('version', v)} />
           
           <div className="border-t border-neutral-700 pt-6 mt-6">
             <h3 className="text-sm font-semibold text-cyan-500 uppercase tracking-wider mb-4">Legal & Attribution</h3>
             <div className="grid grid-cols-2 gap-6 mb-4">
                <Field label="Designer" value={formData.designer} onChange={(v: string) => handleChange('designer', v)} />
                <Field label="Manufacturer" value={formData.manufacturer} onChange={(v: string) => handleChange('manufacturer', v)} />
             </div>
             <Field label="Copyright" value={formData.copyright} textarea onChange={(v: string) => handleChange('copyright', v)} />
             <Field label="License" value={formData.license} textarea onChange={(v: string) => handleChange('license', v)} />
           </div>
           
           <Field label="Description" value={formData.description} textarea onChange={(v: string) => handleChange('description', v)} />
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-neutral-700">
           <button onClick={onClose} className="px-4 py-2 text-neutral-400 hover:text-white transition-colors">Cancel</button>
           <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium shadow-lg shadow-blue-900/20 transition-all transform active:scale-95">Save Metadata</button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, textarea }: { label: string, value: string, onChange: (val: string) => void, textarea?: boolean }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-xs font-mono text-neutral-500 uppercase">{label}</label>
    {textarea ? (
      <textarea 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="bg-neutral-900 border border-neutral-700 rounded p-2 text-neutral-200 text-sm focus:border-cyan-500 outline-none transition-colors h-24 resize-y"
      />
    ) : (
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="bg-neutral-900 border border-neutral-700 rounded p-2 text-neutral-200 text-sm focus:border-cyan-500 outline-none transition-colors"
      />
    )}
  </div>
);

export default MetadataEditor;