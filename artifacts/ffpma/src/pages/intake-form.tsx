import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Activity, Brain, FileText, CheckCircle2, ChevronRight, ChevronLeft, Save, Shield, Pill, Heart, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { TimelineBuilder, TimelineData } from "@/components/intake/TimelineBuilder";
import { EnvironmentalStep, EnvironmentalData } from "@/components/intake/EnvironmentalStep";
import { TraumaStep, TraumaData } from "@/components/intake/TraumaStep";
import { SymptomsStep, SymptomsData } from "@/components/intake/SymptomsStep";
import { SurgicalStep, SurgicalData } from "@/components/intake/SurgicalStep";
import { LifestyleStep, LifestyleData } from "@/components/intake/LifestyleStep";

export type IntakeFormData = {
  basicInfo: any;
  timeline: any;
  environmental: any;
  trauma: any;
  symptoms: any;
  surgical: any;
  lifestyle: any;
  productInterests: any;
  goals: any;
};

const INITIAL_DATA: IntakeFormData = {
  basicInfo: {},
  timeline: {},
  environmental: {},
  trauma: {},
  symptoms: {},
  surgical: {},
  lifestyle: {},
  productInterests: { peptides: [], modalities: [], supplements: [] },
  goals: {},
};

const STEPS = [
  { id: 0, title: "Personal Info", icon: <User className="w-5 h-5" />, section: 1 },
  { id: 1, title: "Life Timeline", icon: <Activity className="w-5 h-5" />, section: 1 },
  { id: 2, title: "Environmental", icon: <Brain className="w-5 h-5" />, section: 2 },
  { id: 3, title: "Trauma & Stress", icon: <Brain className="w-5 h-5" />, section: 2 },
  { id: 4, title: "Symptoms", icon: <Activity className="w-5 h-5" />, section: 2 },
  { id: 5, title: "Surgical History", icon: <FileText className="w-5 h-5" />, section: 2 },
  { id: 6, title: "Lifestyle & Diet", icon: <Heart className="w-5 h-5" />, section: 3 },
  { id: 7, title: "Product Catalog", icon: <Pill className="w-5 h-5" />, section: 3 },
  { id: 8, title: "Goals", icon: <Leaf className="w-5 h-5" />, section: 3 },
  { id: 9, title: "Review", icon: <CheckCircle2 className="w-5 h-5" />, section: 3 },
];

const SECTION_LABELS = [
  "Section 1 of 3 — Personal Information",
  "Section 2 of 3 — Health History & Current Conditions",
  "Section 3 of 3 — Lifestyle, Goals & Product Selection",
];

const PEPTIDE_CATALOG = [
  { name: "PNC-27", category: "Injectable", purpose: "P53 tumor suppressor activation" },
  { name: "FOXO4-DRI", category: "Injectable", purpose: "Senolytic — clearance of senescent cells" },
  { name: "MENK (Methionine Enkephalin)", category: "Injectable", purpose: "Immune modulation, NK cell activation" },
  { name: "Thymosin Alpha-1", category: "Injectable", purpose: "Immune system activation & viral defense" },
  { name: "BPC-157", category: "Injectable", purpose: "Gut healing, tissue repair, anti-inflammatory" },
  { name: "GHK-Cu", category: "Injectable", purpose: "Skin repair, anti-aging, wound healing" },
  { name: "SS-31 (Elamipretide)", category: "Injectable", purpose: "Mitochondrial membrane stabilization" },
  { name: "MOTS-c", category: "Injectable", purpose: "Metabolic optimization, mitochondrial peptide" },
  { name: "Epithalon", category: "Injectable", purpose: "Telomere extension, pineal gland support" },
  { name: "LL-37", category: "Injectable", purpose: "Antimicrobial, biofilm disruption" },
  { name: "KPV", category: "Oral", purpose: "Gut inflammation, anti-inflammatory tripeptide" },
  { name: "Dihexa", category: "Oral", purpose: "Cognitive enhancement, nerve growth factor" },
  { name: "Semax", category: "Oral", purpose: "Neuroprotection, cognitive support" },
  { name: "Selank", category: "Oral", purpose: "Anxiolytic, immune modulation" },
  { name: "Thymalin", category: "Bioregulator", purpose: "Thymus gland peptide bioregulator" },
  { name: "Epithalamin", category: "Bioregulator", purpose: "Pineal gland peptide bioregulator" },
  { name: "Vladonix", category: "Bioregulator", purpose: "Thymus immune bioregulator" },
  { name: "Endoluten", category: "Bioregulator", purpose: "Pineal/neuroendocrine bioregulator" },
  { name: "Cerluten", category: "Bioregulator", purpose: "Brain peptide bioregulator" },
  { name: "Sigumir", category: "Bioregulator", purpose: "Joint/cartilage bioregulator" },
];

const MODALITY_CATALOG = [
  { name: "HBOT (Hyperbaric Oxygen)", purpose: "Deep tissue oxygenation & stem cell mobilization" },
  { name: "IV Therapy — High-Dose Vitamin C", purpose: "Immune support & oxidative therapy" },
  { name: "IV Therapy — NAD+", purpose: "Cellular energy & DNA repair" },
  { name: "IV Therapy — Glutathione", purpose: "Master antioxidant & detoxification" },
  { name: "IM Lipo-B Injections", purpose: "Lipotropic fat metabolism support" },
  { name: "Coffee Enemas", purpose: "Liver/bile duct detox, glutathione boost" },
  { name: "Red Light / NIR Therapy", purpose: "Mitochondrial support, wound healing" },
  { name: "Nebulization Protocols", purpose: "Respiratory immune support" },
  { name: "ECS Suppositories (CBD/CBG)", purpose: "Endocannabinoid system optimization" },
  { name: "Castor Oil Packs", purpose: "Lymphatic drainage & inflammation reduction" },
  { name: "Detox Baths", purpose: "Heavy metal & toxin elimination" },
  { name: "Exosome Therapy", purpose: "Regenerative cellular signaling" },
];

const SUPPLEMENT_CATALOG = [
  { name: "MitoSTAC Complex", purpose: "Sirtuin activation (resveratrol, pterostilbene, quercetin, fisetin)" },
  { name: "GlyNAC (Glycine + NAC)", purpose: "Glutathione precursor, anti-aging" },
  { name: "Liposomal Curcumin", purpose: "Systemic inflammation reduction" },
  { name: "Liposomal Glutathione", purpose: "Enhanced antioxidant delivery" },
  { name: "Liposomal Vitamin C", purpose: "High-bioavailability immune support" },
  { name: "Methylated B Complex", purpose: "Methylation support, energy metabolism" },
  { name: "Magnesium Threonate", purpose: "Brain magnesium, cognitive support" },
  { name: "Omega-3 (EPA/DHA)", purpose: "Anti-inflammatory, cardiovascular" },
  { name: "Berberine", purpose: "Blood sugar regulation, gut microbiome" },
  { name: "Digestive Enzymes", purpose: "Nutrient absorption, gut support" },
];

export default function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_DATA);
  const [draftId, setDraftId] = useState<number | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    localStorage.setItem("allio_intake_draft", JSON.stringify({ formData, draftId }));
  }, [formData, draftId]);

  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/intake/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to save draft");
      return res.json();
    },
    onSuccess: (data) => {
      setDraftId(data.draftId);
      toast({ title: "Draft saved", description: "Your progress has been backed up securely." });
    }
  });

  const toggleProduct = (category: "peptides" | "modalities" | "supplements", name: string) => {
    const current = formData.productInterests?.[category] || [];
    const updated = current.includes(name)
      ? current.filter((n: string) => n !== name)
      : [...current, name];
    setFormData({
      ...formData,
      productInterests: { ...formData.productInterests, [category]: updated },
    });
  };

  const currentSection = STEPS[currentStep]?.section || 1;

  const generateStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A2440]">Full Legal Name</label>
                <Input
                  value={formData.basicInfo?.name || ""}
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, name: e.target.value }})}
                  placeholder="Enter full name..."
                  className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A2440]">Email Address</label>
                <Input
                  type="email"
                  value={formData.basicInfo?.email || ""}
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, email: e.target.value }})}
                  placeholder="name@example.com"
                  className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A2440]">Phone Number</label>
                <Input
                  type="tel"
                  value={formData.basicInfo?.phone || ""}
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, phone: e.target.value }})}
                  placeholder="(___) ___-____"
                  className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A2440]">Date of Birth</label>
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
                  className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A2440]">Gender</label>
                <select
                  value={formData.basicInfo?.gender || ""}
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, gender: e.target.value }})}
                  className="w-full h-10 rounded-md border border-[#C9A54E]/30 bg-background px-3 text-sm focus:border-[#C9A54E] focus:ring-1 focus:ring-[#C9A54E]/20"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1A2440]">Location (City, State)</label>
                <Input
                  value={formData.basicInfo?.location || ""}
                  onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, location: e.target.value }})}
                  placeholder="City, State"
                  className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
                />
              </div>
            </div>
            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium text-[#1A2440]">Primary Reason for Seeking Membership</label>
              <Textarea
                value={formData.basicInfo?.primaryConcern || ""}
                onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, primaryConcern: e.target.value }})}
                placeholder="Describe your main health goals or concerns..."
                rows={4}
                className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2440]">How did you hear about Forgotten Formula PMA?</label>
              <Input
                value={formData.basicInfo?.referralSource || ""}
                onChange={(e) => setFormData({ ...formData, basicInfo: { ...formData.basicInfo, referralSource: e.target.value }})}
                placeholder="Referral, website, social media..."
                className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
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
            <p className="text-sm text-[#5A6B8A]">
              Select any peptides, modalities, or supplements you are interested in or have experience with.
              Your Trustee will use this to customize your protocol.
            </p>

            <div>
              <h3 className="text-lg font-semibold text-[#1A2440] mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#C9A54E]" />
                Peptide Therapeutics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PEPTIDE_CATALOG.map((p) => (
                  <label
                    key={p.name}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      (formData.productInterests?.peptides || []).includes(p.name)
                        ? "border-[#C9A54E] bg-[#C9A54E]/5"
                        : "border-gray-200 hover:border-[#C9A54E]/40"
                    }`}
                  >
                    <Checkbox
                      checked={(formData.productInterests?.peptides || []).includes(p.name)}
                      onCheckedChange={() => toggleProduct("peptides", p.name)}
                      className="mt-0.5 data-[state=checked]:bg-[#C9A54E] data-[state=checked]:border-[#C9A54E]"
                    />
                    <div>
                      <span className="text-sm font-medium text-[#1A2440]">{p.name}</span>
                      <span className="text-xs text-[#C9A54E] ml-2">({p.category})</span>
                      <p className="text-xs text-[#5A6B8A] mt-0.5">{p.purpose}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#1A2440] mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#C9A54E]" />
                Therapeutic Modalities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {MODALITY_CATALOG.map((m) => (
                  <label
                    key={m.name}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      (formData.productInterests?.modalities || []).includes(m.name)
                        ? "border-[#C9A54E] bg-[#C9A54E]/5"
                        : "border-gray-200 hover:border-[#C9A54E]/40"
                    }`}
                  >
                    <Checkbox
                      checked={(formData.productInterests?.modalities || []).includes(m.name)}
                      onCheckedChange={() => toggleProduct("modalities", m.name)}
                      className="mt-0.5 data-[state=checked]:bg-[#C9A54E] data-[state=checked]:border-[#C9A54E]"
                    />
                    <div>
                      <span className="text-sm font-medium text-[#1A2440]">{m.name}</span>
                      <p className="text-xs text-[#5A6B8A] mt-0.5">{m.purpose}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#1A2440] mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-[#C9A54E]" />
                Supplements & Nutraceuticals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUPPLEMENT_CATALOG.map((s) => (
                  <label
                    key={s.name}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      (formData.productInterests?.supplements || []).includes(s.name)
                        ? "border-[#C9A54E] bg-[#C9A54E]/5"
                        : "border-gray-200 hover:border-[#C9A54E]/40"
                    }`}
                  >
                    <Checkbox
                      checked={(formData.productInterests?.supplements || []).includes(s.name)}
                      onCheckedChange={() => toggleProduct("supplements", s.name)}
                      className="mt-0.5 data-[state=checked]:bg-[#C9A54E] data-[state=checked]:border-[#C9A54E]"
                    />
                    <div>
                      <span className="text-sm font-medium text-[#1A2440]">{s.name}</span>
                      <p className="text-xs text-[#5A6B8A] mt-0.5">{s.purpose}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2440]">What are your top 3 health goals?</label>
              <Textarea
                value={formData.goals?.topGoals || ""}
                onChange={(e) => setFormData({ ...formData, goals: { ...formData.goals, topGoals: e.target.value }})}
                placeholder="1. Reduce inflammation and chronic pain&#10;2. Improve energy and mental clarity&#10;3. Support immune function"
                rows={4}
                className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2440]">What outcome would make this protocol a success for you?</label>
              <Textarea
                value={formData.goals?.successCriteria || ""}
                onChange={(e) => setFormData({ ...formData, goals: { ...formData.goals, successCriteria: e.target.value }})}
                placeholder="Describe what success looks like for you..."
                rows={3}
                className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2440]">Are you willing to commit to the full 90-day protocol?</label>
              <div className="flex gap-4">
                {["Yes, fully committed", "Willing to try", "Need more information"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="commitment"
                      checked={formData.goals?.commitmentLevel === opt}
                      onChange={() => setFormData({ ...formData, goals: { ...formData.goals, commitmentLevel: opt }})}
                      className="accent-[#C9A54E]"
                    />
                    <span className="text-sm text-[#1A2440]">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A2440]">Anything else your Trustee should know?</label>
              <Textarea
                value={formData.goals?.additionalNotes || ""}
                onChange={(e) => setFormData({ ...formData, goals: { ...formData.goals, additionalNotes: e.target.value }})}
                placeholder="Any additional information, concerns, or questions..."
                rows={3}
                className="border-[#C9A54E]/30 focus:border-[#C9A54E] focus:ring-[#C9A54E]/20"
              />
            </div>
          </div>
        );
      case 9:
        const selectedPeptides = formData.productInterests?.peptides?.length || 0;
        const selectedModalities = formData.productInterests?.modalities?.length || 0;
        const selectedSupplements = formData.productInterests?.supplements?.length || 0;
        return (
          <div className="space-y-6">
            <p className="text-sm text-[#5A6B8A]">
              Please review your responses before finalizing. Your Trustee will use this information to build your custom 90-day protocol.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#C9A54E]/20 bg-[#C9A54E]/5">
                <h3 className="font-semibold text-[#1A2440] mb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-[#C9A54E] font-medium">Name:</span> {formData.basicInfo?.name || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Email:</span> {formData.basicInfo?.email || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Phone:</span> {formData.basicInfo?.phone || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Age:</span> {formData.basicInfo?.age || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Gender:</span> {formData.basicInfo?.gender || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Location:</span> {formData.basicInfo?.location || "—"}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[#C9A54E]/20 bg-[#C9A54E]/5">
                <h3 className="font-semibold text-[#1A2440] mb-2">Health History</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-[#C9A54E] font-medium">Timeline Events:</span> {Object.values(formData.timeline || {}).flat().length}</p>
                  <p><span className="text-[#C9A54E] font-medium">Mold Exposure:</span> {formData.environmental?.moldExposure || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Heavy Metals:</span> {formData.environmental?.heavyMetals || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Surgeries:</span> {formData.surgical?.surgeries?.length || 0}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[#C9A54E]/20 bg-[#C9A54E]/5">
                <h3 className="font-semibold text-[#1A2440] mb-2">Product Interests</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[#C9A54E] font-medium mb-1">Peptides ({selectedPeptides})</p>
                    {(formData.productInterests?.peptides || []).slice(0, 5).map((p: string) => (
                      <p key={p} className="text-xs text-[#5A6B8A]">• {p}</p>
                    ))}
                    {selectedPeptides > 5 && <p className="text-xs text-[#5A6B8A]">+{selectedPeptides - 5} more</p>}
                  </div>
                  <div>
                    <p className="text-[#C9A54E] font-medium mb-1">Modalities ({selectedModalities})</p>
                    {(formData.productInterests?.modalities || []).slice(0, 5).map((m: string) => (
                      <p key={m} className="text-xs text-[#5A6B8A]">• {m}</p>
                    ))}
                    {selectedModalities > 5 && <p className="text-xs text-[#5A6B8A]">+{selectedModalities - 5} more</p>}
                  </div>
                  <div>
                    <p className="text-[#C9A54E] font-medium mb-1">Supplements ({selectedSupplements})</p>
                    {(formData.productInterests?.supplements || []).slice(0, 5).map((s: string) => (
                      <p key={s} className="text-xs text-[#5A6B8A]">• {s}</p>
                    ))}
                    {selectedSupplements > 5 && <p className="text-xs text-[#5A6B8A]">+{selectedSupplements - 5} more</p>}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[#C9A54E]/20 bg-[#C9A54E]/5">
                <h3 className="font-semibold text-[#1A2440] mb-2">Goals & Commitment</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-[#C9A54E] font-medium">Commitment:</span> {formData.goals?.commitmentLevel || "—"}</p>
                  <p><span className="text-[#C9A54E] font-medium">Top Goals:</span> {formData.goals?.topGoals?.substring(0, 100) || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      saveDraftMutation.mutate({
        draftId,
        patientInfo: formData.basicInfo,
        formData
      });
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientInfo: formData.basicInfo, formData })
      });
      if (!res.ok) throw new Error("Failed to submit intake form");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Assessment Submitted", description: "Your intake assessment was successfully submitted to your Trustee." });
      localStorage.removeItem("allio_intake_draft");
      window.location.href = "/?success=intake";
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#1A2440] to-[#0A0E1A] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#C9A54E]" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Member Assessment
                </h1>
                <p className="text-[#C8CFE0] text-sm">Forgotten Formula PMA — 2026 Protocol Intake</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#C9A54E]/40 text-[#C9A54E] hover:bg-[#C9A54E]/10 hover:text-[#C9A54E]"
            onClick={() => saveDraftMutation.mutate({ draftId, patientInfo: formData.basicInfo, formData })}
            disabled={saveDraftMutation.isPending}
          >
            {saveDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </Button>
        </div>

        <div className="bg-[#243055]/60 rounded-lg px-4 py-2 border border-[#C9A54E]/20">
          <p className="text-xs font-medium text-[#C9A54E] uppercase tracking-wider">
            {SECTION_LABELS[currentSection - 1]}
          </p>
        </div>

        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  currentStep >= i
                    ? "bg-[#C9A54E]"
                    : "bg-[#243055]"
                }`}
              />
              <span className="text-[9px] uppercase font-semibold text-[#C8CFE0]/60 hidden lg:block">
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border border-[#C9A54E]/15 shadow-2xl bg-white dark:bg-[#0F1420]">
            <CardHeader className="border-b border-[#C9A54E]/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#C9A54E]/10 text-[#C9A54E]">
                  {STEPS[currentStep].icon}
                </div>
                <CardTitle className="text-[#1A2440] dark:text-white">{STEPS[currentStep].title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 min-h-[400px]">
              {generateStepContent()}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="border-[#C9A54E]/30 text-[#C8CFE0] hover:bg-[#243055] hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <span className="text-xs text-[#C8CFE0]/50">
            Step {currentStep + 1} of {STEPS.length}
          </span>

          {currentStep === STEPS.length - 1 ? (
            <Button
              className="bg-[#C9A54E] hover:bg-[#B89440] text-[#0A0E1A] font-semibold shadow-lg"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Assessment
            </Button>
          ) : (
            <Button
              className="bg-[#1A2440] hover:bg-[#243055] text-white border border-[#C9A54E]/30 shadow-md"
              onClick={handleNext}
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="text-center pt-2">
          <p className="text-[10px] text-[#C8CFE0]/40 uppercase tracking-widest">
            Confidential — Private Members Association — Constitutional Protection
          </p>
        </div>

      </div>
    </div>
  );
}
