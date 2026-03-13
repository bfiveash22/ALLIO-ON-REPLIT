import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Activity, Brain, FileText, CheckCircle2, ChevronRight, ChevronLeft, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


import { TimelineBuilder, TimelineData } from "@/components/intake/TimelineBuilder";
import { EnvironmentalStep, EnvironmentalData } from "@/components/intake/EnvironmentalStep";
import { TraumaStep, TraumaData } from "@/components/intake/TraumaStep";
import { SymptomsStep, SymptomsData } from "@/components/intake/SymptomsStep";
import { SurgicalStep, SurgicalData } from "@/components/intake/SurgicalStep";
import { LifestyleStep, LifestyleData } from "@/components/intake/LifestyleStep";

// Basic Types
export type IntakeFormData = {
  basicInfo: any;
  timeline: any;
  environmental: any;
  trauma: any;
  symptoms: any;
  surgical: any;
  lifestyle: any;
};

const INITIAL_DATA: IntakeFormData = {
  basicInfo: {},
  timeline: {},
  environmental: {},
  trauma: {},
  symptoms: {},
  surgical: {},
  lifestyle: {},
};

const STEPS = [
  { id: 0, title: "Basic Info", icon: <User className="w-5 h-5" /> },
  { id: 1, title: "Life Timeline", icon: <Activity className="w-5 h-5" /> },
  { id: 2, title: "Environmental", icon: <Brain className="w-5 h-5" /> },
  { id: 3, title: "Trauma & Stress", icon: <Brain className="w-5 h-5" /> },
  { id: 4, title: "Symptoms", icon: <Activity className="w-5 h-5" /> },
  { id: 5, title: "Surgical History", icon: <FileText className="w-5 h-5" /> },
  { id: 6, title: "Lifestyle", icon: <Activity className="w-5 h-5" /> },
  { id: 7, title: "Review", icon: <CheckCircle2 className="w-5 h-5" /> }
];

export default function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_DATA);
  const [draftId, setDraftId] = useState<number | null>(null);
  const { toast } = useToast();

  // Load from local storage initially
  useEffect(() => {
    const saved = localStorage.getItem("allio_intake_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.draftId) setDraftId(parsed.draftId);
      } catch (e) {
        console.error("Could not parse saved draft", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("allio_intake_draft", JSON.stringify({ formData, draftId }));
  }, [formData, draftId]);

  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/intake/save-draft", data);
      return res.json();
    },
    onSuccess: (data) => {
      setDraftId(data.draftId);
      toast({ title: "Draft saved", description: "Your progress has been backed up securely." });
    }
  });

  const generateStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label>Full Name</label>
                <Input 
                  value={formData.basicInfo?.name || ""} 
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, name: e.target.value }})}
                  placeholder="Jane Doe" 
                />
              </div>
              <div className="space-y-2">
                <label>Email Address</label>
                <Input 
                  type="email"
                  value={formData.basicInfo?.email || ""} 
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, email: e.target.value }})}
                  placeholder="jane@example.com" 
                />
              </div>
              <div className="space-y-2">
                <label>Phone Number</label>
                <Input 
                  type="tel"
                  value={formData.basicInfo?.phone || ""} 
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, phone: e.target.value }})}
                  placeholder="(555) 123-4567" 
                />
              </div>
              <div className="space-y-2">
                <label>Date of Birth</label>
                <Input 
                  type="date"
                  value={formData.basicInfo?.dob || ""} 
                  onChange={(e) => {
                    const dob = e.target.value;
                    const bday = new Date(dob);
                    const ageDifMs = Date.now() - bday.getTime();
                    const ageDate = new Date(ageDifMs);
                    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                    setFormData({ ...formData, basicInfo: { ...formData.basicInfo, dob, age }});
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <label className="font-medium">Primary Reason for Visit</label>
              <Textarea 
                value={formData.basicInfo?.primaryConcern || ""} 
                onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, primaryConcern: e.target.value }})}
                placeholder="Describe your main health goals or concerns..." 
                rows={4}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <TimelineBuilder 
            data={formData.timeline || {}} 
            patientAge={formData.basicInfo?.age}
            onChange={(data: TimelineData) => setFormData({ ...formData, timeline: data })}
          />
        );
      case 2:
        return (
          <EnvironmentalStep 
            data={formData.environmental || {}} 
            onChange={(data: EnvironmentalData) => setFormData({ ...formData, environmental: data })}
          />
        );
      case 3:
        return (
          <TraumaStep 
            data={formData.trauma || {}}
            onChange={(data: TraumaData) => setFormData({ ...formData, trauma: data })}
          />
        );
      case 4:
        return (
           <SymptomsStep 
             data={formData.symptoms || {}}
             onChange={(data: SymptomsData) => setFormData({ ...formData, symptoms: data })}
           />
        );
      case 5:
        return (
          <SurgicalStep 
             data={formData.surgical || { surgeries: [] }}
             onChange={(data: SurgicalData) => setFormData({ ...formData, surgical: data })}
          />
        );
      case 6:
        return (
          <LifestyleStep 
            data={formData.lifestyle || {}}
            onChange={(data: LifestyleData) => setFormData({ ...formData, lifestyle: data })}
          />
        );
      case 7:
         return (
           <div className="space-y-6">
             <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Review & Submit</h2>
                <p className="text-sm text-muted-foreground">Please review your responses before finalizing the intake form for the FFPMA 2026 Protocol.</p>
             </div>
             
             <div className="space-y-4">
               <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="font-medium text-lg mb-2 text-indigo-500">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Name:</strong> {formData.basicInfo?.name || "Missing"}</p>
                    <p><strong>Email:</strong> {formData.basicInfo?.email || "Missing"}</p>
                    <p><strong>Phone:</strong> {formData.basicInfo?.phone || "N/A"}</p>
                    <p><strong>Age:</strong> {formData.basicInfo?.age || "N/A"}</p>
                  </div>
               </div>
               
               <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="font-medium text-lg mb-2 text-indigo-500">Timeline Events</h3>
                  <p className="text-sm text-muted-foreground">
                    {Object.values(formData.timeline || {}).flat().length} chronological events recorded.
                  </p>
               </div>
               
               <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="font-medium text-lg mb-2 text-indigo-500">Exposures & Toxins</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Mold Exposure:</strong> {formData.environmental?.moldExposure || "N/A"}</p>
                    <p><strong>Heavy Metals:</strong> {formData.environmental?.heavyMetals || "N/A"}</p>
                  </div>
               </div>
               
               <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="font-medium text-lg mb-2 text-indigo-500">Lifestyle</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Diet:</strong> {formData.lifestyle?.dietType || "N/A"}</p>
                    <p><strong>Sleep:</strong> {formData.lifestyle?.sleepHours || "N/A"}</p>
                  </div>
               </div>
             </div>
           </div>
         );
      default:
        return (
          <div className="p-8 border border-dashed rounded-lg bg-black/5 text-center dark:bg-white/5">
            <h3 className="text-lg font-medium">{STEPS[currentStep].title} Placeholder</h3>
            <p className="text-muted-foreground text-sm mt-2">Implementation pending...</p>
          </div>
        );
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      // Auto-save draft randomly or every step
      saveDraftMutation.mutate({
        draftId,
        patientInfo: formData.basicInfo,
        formData
      });
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/intake/submit", { patientInfo: formData.basicInfo, formData });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Intake Submitted", description: "Your intake form was successfully submitted!" });
      localStorage.removeItem("allio_intake_draft");
      // Redirect or show success state
      window.location.href = "/?success=intake";
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1C1F26] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              FFPMA Intake Form
            </h1>
            <p className="text-muted-foreground">FFPMA 2026 Protocol Intake Timeline</p>
          </div>
          <div className="flex gap-2">
             <Button 
               variant="outline" 
               size="sm" 
               className="gap-2"
               onClick={() => saveDraftMutation.mutate({ draftId, patientInfo: formData.basicInfo, formData })}
               disabled={saveDraftMutation.isPending}
             >
               {saveDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Save Draft
             </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div 
                className={`w-full h-2 rounded-full ${currentStep >= i ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'}`}
              />
              <span className="text-[10px] uppercase font-semibold text-muted-foreground hidden md:block">
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Content Card with Framer Motion Glassmorphism */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border border-white/10 shadow-xl bg-white/70 dark:bg-black/40 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  {STEPS[currentStep].icon}
                </div>
                <div>
                  <CardTitle>{STEPS[currentStep].title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 min-h-[400px]">
              {generateStepContent()}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Intake Form
            </Button>
          ) : (
             <Button 
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
              onClick={handleNext}
             >
               Next <ChevronRight className="w-4 h-4 ml-2" />
             </Button>
          )}
        </div>

      </div>
    </div>
  );
}
