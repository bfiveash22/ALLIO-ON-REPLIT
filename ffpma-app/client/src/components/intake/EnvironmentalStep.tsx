import React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export interface EnvironmentalData {
  moldExposure: string;
  heavyMetals: string;
  pesticides: string;
  waterQuality: string;
  airQuality: string;
  workHazards: string;
  notes: string;
}

export function EnvironmentalStep({ data, onChange }: { data: EnvironmentalData, onChange: (d: EnvironmentalData) => void }) {
  
  const handleRadio = (field: keyof EnvironmentalData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleText = (field: keyof EnvironmentalData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const RadioGroup = ({ label, field }: { label: string, field: keyof EnvironmentalData }) => (
    <div className="space-y-3 p-4 border rounded-lg bg-card bg-white/50 dark:bg-black/20">
      <label className="font-medium text-sm block">{label}</label>
      <div className="flex gap-6">
        {["Yes", "No", "Unsure"].map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name={field}
              value={opt}
              checked={data[field] === opt}
              onChange={() => handleRadio(field, opt)}
              className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-600"
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">Environmental Exposures</h2>
        <p className="text-sm text-muted-foreground">Toxins in your environment can profoundly affect your biology. Please indicate if you have experienced any of the following exposures.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RadioGroup label="1. Known or suspected mold exposure at home or work?" field="moldExposure" />
        <RadioGroup label="2. Heavy metal exposure (lead, mercury amalgams, etc.)?" field="heavyMetals" />
        <RadioGroup label="3. Significant pesticide/herbicide exposure (e.g. glyphosate)?" field="pesticides" />
        <RadioGroup label="4. Occupational hazards/Chemical exposures?" field="workHazards" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Drinking Water Quality</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={data.waterQuality || ""}
            onChange={(e) => handleText('waterQuality', e.target.value)}
          >
            <option value="">Select source...</option>
            <option value="Tap water (unfiltered)">Tap water (unfiltered)</option>
            <option value="Filtered tap (fridge/pitcher)">Filtered tap (fridge/pitcher)</option>
            <option value="Reverse Osmosis">Reverse Osmosis</option>
            <option value="Bottled/Spring">Bottled/Spring</option>
            <option value="Well water">Well water</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Indoor Air Quality Concerns?</label>
          <Input 
            placeholder="e.g. poor ventilation, dust, pets, near highway..." 
            value={data.airQuality || ""}
            onChange={(e) => handleText('airQuality', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Context / Details</label>
        <Textarea 
          placeholder="Please describe any 'Yes' answers above or mention any other significant environmental factors..."
          value={data.notes || ""}
          onChange={(e) => handleText('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
