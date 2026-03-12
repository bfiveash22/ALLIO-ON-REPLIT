import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface LifestyleData {
  dietType: string;
  sleepHours: string;
  exerciseFrequency: string;
  alcoholConsumption: string;
  tobaccoUse: string;
  supplements: string;
  notes: string;
}

export function LifestyleStep({ data, onChange }: { data: LifestyleData, onChange: (d: LifestyleData) => void }) {
  
  const handleSelect = (field: keyof LifestyleData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleText = (field: keyof LifestyleData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">Lifestyle, Diet & Habits</h2>
        <p className="text-sm text-muted-foreground">Provide details about your daily routines, nutrition, and lifestyle habits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border rounded-lg bg-card bg-white/50 dark:bg-black/20">
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Diet Type</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={data.dietType || ""}
            onChange={(e) => handleSelect('dietType', e.target.value)}
          >
            <option value="">Select diet...</option>
            <option value="Standard American">Standard American</option>
            <option value="Vegetarian/Vegan">Vegetarian/Vegan</option>
            <option value="Paleo/Keto">Paleo/Keto</option>
            <option value="Carnivore">Carnivore</option>
            <option value="Mediterranean">Mediterranean</option>
            <option value="Other">Other (Please specify in notes)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Hours of Sleep per Night</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={data.sleepHours || ""}
            onChange={(e) => handleSelect('sleepHours', e.target.value)}
          >
            <option value="">Select sleep hours...</option>
            <option value="< 5 hours">Less than 5 hours</option>
            <option value="5-6 hours">5-6 hours</option>
            <option value="7-8 hours">7-8 hours</option>
            <option value="> 8 hours">More than 8 hours</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Exercise Frequency</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={data.exerciseFrequency || ""}
            onChange={(e) => handleSelect('exerciseFrequency', e.target.value)}
          >
            <option value="">Select frequency...</option>
            <option value="None/Sedentary">None/Sedentary</option>
            <option value="1-2 times/week">1-2 times/week</option>
            <option value="3-5 times/week">3-5 times/week</option>
            <option value="Daily">Daily</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Alcohol or Tobacco/Drug Use</label>
          <Input 
            placeholder="Frequency of use..." 
            value={data.alcoholConsumption || ""}
            onChange={(e) => handleText('alcoholConsumption', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Current Supplements & Medications</label>
        <Textarea 
          placeholder="List any vitamins, minerals, herbs, or pharmaceutical medications you take regularly..."
          value={data.supplements || ""}
          onChange={(e) => handleText('supplements', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Notes</label>
        <Textarea 
          placeholder="Any other lifestyle factors you feel are relevant?"
          value={data.notes || ""}
          onChange={(e) => handleText('notes', e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
