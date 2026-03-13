import './_group.css';
import { Shield, Dna, Heart, Users, Target, Droplets, Network, Waves, Microscope, Syringe, Pill, Activity, Atom, Brain, Zap, Leaf, Star, ChevronRight, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HorizontalFlow() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans overflow-x-hidden dark selection:bg-teal-500/30">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-serif text-xl font-bold tracking-wide">Forgotten Formula PMA</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#framework" className="hover:text-emerald-400 transition-colors">5 Rs Framework</a>
          <a href="#programs" className="hover:text-emerald-400 transition-colors">Programs</a>
          <a href="#products" className="hover:text-emerald-400 transition-colors">Products</a>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">Member Login</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-[0_0_20px_rgba(245,158,11,0.3)]">Become a Member</Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12 px-8 md:px-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-950/70 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
          <img 
            src="/__mockup/images/hero-bg.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          {/* Cinematic lighting effects */}
          <div className="absolute top-1/4 -left-[20%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-[10%] w-[30%] h-[40%] bg-teal-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        </div>

        <div className="relative z-20 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/50 mb-8 backdrop-blur-sm">
            <Atom className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium tracking-wide text-emerald-300 uppercase">Powered by Allio v1 - The All-in-One Healing Ecosystem</span>
          </div>
          
          <h1 className="font-serif text-6xl md:text-8xl font-bold leading-[1.1] mb-8 text-white drop-shadow-lg">
            Protected Healing. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Root Cause Solutions.
            </span>
          </h1>
          
          <p className="text-xl md:text-3xl text-slate-300 font-light max-w-3xl leading-relaxed mb-12 border-l-4 border-emerald-500 pl-6 py-2">
            "Your Why Should Make You Cry. We Protect the Good, the Caring, and Support Curing Over Profits."
          </p>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12">
            A collection of like-minded Doctors, Clinics, and everyday Americans protected by the Constitution.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Button size="lg" className="h-16 px-10 text-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-[0_0_30px_rgba(245,158,11,0.2)] rounded-full transition-all hover:scale-105">
              Become a Member <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg border-slate-700 text-white hover:bg-slate-800 rounded-full">
              For Doctors
            </Button>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="relative z-30 -mt-16 mx-8 md:mx-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-wrap justify-around gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">12,500+</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Members</div>
        </div>
        <div className="w-px h-16 bg-slate-800 hidden md:block"></div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">340</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Partner Clinics</div>
        </div>
        <div className="w-px h-16 bg-slate-800 hidden md:block"></div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">150+</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Products</div>
        </div>
        <div className="w-px h-16 bg-slate-800 hidden md:block"></div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">24</div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">Programs</div>
        </div>
      </section>

      {/* FEATURES (Horizontal Narrative) */}
      <section id="features" className="min-h-screen py-32 px-8 md:px-16 flex flex-col justify-center">
        <div className="mb-20">
          <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">Core Pillars</h2>
          <h3 className="font-serif text-5xl md:text-6xl text-white font-bold max-w-2xl leading-tight">
            The foundation of a new healthcare paradigm.
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-12 overflow-x-auto pb-12 snap-x hide-scrollbar">
          {[
            { icon: Shield, title: "Constitutional Protection", desc: "Operate outside the broken system under first amendment rights, protecting both practitioners and members." },
            { icon: Target, title: "Root Cause Medicine", desc: "We don't mask symptoms. We identify and resolve the underlying biological imbalances." },
            { icon: Heart, title: "Holistic Healing", desc: "Integrating mind, body, and spirit protocols to support the body's natural regenerative capacity." },
            { icon: Users, title: "Member Community", desc: "A powerful network of like-minded individuals supporting each other on the path to true wellness." }
          ].map((feature, i) => (
            <div key={i} className="flex-none w-full md:w-[400px] snap-center group">
              <div className="h-full p-10 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
                <feature.icon className="w-12 h-12 text-emerald-400 mb-8" strokeWidth={1.5} />
                <h4 className="text-2xl font-serif font-bold text-white mb-4">{feature.title}</h4>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5 RS FRAMEWORK (Horizontal Pipeline) */}
      <section id="framework" className="min-h-screen py-32 bg-slate-900 flex flex-col justify-center overflow-hidden">
        <div className="px-8 md:px-16 mb-24">
          <h2 className="text-teal-500 font-bold tracking-widest uppercase text-sm mb-4">Our Methodology</h2>
          <h3 className="font-serif text-5xl md:text-6xl text-white font-bold max-w-3xl leading-tight">
            The 5 Rs Framework for profound biological restoration.
          </h3>
        </div>

        <div className="relative w-full px-8 md:px-16">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-16 right-16 h-1 bg-slate-800 -translate-y-1/2 hidden lg:block z-0">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[80%]"></div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-8 relative z-10">
            {[
              { r: "Reduce", icon: Droplets, desc: "Eliminate toxic burden" },
              { r: "Rebalance", icon: Network, desc: "Restore homeostasis" },
              { r: "Reactivate", icon: Zap, desc: "Awaken cellular function" },
              { r: "Restore", icon: Activity, desc: "Repair damaged tissue" },
              { r: "Revitalize", icon: Leaf, desc: "Optimize longevity" }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center max-w-[200px] group relative">
                <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-800 group-hover:border-emerald-500 transition-colors flex items-center justify-center mb-6 shadow-xl relative z-10">
                  <step.icon className="w-10 h-10 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-lg">
                    {i + 1}
                  </div>
                </div>
                <h4 className="text-2xl font-serif font-bold text-white mb-3">{step.r}</h4>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS (Side-by-side cards with imagery) */}
      <section id="programs" className="py-32 px-8 md:px-16 min-h-screen flex flex-col justify-center">
        <div className="mb-20">
          <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">Clinical Offerings</h2>
          <h3 className="font-serif text-5xl md:text-6xl text-white font-bold mb-8">
            Advanced Clinical Programs.
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {[
            { 
              title: "Live Blood Analysis", 
              desc: "Real-time cellular observation to identify imbalances before they manifest as chronic conditions.",
              image: "/__mockup/images/program-blood.jpg",
              icon: Microscope
            },
            { 
              title: "IV Program", 
              desc: "Direct-to-cell nutrient delivery bypassing digestive limitations for immediate therapeutic impact.",
              image: "/__mockup/images/program-iv.jpg",
              icon: Syringe
            },
            { 
              title: "Peptide Program", 
              desc: "Targeted amino acid sequencing to trigger specific regenerative biological processes.",
              image: "/__mockup/images/program-peptides.jpg",
              icon: Dna
            },
            { 
              title: "Targeted Protocols", 
              desc: "Comprehensive, multi-modality approaches tailored to specific systemic dysfunctions.",
              image: "/__mockup/images/program-protocols.jpg",
              icon: Activity
            }
          ].map((program, i) => (
            <div key={i} className="flex flex-col md:flex-row bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden group hover:border-teal-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(20,184,166,0.1)]">
              <div className="w-full md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-all z-10"></div>
                <img src={program.image} alt={program.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
                <program.icon className="w-8 h-8 text-teal-400 mb-6" />
                <h4 className="text-3xl font-serif font-bold text-white mb-4">{program.title}</h4>
                <p className="text-slate-400 leading-relaxed mb-8">{program.desc}</p>
                <a href="#" className="inline-flex items-center text-teal-400 font-semibold hover:text-teal-300">
                  Explore Program <ChevronRight className="w-5 h-5 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS (Compact Tag Grid) */}
      <section id="products" className="py-32 bg-slate-950 min-h-[70vh] flex flex-col justify-center items-center text-center relative border-t border-slate-900">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl px-8">
          <Pill className="w-16 h-16 text-emerald-500 mx-auto mb-8" strokeWidth={1} />
          <h2 className="text-emerald-500 font-bold tracking-widest uppercase text-sm mb-4">Therapeutics</h2>
          <h3 className="font-serif text-4xl md:text-5xl text-white font-bold mb-16 leading-tight">
            Curated precision therapeutics for optimal cellular performance.
          </h3>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Peptides & Bioregulators", 
              "MitoStac", 
              "Exosomes", 
              "Vitamins & Minerals", 
              "Quantum Devices", 
              "Stem Cell Biologics", 
              "ECS Support"
            ].map((cat, i) => (
              <div key={i} className="px-6 py-4 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-full text-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500" />
                {cat}
              </div>
            ))}
          </div>
          
          <div className="mt-16">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full px-8 h-12">
              View Complete Formulary
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32 px-8 md:px-16 bg-slate-900">
        <div className="mb-20">
          <h2 className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-4">Voices of Healing</h2>
          <h3 className="font-serif text-5xl md:text-6xl text-white font-bold">
            The impact of true medicine.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { quote: "Joining the PMA allowed me to practice medicine the way I was originally taught—focusing on the root cause without bureaucratic interference.", author: "Dr. Sarah M.", role: "Functional Medicine Practitioner" },
            { quote: "The 5 Rs framework completely transformed our clinic's approach to chronic illness. We're seeing recovery rates we previously thought impossible.", author: "Dr. James L.", role: "Integrative Oncologist" },
            { quote: "After years of being told my condition was 'normal for my age,' the targeted peptide protocol gave me my life back in just 6 months.", author: "Michael R.", role: "PMA Member" }
          ].map((test, i) => (
            <div key={i} className="bg-slate-950 p-10 rounded-3xl border border-slate-800 relative">
              <Star className="w-8 h-8 text-amber-500 mb-8" fill="currentColor" />
              <p className="text-xl text-slate-300 font-light italic leading-relaxed mb-8">
                "{test.quote}"
              </p>
              <div>
                <div className="font-bold text-white text-lg">{test.author}</div>
                <div className="text-emerald-500 text-sm">{test.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="py-32 px-8 md:px-16 bg-slate-950 border-t border-slate-900 flex flex-col items-center text-center">
        <Shield className="w-16 h-16 text-slate-700 mb-8" />
        <h2 className="font-serif text-4xl md:text-6xl text-white font-bold mb-8 max-w-3xl leading-tight">
          Ready to step into the future of sovereign healthcare?
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-16">
          <Button size="lg" className="h-16 px-12 text-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-[0_0_30px_rgba(245,158,11,0.2)] rounded-full transition-all hover:scale-105">
            Become a Member
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-12 text-lg border-slate-700 text-white hover:bg-slate-800 rounded-full">
            Contact Support
          </Button>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between w-full border-t border-slate-900 pt-8 text-slate-500 text-sm">
          <div>© 2026 Forgotten Formula PMA. All rights reserved.</div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-emerald-400">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-400">Terms of Service</a>
            <a href="#" className="hover:text-emerald-400">Member Agreement</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
