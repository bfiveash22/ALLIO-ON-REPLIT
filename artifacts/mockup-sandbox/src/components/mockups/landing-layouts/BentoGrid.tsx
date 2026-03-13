import React from "react";
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
  Check,
  Sparkles,
  ArrowUpRight,
  Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function BentoGrid() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100 p-4 md:p-8 font-sans selection:bg-violet-500/30">
      
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between py-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Forgotten Formula PMA</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">For Doctors</Button>
          <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">Member Login</Button>
          <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold">Become a Member</Button>
        </div>
      </nav>

      {/* Main Bento Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">
        
        {/* HERO CELL (span 8) */}
        <div className="md:col-span-8 md:row-span-3 rounded-3xl p-[1px] bg-gradient-to-br from-violet-500/30 via-transparent to-purple-500/10 group">
          <div className="h-full w-full rounded-[23px] bg-[#111116] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none -mr-32 -mt-32"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Powered by Allio v1 - The All-in-One Healing Ecosystem
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Health Freedom.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                  Protected by the Constitution.
                </span>
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
                A collection of like-minded Doctors, Clinics, and everyday Americans practicing root cause medicine outside the broken system.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 relative z-10">
              <Button size="lg" className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold px-8 h-14 rounded-xl text-lg">
                Become a Member
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl text-lg border-zinc-700 bg-transparent hover:bg-zinc-800">
                Explore Programs
              </Button>
            </div>
          </div>
        </div>

        {/* STATS CELLS (span 4 split into 2x2) */}
        <div className="md:col-span-4 md:row-span-1 grid grid-cols-2 gap-4">
          <div className="rounded-3xl bg-[#111116] border border-white/5 p-6 flex flex-col justify-center items-start relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Users className="w-6 h-6 text-violet-400 mb-3" />
            <div className="text-3xl font-bold mb-1">12,500+</div>
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Active Members</div>
          </div>
          <div className="rounded-3xl bg-[#111116] border border-white/5 p-6 flex flex-col justify-center items-start relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Network className="w-6 h-6 text-amber-400 mb-3" />
            <div className="text-3xl font-bold mb-1">142</div>
            <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Partner Clinics</div>
          </div>
        </div>

        {/* QUOTE CELL (span 4, row 2) */}
        <div className="md:col-span-4 md:row-span-2 rounded-3xl bg-gradient-to-br from-purple-900/40 to-[#111116] border border-purple-500/20 p-8 flex flex-col justify-center relative overflow-hidden">
          <Quote className="w-12 h-12 text-purple-500/30 absolute top-6 left-6" />
          <div className="relative z-10">
            <p className="text-2xl font-serif italic leading-snug mb-6 text-purple-50">
              "Your Why Should Make You Cry. We Protect the Good, the Caring, and Support Curing Over Profits."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Shield className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <div className="font-semibold text-white">FFPMA Mission</div>
                <div className="text-xs text-purple-300/70">Founding Principle</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5Rs FRAMEWORK CELL (span 4, row 3) */}
        <div className="md:col-span-6 md:row-span-2 rounded-3xl bg-[#111116] border border-white/5 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              The 5 R's Framework
            </h3>
          </div>
          <div className="grid grid-cols-5 gap-2 flex-grow">
            {[
              { name: "Reduce", icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-400/10" },
              { name: "Rebalance", icon: Waves, color: "text-orange-400", bg: "bg-orange-400/10" },
              { name: "Reactivate", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
              { name: "Restore", icon: Heart, color: "text-green-400", bg: "bg-green-400/10" },
              { name: "Revitalize", icon: Sparkles, color: "text-violet-400", bg: "bg-violet-400/10" }
            ].map((r, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className={`w-12 h-12 rounded-full ${r.bg} flex items-center justify-center`}>
                  <r.icon className={`w-6 h-6 ${r.color}`} />
                </div>
                <span className="text-xs font-medium text-zinc-400 text-center">{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES (span 6, row 2) */}
        <div className="md:col-span-6 md:row-span-2 grid grid-cols-2 gap-4">
          {[
            { title: "Constitutional Protection", icon: Shield, desc: "Legal safe harbor for practitioners and members." },
            { title: "Root Cause Medicine", icon: Microscope, desc: "Treating the source, not just the symptoms." },
            { title: "Holistic Healing", icon: Leaf, desc: "Integrating mind, body, and spiritual wellness." },
            { title: "Member Community", icon: Users, desc: "Connect with like-minded individuals." }
          ].map((f, i) => (
            <div key={i} className="rounded-3xl bg-[#111116] border border-white/5 p-6 hover:border-violet-500/30 transition-colors group">
              <f.icon className="w-8 h-8 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
              <div className="font-semibold text-lg mb-2">{f.title}</div>
              <div className="text-sm text-zinc-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* PROGRAMS & PRODUCTS TITLE STRIP (span 12) */}
        <div className="md:col-span-12 md:row-span-1 flex items-end pb-4 pt-8">
          <h2 className="text-3xl font-bold tracking-tight">Our Healing Ecosystem</h2>
        </div>

        {/* PROGRAMS BENTO (span 4, tall) */}
        <div className="md:col-span-4 md:row-span-4 rounded-3xl bg-[#111116] border border-white/5 p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#f59e0b]" />
            Core Programs
          </h3>
          <div className="flex flex-col gap-4 flex-grow">
            {[
              { name: "Live Blood Analysis", icon: Droplets, color: "text-red-400" },
              { name: "IV Program", icon: Syringe, color: "text-blue-400" },
              { name: "Peptide Program", icon: Dna, color: "text-violet-400" },
              { name: "Protocols", icon: Check, color: "text-emerald-400" }
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-[#0a0a0f] flex items-center justify-center shadow-inner">
                  <p.icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <div className="font-medium flex-grow">{p.name}</div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
          <Button className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white">View All Programs</Button>
        </div>

        {/* PRODUCT CATEGORIES (span 8, dense grid) */}
        <div className="md:col-span-8 md:row-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Peptides & Bioregulators", icon: Dna },
            { name: "MitoStac", icon: Zap },
            { name: "Exosomes", icon: Atom },
            { name: "Vitamins & Minerals", icon: Pill },
            { name: "Quantum Devices", icon: Activity },
            { name: "Stem Cell Biologics", icon: Shield },
            { name: "ECS Support", icon: Brain }
          ].map((cat, i) => (
            <div key={i} className={`rounded-3xl bg-[#111116] border border-white/5 p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-violet-500/30 transition-all cursor-pointer hover:-translate-y-1 ${i === 6 ? 'md:col-span-2' : ''}`}>
              <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="font-medium text-sm text-zinc-300">{cat.name}</span>
            </div>
          ))}
          
          <div className="rounded-3xl bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/30 p-6 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-[#f59e0b]/30 transition-all">
            <div className="font-bold text-amber-500 text-lg">Shop<br/>All Products</div>
            <ArrowUpRight className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        {/* TESTIMONIALS TITLE (span 12) */}
        <div className="md:col-span-12 md:row-span-1 flex items-end pb-4 pt-8">
          <h2 className="text-3xl font-bold tracking-tight">Voices of the Network</h2>
        </div>

        {/* TESTIMONIAL CELLS (3 cells, span 4 each) */}
        {[
          { name: "Dr. Sarah M.", role: "PMA Doctor", text: "Moving to the FFPMA model allowed me to practice true medicine again without the fear of board retaliation." },
          { name: "Dr. James L.", role: "Clinic Director", text: "The Allio ecosystem streamlines everything. Live blood analysis combined with targeted peptides has transformed our clinic." },
          { name: "Michael R.", role: "PMA Member", text: "Finally, a healthcare community that focuses on curing rather than keeping me as a lifetime customer." }
        ].map((t, i) => (
          <div key={i} className="md:col-span-4 md:row-span-2 rounded-3xl bg-[#111116] border border-white/5 p-8 flex flex-col justify-between">
            <div className="flex gap-1 mb-6">
              {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-amber-500 text-amber-500" />)}
            </div>
            <p className="text-zinc-300 leading-relaxed mb-8 flex-grow">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-white text-sm">{t.name}</div>
                <div className="text-xs text-zinc-500">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
        
        {/* BOTTOM CTA CELL (span 12) */}
        <div className="md:col-span-12 md:row-span-2 rounded-[32px] bg-gradient-to-r from-violet-600 to-purple-600 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between mt-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 max-w-2xl mb-8 md:mb-0">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to step outside the system?</h2>
            <p className="text-violet-100 text-lg">Join thousands of Americans and practitioners protected by the Constitution.</p>
          </div>
          <div className="relative z-10 flex gap-4 w-full md:w-auto">
            <Button size="lg" className="bg-white text-violet-900 hover:bg-zinc-100 font-bold px-8 h-14 rounded-xl text-lg w-full md:w-auto">
              Join FFPMA
            </Button>
          </div>
        </div>

      </main>

      <footer className="max-w-7xl mx-auto py-12 mt-12 border-t border-white/10 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Forgotten Formula Private Membership Association. All rights reserved.</p>
      </footer>
    </div>
  );
}
