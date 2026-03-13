import React from 'react';
import './_group.css';
import { 
  Shield, 
  Dna, 
  Heart, 
  Users, 
  Target, 
  Droplets, 
  Network, 
  Waves, 
  Microscope, 
  Syringe, 
  Pill, 
  Activity, 
  Atom, 
  Brain, 
  Zap, 
  Leaf, 
  Star, 
  ChevronRight, 
  Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function SplitPanel() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 lg:px-12 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Shield className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Forgotten Formula</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-teal-400 font-semibold">PMA Platform</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Philosophy</a>
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Programs</a>
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Products</a>
          <div className="h-4 w-px bg-white/10"></div>
          <a href="#" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Member Login</a>
          <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 border-0">
            Become a Member
          </Button>
        </div>
      </nav>

      {/* Hero Section - Split Panel */}
      <section className="relative min-h-screen flex flex-col lg:flex-row pt-24 lg:pt-0">
        {/* Left Content */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-20 xl:p-32 z-10">
          <div className="max-w-2xl w-full">
            <Badge className="bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-8 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
              Powered by Allio v1 - The All-in-One Healing Ecosystem
            </Badge>
            
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Healing Protected by the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">Constitution</span>
            </h2>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed font-light">
              A collection of like-minded Doctors, Clinics, and everyday Americans committed to root cause medicine and constitutional protection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-14 px-8 text-lg rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all">
                Become a Member <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-xl border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-white backdrop-blur-md">
                For Doctors
              </Button>
            </div>
            
            <div className="relative p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
              <div className="absolute -top-3 -left-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
              </div>
              <blockquote className="text-lg italic text-slate-300 font-serif">
                "Your Why Should Make You Cry. We Protect the Good, the Caring, and Support Curing Over Profits."
              </blockquote>
            </div>
          </div>
        </div>
        
        {/* Right Visual */}
        <div className="flex-1 relative hidden lg:block overflow-hidden bg-slate-900 border-l border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-teal-900/20 mix-blend-overlay"></div>
          <img 
            src="/__mockup/images/split-hero-abstract.png" 
            alt="Abstract scientific visualization" 
            className="w-full h-full object-cover object-center opacity-80"
          />
          {/* Overlay gradient to blend bottom edge if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-slate-900/50 relative z-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            <div className="text-center px-4">
              <p className="text-4xl font-bold text-white mb-2">12.5k+</p>
              <p className="text-sm text-teal-400 font-medium uppercase tracking-wider">Active Members</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold text-white mb-2">340</p>
              <p className="text-sm text-teal-400 font-medium uppercase tracking-wider">Partner Clinics</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold text-white mb-2">85+</p>
              <p className="text-sm text-teal-400 font-medium uppercase tracking-wider">Products</p>
            </div>
            <div className="text-center px-4">
              <p className="text-4xl font-bold text-white mb-2">12</p>
              <p className="text-sm text-teal-400 font-medium uppercase tracking-wider">Programs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Column: Features & 5Rs */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-24">
            
            {/* Left Column: Features */}
            <div>
              <div className="mb-12">
                <Badge className="bg-slate-800 text-cyan-400 border-cyan-500/30 mb-4">Foundation</Badge>
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Our Core Pillars</h3>
                <p className="text-slate-400">The fundamental principles that guide our Private Membership Association.</p>
              </div>
              
              <div className="space-y-6">
                {[
                  { icon: Shield, title: "Constitutional Protection", desc: "Operating within the private domain, protected by the 1st and 14th Amendments.", color: "text-amber-400", bg: "bg-amber-500/10" },
                  { icon: Target, title: "Root Cause Medicine", desc: "Addressing the underlying causes of disease rather than just managing symptoms.", color: "text-cyan-400", bg: "bg-cyan-500/10" },
                  { icon: Heart, title: "Holistic Healing", desc: "Integrating mind, body, and spirit protocols for comprehensive wellness.", color: "text-teal-400", bg: "bg-teal-500/10" },
                  { icon: Users, title: "Member Community", desc: "A supportive network of doctors and patients united in the pursuit of true health.", color: "text-indigo-400", bg: "bg-indigo-500/10" }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-2xl border border-white/5 bg-slate-900/30 hover:bg-slate-800/50 transition-colors group">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${feature.bg}`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{feature.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column: 5Rs Framework */}
            <div className="relative">
              <div className="absolute inset-0 bg-slate-900/50 rounded-3xl border border-white/5 backdrop-blur-md overflow-hidden">
                <img 
                  src="/__mockup/images/split-section-bg.png" 
                  alt="Background pattern" 
                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
                />
              </div>
              
              <div className="relative p-8 lg:p-12 z-10">
                <Badge className="bg-slate-800 text-teal-400 border-teal-500/30 mb-4">Methodology</Badge>
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">The 5 Rs Framework</h3>
                <p className="text-slate-400 mb-12">Our systematic approach to cellular restoration and vibrant health.</p>
                
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-teal-500/50 before:via-cyan-500/50 before:to-transparent">
                  {[
                    { step: "1", title: "Reduce", desc: "Eliminate toxic load, pathogens, and inflammatory triggers.", icon: Waves },
                    { step: "2", title: "Rebalance", desc: "Restore homeostasis to the microbiome and metabolic pathways.", icon: Activity },
                    { step: "3", title: "Reactivate", desc: "Awaken dormant cellular functions and immune response.", icon: Zap },
                    { step: "4", title: "Restore", desc: "Rebuild damaged tissues and replenish vital nutrients.", icon: Dna },
                    { step: "5", title: "Revitalize", desc: "Optimize longevity and maintain peak cellular performance.", icon: Leaf }
                  ].map((r, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-950 bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span className="text-slate-950 font-bold">{r.step}</span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-sm group-hover:border-teal-500/50 transition-colors shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <r.icon className="h-5 w-5 text-teal-400" />
                          <h4 className="text-xl font-bold text-white">{r.title}</h4>
                        </div>
                        <p className="text-slate-400 text-sm">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Programs - Horizontal Rail */}
      <section className="py-24 bg-slate-900 border-y border-white/5 relative">
        <div className="container mx-auto px-6 lg:px-12 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Clinical Programs</h3>
              <p className="text-slate-400">Comprehensive, doctor-supervised protocols utilizing cutting-edge therapeutic modalities.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-slate-800 text-white hover:bg-slate-700 hover:text-cyan-400">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-slate-800 text-white hover:bg-slate-700 hover:text-cyan-400">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-12 pt-4">
          <div className="flex w-max space-x-6 px-6 lg:px-12">
            {[
              { title: "Live Blood Analysis", desc: "Real-time microscopic evaluation of blood terrain and cellular health.", icon: Microscope, color: "text-rose-400", img: "bg-gradient-to-br from-slate-800 to-slate-900" },
              { title: "IV Program", desc: "Targeted intravenous nutrition and therapeutic compounds for rapid absorption.", icon: Droplets, color: "text-cyan-400", img: "bg-gradient-to-br from-slate-800 to-slate-900" },
              { title: "Peptide Program", desc: "Precision signaling molecules to upregulate cellular repair and optimization.", icon: Network, color: "text-indigo-400", img: "bg-gradient-to-br from-slate-800 to-slate-900" },
              { title: "Custom Protocols", desc: "Personalized healing frameworks integrating the complete Allio ecosystem.", icon: Activity, color: "text-teal-400", img: "bg-gradient-to-br from-slate-800 to-slate-900" },
            ].map((program, i) => (
              <Card key={i} className={`w-[350px] shrink-0 border-white/10 bg-slate-950 overflow-hidden hover:border-cyan-500/30 transition-all duration-300 group`}>
                <div className={`h-40 ${program.img} border-b border-white/5 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <program.icon className={`h-16 w-16 ${program.color} opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                </div>
                <CardContent className="p-8">
                  <h4 className="text-xl font-bold text-white mb-3">{program.title}</h4>
                  <p className="text-slate-400 mb-6 text-sm leading-relaxed whitespace-normal h-10">{program.desc}</p>
                  <Button variant="link" className="p-0 text-cyan-400 hover:text-cyan-300 h-auto font-semibold">
                    Explore Program <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="bg-slate-800/50" />
        </ScrollArea>
      </section>

      {/* Product Categories */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-12 text-center max-w-4xl mb-16">
          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-4">Apothecary</Badge>
          <h3 className="text-3xl lg:text-5xl font-bold text-white mb-6">Advanced Therapeutics</h3>
          <p className="text-slate-400 text-lg">Members gain access to our curated formulary of pharmaceutical-grade regenerative compounds and advanced biologicals.</p>
        </div>

        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Peptides & Bioregulators", icon: Dna },
              { name: "MitoStac", icon: Zap },
              { name: "Exosomes", icon: Atom },
              { name: "Vitamins & Minerals", icon: Pill },
              { name: "Quantum Devices", icon: Activity },
              { name: "Stem Cell Biologics", icon: Network },
              { name: "ECS Support", icon: Brain }
            ].map((cat, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-4 rounded-full border border-white/10 bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer group">
                <cat.icon className="h-5 w-5 text-slate-400 group-hover:text-cyan-400" />
                <span className="font-medium text-slate-200 group-hover:text-white">{cat.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Button className="bg-transparent border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-bold px-8 h-12 rounded-xl">
              View Full Formulary
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-900 border-t border-white/5">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { quote: "The constitutional framework provides immense peace of mind. For the first time in years, I can practice medicine the way I was trained to—focusing purely on patient outcomes.", author: "Dr. Sarah M.", role: "PMA Partner Clinic" },
              { quote: "Integrating the 5R protocols into my practice transformed our success rates with complex chronic cases. The peptide access alone is worth the membership.", author: "Dr. James L.", role: "Integrative Physician" },
              { quote: "After years of being told there was nothing wrong with me by the standard system, the Forgotten Formula approach actually looked at my cellular health and found the root.", author: "Michael R.", role: "PMA Member" }
            ].map((test, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-950 border border-white/5 relative">
                <div className="absolute top-8 right-8 text-slate-800">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14.017 21L16.417 14.58C16.5352 14.2642 16.595 13.928 16.593 13.588V6H22.593V13.588L19.742 21H14.017ZM3.188 21L5.588 14.58C5.70617 14.2642 5.76602 13.928 5.764 13.588V6H11.764V13.588L8.913 21H3.188Z" />
                  </svg>
                </div>
                <div className="flex gap-1 mb-6 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed relative z-10">"{test.quote}"</p>
                <div>
                  <p className="font-bold text-white">{test.author}</p>
                  <p className="text-sm text-cyan-400">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="py-32 relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-teal-900/20 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-6 lg:px-12 relative z-10 text-center max-w-3xl">
          <Shield className="h-16 w-16 text-cyan-500 mx-auto mb-8 opacity-80" />
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">Step Into The Private Domain</h2>
          <p className="text-xl text-slate-400 mb-12 font-light">Join the Forgotten Formula PMA today and take back control of your health, your practice, and your medical freedom.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-16 px-10 text-xl rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              Apply for Membership
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-xl rounded-xl border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:text-white backdrop-blur-md">
              Clinic Partnership
            </Button>
          </div>
          
          <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-500" />
              <span>1st & 14th Amendment Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-500" />
              <span>Private Member Association</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-500" />
              <span>HIPAA Exempt</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
