import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export interface TraumaData {
  adverseChildhoodEvents: boolean;
  ptsdDiagnosis: boolean;
  majorLoss: boolean;
  abuseHistory: boolean;
  currentStressLevel: string;
  notes: string;
}

export function TraumaStep({ data, onChange }: { data: TraumaData, onChange: (d: TraumaData) => void }) {
  
  const handleCheck = (field: keyof TraumaData, checked: boolean) => {
    onChange({ ...data, [field]: checked });
  };

  const handleText = (field: keyof TraumaData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium mb-2">Trauma & Psychological Stress</h2>
        <p className="text-sm text-muted-foreground">The mind and body are intricately connected. Chronic stress and unresolved trauma can act as significant roadblocks to physical healing. Check any that apply to your history.</p>
      </div>

      <div className="space-y-4 p-5 border rounded-lg bg-card">
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="adverseChildhoodEvents" 
            checked={!!data.adverseChildhoodEvents}
            onCheckedChange={(c) => handleCheck('adverseChildhoodEvents', c === true)}
          />
          <div className="space-y-1 leading-none">
            <label htmlFor="adverseChildhoodEvents" className="text-sm font-medium leading-none cursor-pointer">
              Adverse Childhood Experiences (ACEs)
            </label>
            <p className="text-sm text-muted-foreground text-xs">
              Includes parental separation, neglect, household dysfunction, etc.
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="ptsdDiagnosis" 
            checked={!!data.ptsdDiagnosis}
            onCheckedChange={(c) => handleCheck('ptsdDiagnosis', c === true)}
          />
          <div className="space-y-1 leading-none">
            <label htmlFor="ptsdDiagnosis" className="text-sm font-medium leading-none cursor-pointer">
              PTSD or Severe Anxiety
            </label>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox 
            id="majorLoss" 
            checked={!!data.majorLoss}
            onCheckedChange={(c) => handleCheck('majorLoss', c === true)}
          />
          <div className="space-y-1 leading-none">
            <label htmlFor="majorLoss" className="text-sm font-medium leading-none cursor-pointer">
              Major Loss or Grief
            </label>
            <p className="text-sm text-muted-foreground text-xs">
              Death of a close loved one, severe financial ruin, etc.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox 
            id="abuseHistory" 
            checked={!!data.abuseHistory}
            onCheckedChange={(c) => handleCheck('abuseHistory', c === true)}
          />
          <div className="space-y-1 leading-none">
            <label htmlFor="abuseHistory" className="text-sm font-medium leading-none cursor-pointer">
              History of Abuse (Physical, Emotional, Sexual)
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rate Your Current Daily Stress Level</label>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={data.currentStressLevel || ""}
          onChange={(e) => handleText('currentStressLevel', e.target.value)}
        >
          <option value="">Select level...</option>
          <option value="Low (Relaxed)">Low (Generally relaxed)</option>
          <option value="Moderate (Manageable)">Moderate (Manageable daily stress)</option>
          <option value="High (Overwhelming)">High (Frequently overwhelmed)</option>
          <option value="Severe (Burnout)">Severe (Burnout/Exhaustion)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Context (Optional)</label>
        <Textarea 
          placeholder="Feel free to elaborate on any of the above, or note any current therapies you are utilizing..."
          value={data.notes || ""}
          onChange={(e) => handleText('notes', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
