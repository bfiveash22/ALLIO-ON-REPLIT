import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Stethoscope, Users, Brain, Shield, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const PRACTICE_TYPES = [
  "DC (Chiropractor)", "R.N.", "NP", "MD", "DO", "Naturopath",
  "Functional Medicine", "Nutrition Store", "Wellness Center", "Other"
];

const SPECIALTIES = [
  "Functional Medicine", "Integrative Health", "Nutrition", "Chiropractic",
  "Naturopathic", "Anti-Aging", "Sports Medicine", "Peptide Therapy",
  "IV Therapy", "Regenerative Medicine", "Hormone Therapy", "Other"
];

export default function DoctorInterestForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    practiceName: "",
    practiceType: "",
    specialties: [] as string[],
    city: "",
    state: "",
    zipCode: "",
    message: "",
  });

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") || "";

  const submitMutation = useMutation({
    mutationFn: async (data: typeof form & { token: string }) => {
      const res = await fetch("/api/recruitment/interest-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Submission failed");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: "Submission failed", description: "Please try again or contact us directly.", variant: "destructive" });
    },
  });

  function toggleSpecialty(s: string) {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast({ title: "Please fill in your name and email", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ ...form, token });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
          <p className="text-gray-400 text-lg mb-6">
            We've received your interest and will be reaching out shortly to discuss how ALLIO can support your practice.
          </p>
          <p className="text-sm text-gray-500">The ALLIO team will contact you within 1–2 business days.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Join the ALLIO Network
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Express your interest in becoming a practitioner partner. Our team will connect with you about next steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Users, label: "PMA Network", desc: "Join a community of forward-thinking practitioners" },
            { icon: Brain, label: "ALLIO AI Support", desc: "Personalized research tools and member support" },
            { icon: Shield, label: "Full Compliance", desc: "Complete PMA framework and legal structure" },
          ].map(({ icon: Icon, label, desc }) => (
            <Card key={label} className="bg-slate-800/50 border-slate-700 text-center p-4">
              <Icon className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-white text-xs font-semibold">{label}</p>
              <p className="text-gray-500 text-xs mt-1">{desc}</p>
            </Card>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Practitioner Interest Form</CardTitle>
              <CardDescription>Tell us about yourself and your practice</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Full Name *</label>
                    <Input
                      value={form.fullName}
                      onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Dr. Jane Smith"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-full-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Email Address *</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="dr.smith@clinic.com"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Phone</label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="(555) 000-0000"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-phone"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Practice / Clinic Name</label>
                    <Input
                      value={form.practiceName}
                      onChange={e => setForm(p => ({ ...p, practiceName: e.target.value }))}
                      placeholder="Smith Wellness Center"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-practice-name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Practice Type</label>
                  <div className="flex flex-wrap gap-2">
                    {PRACTICE_TYPES.map(type => (
                      <Badge
                        key={type}
                        className={`cursor-pointer text-xs px-3 py-1 transition-colors ${
                          form.practiceType === type
                            ? "bg-cyan-500/30 text-cyan-200 border-cyan-500/50"
                            : "bg-slate-700 text-gray-400 border-slate-600 hover:bg-slate-600"
                        }`}
                        onClick={() => setForm(p => ({ ...p, practiceType: p.practiceType === type ? "" : type }))}
                        data-testid={`badge-practice-type-${type}`}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Areas of Focus (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(spec => (
                      <Badge
                        key={spec}
                        className={`cursor-pointer text-xs px-3 py-1 transition-colors ${
                          form.specialties.includes(spec)
                            ? "bg-blue-500/30 text-blue-200 border-blue-500/50"
                            : "bg-slate-700 text-gray-400 border-slate-600 hover:bg-slate-600"
                        }`}
                        onClick={() => toggleSpecialty(spec)}
                        data-testid={`badge-specialty-${spec}`}
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">City</label>
                    <Input
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      placeholder="Austin"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-city"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">State</label>
                    <Input
                      value={form.state}
                      onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                      placeholder="TX"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-state"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Zip Code</label>
                    <Input
                      value={form.zipCode}
                      onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))}
                      placeholder="78701"
                      className="bg-slate-900 border-slate-600 text-white"
                      data-testid="input-zip"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Message (optional)</label>
                  <Textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us about your practice or any questions you have..."
                    className="bg-slate-900 border-slate-600 text-white min-h-[100px]"
                    data-testid="textarea-message"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3"
                  data-testid="button-submit-interest"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Interest
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
