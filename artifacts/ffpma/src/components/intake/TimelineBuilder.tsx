import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Calendar, AlertTriangle } from "lucide-react";

export type TimelineEvent = {
  id: string;
  age: string;
  eventType: string; // 'trauma', 'stress', 'infection', 'exposure', 'other'
  description: string;
};

export type TimelineData = {
  [decade: string]: TimelineEvent[]; // e.g. "0-9", "10-19", etc.
};

interface TimelineBuilderProps {
  data: TimelineData;
  onChange: (data: TimelineData) => void;
  patientAge: number | null;
}

export function TimelineBuilder({ data, onChange, patientAge }: TimelineBuilderProps) {
  const decades = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70+"];
  
  // Filter decades to only show up to the patient's current age/decade, plus the next one, or all if no age.
  const visibleDecades = patientAge 
    ? decades.filter(d => {
        if (d === "70+") return true;
        const start = parseInt(d.split("-")[0]);
        return start <= patientAge + 10;
      })
    : decades;

  const handleAddEvent = (decade: string) => {
    const updated = { ...data };
    if (!updated[decade]) updated[decade] = [];
    
    updated[decade].push({
      id: Math.random().toString(36).substring(7),
      age: "",
      eventType: "stress",
      description: ""
    });
    
    onChange(updated);
  };

  const handleUpdateEvent = (decade: string, id: string, field: keyof TimelineEvent, value: string) => {
    const updated = { ...data };
    updated[decade] = updated[decade].map(ev => ev.id === id ? { ...ev, [field]: value } : ev);
    onChange(updated);
  };

  const handleRemoveEvent = (decade: string, id: string) => {
    const updated = { ...data };
    updated[decade] = updated[decade].filter(ev => ev.id !== id);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {visibleDecades.map(decade => {
        const events = data[decade] || [];
        
        return (
          <div key={decade} className="p-5 border rounded-xl bg-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Decade: {decade} years old
              </h3>
              <Button size="sm" variant="outline" onClick={() => handleAddEvent(decade)}>
                <Plus className="w-4 h-4 mr-1" /> Add Event
              </Button>
            </div>
            
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No significant events reported during these years.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev, index) => (
                  <div key={ev.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center p-3 bg-muted/30 rounded-lg">
                    <Input 
                      placeholder="Age (e.g. 5)" 
                      className="w-full md:w-24" 
                      value={ev.age}
                      onChange={(e) => handleUpdateEvent(decade, ev.id, "age", e.target.value)}
                    />
                    
                    <select 
                      className="flex h-10 w-full md:w-40 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={ev.eventType}
                      onChange={(e) => handleUpdateEvent(decade, ev.id, "eventType", e.target.value)}
                    >
                      <option value="stress">Stress/Emotional</option>
                      <option value="trauma">Physical Trauma</option>
                      <option value="infection">Major Infection</option>
                      <option value="exposure">Toxin Exposure</option>
                      <option value="surgery">Surgery/Hospital</option>
                      <option value="other">Other Event</option>
                    </select>

                    <Input 
                      placeholder="Describe the event briefly..." 
                      className="flex-1"
                      value={ev.description}
                      onChange={(e) => handleUpdateEvent(decade, ev.id, "description", e.target.value)}
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveEvent(decade, ev.id)}
                      className="text-red-500 hover:text-red-700 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 text-amber-600 dark:text-amber-400 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>The FFPMA 2026 Protocol emphasizes the cumulative burden of stress and trauma. Please include emotional traumas (divorce, loss of loved one), major illnesses, and physical injuries as they all contribute to the allostatic load.</p>
      </div>
    </div>
  );
}
