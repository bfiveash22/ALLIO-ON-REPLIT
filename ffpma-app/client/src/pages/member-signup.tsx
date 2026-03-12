import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Shield,
  Heart,
  Users,
  Leaf,
  Star,
  Lock,
  FileSignature,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const membershipBenefits = [
  {
    icon: Shield,
    title: "PMA Protection",
    description: "Legal protection under Private Membership Association rights",
  },
  {
    icon: Users,
    title: "AI Support Team",
    description: "Access to 7 specialist AI agents for personalized guidance",
  },
  {
    icon: Heart,
    title: "Healing Protocols",
    description: "Evidence-based protocols for true healing, not just treatment",
  },
  {
    icon: Leaf,
    title: "Natural Products",
    description: "168+ healing products including minerals, peptides, and herbs",
  },
  {
    icon: Zap,
    title: "Frequency Healing",
    description: "Access to Rife frequencies and bio-resonance technology",
  },
  {
    icon: Star,
    title: "Community",
    description: "Join a community dedicated to curing over profits",
  },
];

export default function MemberSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    agreeTerms: false,
    agreePMA: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isStep1Valid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone;

  const isStep2Valid =
    formData.address && formData.city && formData.state && formData.zip;

  const isStep3Valid = formData.agreeTerms && formData.agreePMA;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="text-white/60 hover:text-white gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Allio
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Become a Member</h1>
                <p className="text-xs text-white/60">Join Forgotten Formula PMA</p>
              </div>
            </div>
            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              $10 one-time
            </Badge>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    s < step
                      ? "bg-cyan-500 text-white"
                      : s === step
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : "bg-slate-800/50 text-white/40"
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-16 h-1 rounded ${
                      s < step ? "bg-cyan-500" : "bg-slate-800/50"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="order-2 lg:order-1">
              <Card className="bg-slate-800/30 border-white/10 p-8">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Personal Information
                      </h2>
                      <p className="text-white/60">
                        Let's start with your basic details
                      </p>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white/80">First Name</Label>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="bg-slate-800/50 border-white/10 text-white"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <Label className="text-white/80">Last Name</Label>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="bg-slate-800/50 border-white/10 text-white"
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-white/80">Email Address</Label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="bg-slate-800/50 border-white/10 text-white"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">Phone Number</Label>
                        <Input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="bg-slate-800/50 border-white/10 text-white"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 gap-2"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Mailing Address
                      </h2>
                      <p className="text-white/60">
                        Where should we send your membership materials?
                      </p>
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-white/80">Street Address</Label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="bg-slate-800/50 border-white/10 text-white"
                          placeholder="123 Healing Way"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white/80">City</Label>
                          <Input
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="bg-slate-800/50 border-white/10 text-white"
                            placeholder="Wellness City"
                          />
                        </div>
                        <div>
                          <Label className="text-white/80">State</Label>
                          <Input
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="bg-slate-800/50 border-white/10 text-white"
                            placeholder="CA"
                          />
                        </div>
                      </div>
                      <div className="w-1/2">
                        <Label className="text-white/80">ZIP Code</Label>
                        <Input
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                          className="bg-slate-800/50 border-white/10 text-white"
                          placeholder="90210"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 border-white/20 text-white"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep(3)}
                        disabled={!isStep2Valid}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 gap-2"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        PMA Agreement
                      </h2>
                      <p className="text-white/60">
                        Review and accept the membership agreements
                      </p>
                    </div>
                    <Card className="bg-slate-700/30 border-white/10 p-4">
                      <div className="flex items-start gap-3">
                        <FileSignature className="w-5 h-5 text-amber-400 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-white mb-1">
                            Private Membership Association Agreement
                          </h3>
                          <p className="text-sm text-white/60 mb-3">
                            By joining Forgotten Formula PMA, you acknowledge
                            that you are exercising your constitutional rights
                            to freedom of association and privacy in health
                            choices.
                          </p>
                          <Button
                            variant="link"
                            className="text-cyan-400 p-0 h-auto"
                          >
                            Read Full Agreement
                          </Button>
                        </div>
                      </div>
                    </Card>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="agreeTerms"
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              agreeTerms: checked === true,
                            }))
                          }
                        />
                        <label
                          htmlFor="agreeTerms"
                          className="text-sm text-white/80"
                        >
                          I agree to the Terms of Service and understand that
                          FFPMA products and services are for private members
                          only.
                        </label>
                      </div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="agreePMA"
                          checked={formData.agreePMA}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              agreePMA: checked === true,
                            }))
                          }
                        />
                        <label
                          htmlFor="agreePMA"
                          className="text-sm text-white/80"
                        >
                          I acknowledge that I am voluntarily joining a Private
                          Membership Association and waive any FDA regulatory
                          claims regarding products and services.
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="flex-1 border-white/20 text-white"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep(4)}
                        disabled={!isStep3Valid}
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 gap-2"
                      >
                        Proceed to Payment
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Payment
                      </h2>
                      <p className="text-white/60">
                        Complete your membership activation
                      </p>
                    </div>
                    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white/80">Lifetime Membership</span>
                        <span className="text-2xl font-bold text-white">$10</span>
                      </div>
                      <div className="text-sm text-white/60">
                        <p>One-time fee. Lifetime access.</p>
                      </div>
                    </Card>
                    <div className="space-y-4">
                      <p className="text-sm text-white/60 text-center">
                        Payment processing powered by Stripe
                      </p>
                      <Button
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 gap-2"
                        disabled
                      >
                        <Lock className="w-4 h-4" />
                        Complete Payment (Stripe Integration Pending)
                      </Button>
                      <p className="text-xs text-white/40 text-center flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" />
                        Your payment information is secure and encrypted
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setStep(3)}
                      className="w-full border-white/20 text-white"
                    >
                      Back
                    </Button>
                  </motion.div>
                )}
              </Card>
            </div>

            <div className="order-1 lg:order-2">
              <div className="sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Member Benefits
                </h3>
                <div className="space-y-3">
                  {membershipBenefits.map((benefit, i) => {
                    const Icon = benefit.icon;
                    return (
                      <Card
                        key={i}
                        className="bg-slate-800/30 border-white/10 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">
                              {benefit.title}
                            </h4>
                            <p className="text-sm text-white/60">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
