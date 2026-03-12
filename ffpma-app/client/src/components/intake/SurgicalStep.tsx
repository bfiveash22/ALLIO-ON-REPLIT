import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export type SurgeryEvent = {
  id: string;
  year: string;
  procedure: string;
  complications: string;
};

export interface SurgicalData {
  surgeries: SurgeryEvent[];
}

export function SurgicalStep({ data, onChange }: { data: SurgicalData, onChange: (d: SurgicalData) => void }) {
  
  const surgeries = data.surgeries || [];

  const handleAddSurgery = () => {
    onChange({
      surgeries: [
        ...surgeries,
        {
          id: Math.random().toString(36).substring(7),
          year: "",
          procedure: "",
          complications: ""
        }
      ]
    });
  };

  const handleUpdate = (id: string, field: keyof SurgeryEvent, value: string) => {
    onChange({
      surgeries: surgeries.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const handleRemove = (id: string) => {
    onChange({
      surgeries: surgeries.filter(s => s.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-medium mb-2">Surgical History & Implants</h2>
          <p className="text-sm text-muted-foreground">List any major surgeries, operations, or medical implants you have received.</p>
        </div>
        <Button onClick={handleAddSurgery} size="sm" className="shrink-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200">
          <Plus className="w-4 h-4 mr-1" /> Add Surgery
        </Button>
      </div>

      {surgeries.length === 0 ? (
        <div className="p-8 border border-dashed rounded-lg bg-black/5 text-center dark:bg-white/5">
          <p className="text-muted-foreground text-sm">No surgeries added. Click "Add Surgery" if applicable, otherwise continue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {surgeries.map((surgery) => (
            <div key={surgery.id} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-32">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Year / Age</label>
                <Input 
                  placeholder="e.g. 2015" 
                  value={surgery.year}
                  onChange={(e) => handleUpdate(surgery.id, 'year', e.target.value)}
                />
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Procedure / Implant</label>
                <Input 
                  placeholder="e.g. Appendectomy, Breast Implants, Gallbladder" 
                  value={surgery.procedure}
                  onChange={(e) => handleUpdate(surgery.id, 'procedure', e.target.value)}
                />
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Complications / Notes</label>
                <Input 
                  placeholder="Any infections, slow healing, retained scar tissue?" 
                  value={surgery.complications}
                  onChange={(e) => handleUpdate(surgery.id, 'complications', e.target.value)}
                />
              </div>

              <div className="pt-6">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => handleRemove(surgery.id)}
                   className="text-red-500 hover:text-red-700"
                 >
                   <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
