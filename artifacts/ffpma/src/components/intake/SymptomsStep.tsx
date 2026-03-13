import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export interface SymptomsData {
  fatigue: boolean;
  brainFog: boolean;
  jointPain: boolean;
  digestiveIssues: boolean;
  sleepProblems: boolean;
  headaches: boolean;
  skinIssues: boolean;
  weightChanges: boolean;
  moodSwings: boolean;
  notes: string;
}

export function SymptomsStep({ data, onChange }: { data: SymptomsData, onChange: (d: SymptomsData) => void }) {
  
  const handleCheck = (field: keyof SymptomsData, checked: boolean) => {
    onChange({ ...data, [field]: checked });
  };

  const handleText = (field: keyof SymptomsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const symptomList = [
    { id: "fatigue", label: "Chronic Fatigue / Low Energy" },
    { id: "brainFog", label: "Brain Fog / Memory Issues" },
    { id: "jointPain", label: "Joint/Muscle Pain" },
    { id: "digestiveIssues", label: "Digestive Issues (Bloating, IBS, etc.)" },
    { id: "sleepProblems", label: "Sleep Problems / Insomnia" },
    { id: "headaches", label: "Frequent Headaches / Migraines" },
    { id: "skinIssues", label: "Skin Issues (Rashes, Acne, Eczema)" },
    { id: "weightChanges", label: "Unexplained Weight Changes" },
    { id: "moodSwings", label: "Mood Swings / Irritability" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">Current Symptoms</h2>
        <p className="text-sm text-muted-foreground">Select any of the common symptoms you are currently experiencing on a regular basis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border rounded-lg bg-card bg-white/50 dark:bg-black/20">
        {symptomList.map((symptom) => (
          <div key={symptom.id} className="flex items-start space-x-3">
            <Checkbox 
              id={symptom.id} 
              checked={!!data[symptom.id as keyof SymptomsData]}
              onCheckedChange={(c) => handleCheck(symptom.id as keyof SymptomsData, c === true)}
            />
            <label htmlFor={symptom.id} className="text-sm font-medium leading-none cursor-pointer pt-1">
              {symptom.label}
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Detailed Symptom Description</label>
        <Textarea 
          placeholder="Please describe your most bothersome symptoms in detail. When did they start? What makes them better or worse?"
          value={data.notes || ""}
          onChange={(e) => handleText('notes', e.target.value)}
          rows={5}
        />
      </div>
    </div>
  );
}
