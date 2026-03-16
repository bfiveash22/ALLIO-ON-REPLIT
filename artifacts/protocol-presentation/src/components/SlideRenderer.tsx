import { useState, useEffect, useRef } from "react";
import type { SlideData } from "../lib/types";

function TitleSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center relative" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}assets/ff_pma_white_blue_helix.png`} alt="Forgotten Formula PMA" className="h-12 w-12 object-contain" />
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm">Forgotten Formula PMA</span>
          <span className="text-[#FFD700] text-[10px] font-medium">&times; ALLIO</span>
        </div>
      </div>
      <div className="absolute top-8 right-8 flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center p-1">
          <img src={`${import.meta.env.BASE_URL}assets/ff_pma_white_blue_helix.png`} alt="Forgotten Formula PMA" className="w-full h-full object-contain" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center p-1">
          <img src={`${import.meta.env.BASE_URL}assets/ff_pma_black_blue_helix.png`} alt="Forgotten Formula Black Helix" className="w-full h-full object-contain" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center p-1">
          <img src={`${import.meta.env.BASE_URL}assets/ff_pma_allio_combined_logo.png`} alt="Forgotten Formula PMA & Allio Combined" className="w-full h-full object-contain" />
        </div>
      </div>
      <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">Member Protocol 2026</h1>
      <div className="w-24 h-1 bg-[#00D4AA] mb-6 rounded-full" />
      <p className="text-2xl text-[#00D4AA] mb-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        {slide.content.patientName}
      </p>
      <p className="text-lg text-gray-400 animate-fade-in" style={{ animationDelay: "0.4s" }}>
        Prepared by: FF Trustee {slide.content.trustee}
      </p>
      <p className="absolute bottom-12 text-gray-500 italic text-sm max-w-xl">
        "Before you heal someone, ask them if they're willing to give up the things that make them sick"
      </p>
    </div>
  );
}

function SummarySlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-12 flex flex-col" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-8 animate-fade-in">{slide.title}</h2>
      <div className="flex-1 grid grid-cols-2 gap-6">
        {slide.content.points?.map((point: string, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="w-8 h-8 rounded-full bg-[#00D4AA]/20 flex items-center justify-center mb-3">
              <span className="text-[#00D4AA] font-bold text-sm">{i + 1}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
      {slide.content.quote && (
        <p className="text-center text-gray-500 italic text-sm mt-6">"{slide.content.quote}"</p>
      )}
    </div>
  );
}

function MemberInfoSlide({ slide }: { slide: SlideData }) {
  const c = slide.content;
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-6 text-sm">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-[#00D4AA] font-semibold mb-3">Current Diagnoses</h3>
          {c.diagnoses?.map((d: string, i: number) => (
            <p key={i} className="text-gray-300 mb-1 pl-3 border-l-2 border-[#FFD700]/30">{d}</p>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-[#00D4AA] font-semibold mb-3">Chief Complaints</h3>
          {c.complaints?.map((cc: string, i: number) => (
            <p key={i} className="text-gray-300 mb-1 pl-3 border-l-2 border-red-400/30">{cc}</p>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-[#00D4AA] font-semibold mb-3">Goals</h3>
          {c.goals?.map((g: string, i: number) => (
            <p key={i} className="text-gray-300 mb-1 pl-3 border-l-2 border-[#00D4AA]/30">{g}</p>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="text-[#00D4AA] font-semibold mb-3">Surgical History</h3>
          {c.surgicalHistory?.map((s: string, i: number) => (
            <p key={i} className="text-gray-300 mb-1 pl-3 border-l-2 border-gray-500/30">{s}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineSlide({ slide }: { slide: SlideData }) {
  const events = slide.content.events || [];
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#00D4AA]/30" />
        {events.map((ev: any, i: number) => (
          <div key={i} className="relative mb-4 animate-slide-left" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-[#00D4AA] border-2 border-[#0A1628]" />
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 ml-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[#FFD700] font-semibold text-xs">{ev.ageRange}</span>
                {ev.year && <span className="text-gray-500 text-xs">({ev.year})</span>}
              </div>
              <p className="text-gray-300 text-sm">{ev.event}</p>
              <p className="text-gray-500 text-xs mt-1 italic">{ev.significance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrusteeThoughtsSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}assets/ff_pma_white_blue_helix.png`} alt="Forgotten Formula PMA" className="h-12 w-12 object-contain" />
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm">Forgotten Formula PMA</span>
          <span className="text-[#FFD700] text-[10px] font-medium">&times; ALLIO</span>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-white mb-8">Michael's Thoughts</h2>
      <div className="max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-8">
        <p className="text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{slide.content.notes}</p>
      </div>
      <p className="absolute bottom-12 text-gray-500 italic text-sm">
        "Before you heal someone, ask them if they're willing to give up the things that make them sick"
      </p>
    </div>
  );
}

function RootCausesSlide({ slide }: { slide: SlideData }) {
  const causes = slide.content.causes || [];
  const colors = ["#FF6B6B", "#FFD700", "#00D4AA", "#4DA6FF", "#B47EFF", "#FF9F43"];
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {causes.map((rc: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-scale-in" style={{ animationDelay: `${i * 0.1}s`, borderLeftColor: colors[i % colors.length], borderLeftWidth: 4 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: colors[i % colors.length] + "30", color: colors[i % colors.length] }}>
                {rc.rank}
              </span>
              <h3 className="text-white font-semibold text-sm">{rc.cause}</h3>
            </div>
            <p className="text-[#00D4AA] text-xs mb-1">{rc.category}</p>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{rc.details}</p>
            {rc.relatedSymptoms?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {rc.relatedSymptoms.slice(0, 3).map((s: string, j: number) => (
                  <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{s}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FiveStagesSlide({ slide }: { slide: SlideData }) {
  const stages = slide.content.stages || [];
  const icons = ["🛡️", "⚖️", "⚡", "❤️", "☀️"];
  const colors = ["#FF6B6B", "#FFD700", "#00D4AA", "#FF69B4", "#4DA6FF"];
  return (
    <div className="h-full p-10 flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-10">{slide.title}</h2>
      <div className="flex items-center gap-4">
        {stages.map((stage: any, i: number) => (
          <div key={i} className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-3 border-2" style={{ borderColor: colors[i], background: colors[i] + "15" }}>
              {icons[i]}
            </div>
            <h3 className="text-white font-bold text-sm mb-1">{stage.name}</h3>
            <p className="text-gray-400 text-xs text-center max-w-[140px]">{stage.description}</p>
            {i < stages.length - 1 && (
              <div className="absolute" style={{ left: `calc(${(i + 0.5) * 20}% + 40px)`, top: "50%" }}>
                <span className="text-gray-600">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhasesSlide({ slide }: { slide: SlideData }) {
  const phases = slide.content.phases || [];
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {phases.map((phase: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-[#00D4AA]/20 flex items-center justify-center text-[#00D4AA] font-bold text-sm">{phase.phaseNumber}</span>
              <h3 className="text-white font-semibold">{phase.name}</h3>
            </div>
            <p className="text-[#FFD700] text-xs mb-2">{phase.weekRange}</p>
            <p className="text-gray-400 text-xs mb-3">{phase.focus}</p>
            <ul className="space-y-1">
              {phase.keyActions?.slice(0, 4).map((a: string, j: number) => (
                <li key={j} className="text-gray-300 text-xs pl-3 border-l border-[#00D4AA]/20">• {a}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function DailyScheduleSlide({ slide }: { slide: SlideData }) {
  const items = slide.content.items || [];
  const evening = slide.content.evening || [];
  const bedtime = slide.content.bedtime || [];
  const allItems = items.length > 0 ? items : [...evening, ...bedtime];
  const periodColors: Record<string, string> = { morning: "#FFD700", midday: "#00D4AA", evening: "#4DA6FF", bedtime: "#B47EFF" };
  const period = slide.content.period || (evening.length > 0 ? "evening" : "morning");
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="space-y-3">
        {evening.length > 0 && <h3 className="text-[#4DA6FF] font-semibold text-sm mb-2">Evening</h3>}
        {(items.length > 0 ? items : evening).map((item: any, i: number) => (
          <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-lg p-3 animate-slide-left" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="min-w-[70px] text-right">
              <span className="text-xs font-mono" style={{ color: periodColors[period] || "#00D4AA" }}>{item.time}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{item.item}</p>
              {item.details && <p className="text-gray-400 text-xs mt-0.5">{item.details}</p>}
              {item.frequency && <span className="text-[#FFD700] text-xs">{item.frequency}</span>}
            </div>
          </div>
        ))}
        {bedtime.length > 0 && (
          <>
            <h3 className="text-[#B47EFF] font-semibold text-sm mb-2 mt-4">Bedtime</h3>
            {bedtime.map((item: any, i: number) => (
              <div key={`bed-${i}`} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-lg p-3 animate-slide-left" style={{ animationDelay: `${(evening.length + i) * 0.08}s` }}>
                <div className="min-w-[70px] text-right">
                  <span className="text-xs font-mono text-[#B47EFF]">{item.time}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{item.item}</p>
                  {item.details && <p className="text-gray-400 text-xs mt-0.5">{item.details}</p>}
                  {item.frequency && <span className="text-[#FFD700] text-xs">{item.frequency}</span>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function InjectablePeptidesSlide({ slide }: { slide: SlideData }) {
  const peptides = slide.content.peptides || [];
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {peptides.map((p: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <h3 className="text-[#00D4AA] font-bold text-sm mb-1">{p.name}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
              <p className="text-gray-400">Vial: <span className="text-gray-300">{p.vialSize}</span></p>
              <p className="text-gray-400">Dose: <span className="text-gray-300">{p.dose}</span></p>
              <p className="text-gray-400">Freq: <span className="text-[#FFD700]">{p.frequency}</span></p>
              <p className="text-gray-400">Duration: <span className="text-gray-300">{p.duration}</span></p>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{p.purpose}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BioregulatorSlide({ slide }: { slide: SlideData }) {
  const brs = slide.content.bioregulators || [];
  const morning = brs.filter((b: any) => b.frequency?.includes("AM"));
  const evening = brs.filter((b: any) => b.frequency?.includes("PM"));
  return (
    <div className="h-full p-10 flex flex-col" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-8 flex-1">
        <div>
          <h3 className="text-[#FFD700] font-semibold mb-4">Morning</h3>
          {morning.map((b: any, i: number) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 mb-3 animate-slide-left" style={{ animationDelay: `${i * 0.1}s` }}>
              <p className="text-white font-medium text-sm">{b.name}</p>
              <p className="text-[#00D4AA] text-xs">Target: {b.targetOrgan}</p>
              <p className="text-gray-400 text-xs">{b.dose} | {b.duration}</p>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-[#B47EFF] font-semibold mb-4">Evening</h3>
          {evening.map((b: any, i: number) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 mb-3 animate-slide-right" style={{ animationDelay: `${i * 0.1}s` }}>
              <p className="text-white font-medium text-sm">{b.name}</p>
              <p className="text-[#00D4AA] text-xs">Target: {b.targetOrgan}</p>
              <p className="text-gray-400 text-xs">{b.dose} | {b.duration}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OralPeptidesSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="space-y-3">
        {slide.content.peptides?.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-10 h-10 rounded-full bg-[#00D4AA]/20 flex items-center justify-center text-[#00D4AA] font-bold text-sm">{i + 1}</div>
            <div className="flex-1">
              <p className="text-white font-medium">{p.name}</p>
              <p className="text-gray-400 text-xs">{p.dose} | {p.frequency} | {p.duration}</p>
            </div>
            <p className="text-gray-400 text-xs max-w-xs">{p.purpose}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplementsSlide({ slide }: { slide: SlideData }) {
  const supps = slide.content.supplements || [];
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-4">{slide.title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {supps.map((s: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
            <p className="text-[#00D4AA] font-medium text-xs">{s.name}</p>
            <p className="text-gray-300 text-xs">{s.dose}</p>
            <p className="text-gray-500 text-xs">{s.timing}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetoxSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {slide.content.detox?.map((d: any, i: number) => (
          <div key={i} className="bg-white/5 border border-[#FFD700]/20 rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <h3 className="text-[#FFD700] font-semibold text-sm mb-1">{d.name}</h3>
            <p className="text-gray-400 text-xs mb-1">{d.method} | {d.frequency}</p>
            <p className="text-gray-300 text-xs leading-relaxed line-clamp-4">{d.instructions}</p>
          </div>
        ))}
        {slide.content.parasiteProtocols?.length > 0 && (
          <div className="col-span-2 bg-white/5 border border-red-400/20 rounded-xl p-4">
            <h3 className="text-red-400 font-semibold text-sm mb-3">Parasite & Antiviral Protocols</h3>
            <div className="grid grid-cols-2 gap-3">
              {slide.content.parasiteProtocols.map((p: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-lg p-3">
                  <p className="text-white font-medium text-xs">{p.name}</p>
                  <p className="text-gray-400 text-xs">{p.dose} | {p.schedule}</p>
                  <p className="text-gray-500 text-xs">{p.purpose?.split(".")[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IVTherapiesSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {slide.content.iv?.map((iv: any, i: number) => (
          <div key={i} className="bg-white/5 border border-[#4DA6FF]/20 rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <h3 className="text-[#4DA6FF] font-semibold text-sm mb-1">{iv.name}</h3>
            <p className="text-gray-400 text-xs">{iv.frequency} | {iv.duration}</p>
            <p className="text-gray-300 text-xs mt-1">{iv.purpose}</p>
          </div>
        ))}
      </div>
      {slide.content.im?.length > 0 && (
        <>
          <h3 className="text-white font-semibold mb-3">IM Therapies</h3>
          <div className="grid grid-cols-2 gap-4">
            {slide.content.im.map((im: any, i: number) => (
              <div key={i} className="bg-white/5 border border-[#00D4AA]/20 rounded-xl p-4">
                <h3 className="text-[#00D4AA] font-semibold text-sm">{im.name}</h3>
                <p className="text-gray-400 text-xs">{im.dose} | {im.frequency}</p>
                <p className="text-gray-300 text-xs mt-1">{im.purpose}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MitoStacSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-8">{slide.title}</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {slide.content.benefits?.map((b: string, i: number) => (
          <div key={i} className="bg-white/5 border border-[#00D4AA]/30 rounded-xl p-4 text-center animate-scale-in animate-pulse-glow" style={{ animationDelay: `${i * 0.1}s` }}>
            <p className="text-[#00D4AA] font-semibold text-sm">{b}</p>
          </div>
        ))}
      </div>
      <div className="bg-white/5 border border-[#FFD700]/20 rounded-xl p-6 max-w-2xl">
        <h3 className="text-[#FFD700] font-semibold mb-3 text-center">Replaces</h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {slide.content.replaces?.map((r: string, i: number) => (
            <span key={i} className="px-3 py-1 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-xs font-medium">{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HBOTSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-8">{slide.title}</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-[#4DA6FF]/30 rounded-2xl p-6 text-center animate-scale-in">
          <p className="text-4xl font-bold text-[#4DA6FF]">{slide.content.pressure}</p>
          <p className="text-gray-400 text-sm mt-1">Pressure</p>
        </div>
        <div className="bg-white/5 border border-[#00D4AA]/30 rounded-2xl p-6 text-center animate-scale-in" style={{ animationDelay: "0.15s" }}>
          <p className="text-4xl font-bold text-[#00D4AA]">{slide.content.duration}</p>
          <p className="text-gray-400 text-sm mt-1">Per Session</p>
        </div>
        <div className="bg-white/5 border border-[#FFD700]/30 rounded-2xl p-6 text-center animate-scale-in" style={{ animationDelay: "0.3s" }}>
          <p className="text-4xl font-bold text-[#FFD700]">{slide.content.frequency}</p>
          <p className="text-gray-400 text-sm mt-1">Frequency</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-2xl">
        {slide.content.benefits?.map((b: string, i: number) => (
          <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-gray-300 text-xs">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DentalSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10" style={{ background: "linear-gradient(180deg, #0A1628 0%, #3D1A1A 50%, #0A1628 100%)" }}>
      <h2 className="text-3xl font-bold text-red-400 mb-6">{slide.title}</h2>
      <div className="space-y-4">
        {slide.content.recommendations?.map((r: any, i: number) => (
          <div key={i} className="bg-white/5 border border-red-400/30 rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <h3 className="text-red-300 font-semibold mb-2">{r.recommendation}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{r.details}</p>
          </div>
        ))}
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5 mt-4">
          <h3 className="text-red-400 font-bold mb-2">Mercury → Cell Pathogen Colonization Pathway</h3>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <span className="px-3 py-1 bg-red-500/20 rounded text-red-300">Amalgam</span>
            <span className="text-red-400">→</span>
            <span className="px-3 py-1 bg-red-500/20 rounded text-red-300">Mercury Vapor</span>
            <span className="text-red-400">→</span>
            <span className="px-3 py-1 bg-red-500/20 rounded text-red-300">Immune Suppression</span>
            <span className="text-red-400">→</span>
            <span className="px-3 py-1 bg-red-500/20 rounded text-red-300">Pathogen Colonization</span>
            <span className="text-red-400">→</span>
            <span className="px-3 py-1 bg-red-500/20 rounded text-red-300">Cancer Environment</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StemCellSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 flex flex-col items-center justify-center" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-8">{slide.title}</h2>
      <div className="max-w-3xl space-y-4">
        {slide.content.recommendations?.map((r: any, i: number) => (
          <div key={i} className="bg-white/5 border border-[#00D4AA]/20 rounded-xl p-6 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <h3 className="text-[#00D4AA] font-semibold mb-2">{r.recommendation}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{r.details}</p>
          </div>
        ))}
        <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 rounded-xl p-4 text-center">
          <p className="text-[#00D4AA] font-semibold">holisticcare.com</p>
          <p className="text-gray-400 text-sm">Stem Cell Concierge Services</p>
        </div>
      </div>
    </div>
  );
}

function DietSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="space-y-2">
        {slide.content.guidelines?.map((g: string, i: number) => (
          <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-lg p-3 animate-slide-left" style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="text-[#00D4AA] mt-0.5">●</span>
            <p className="text-gray-300 text-sm">{g}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlkalineChartSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-xl p-5">
          <h3 className="text-[#00D4AA] font-bold mb-3">Alkaline (Good)</h3>
          {slide.content.alkaline?.map((f: string, i: number) => (
            <p key={i} className="text-gray-300 text-sm mb-1">✓ {f}</p>
          ))}
        </div>
        <div className="bg-red-900/10 border border-red-400/20 rounded-xl p-5">
          <h3 className="text-red-400 font-bold mb-3">Acidic (Avoid)</h3>
          {slide.content.acidic?.map((f: string, i: number) => (
            <p key={i} className="text-gray-300 text-sm mb-1">✗ {f}</p>
          ))}
        </div>
        <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl p-5">
          <h3 className="text-[#FFD700] font-bold mb-3">Superfoods</h3>
          {slide.content.superfoods?.map((f: string, i: number) => (
            <p key={i} className="text-gray-300 text-sm mb-1">★ {f}</p>
          ))}
        </div>
      </div>
      <p className="text-gray-500 text-xs mt-4 italic text-center">
        Always eat foods with seeds. Try and start a garden with landrace seeds — seeds not genetically modified by man.
      </p>
    </div>
  );
}

function LabsSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-2">
        {slide.content.labs?.map((lab: string, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className="text-gray-300 text-sm">📋 {lab}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowUpSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="space-y-3">
        {slide.content.plan?.map((f: any, i: number) => (
          <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-lg p-4 animate-slide-left" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="min-w-[80px] text-center">
              <span className="text-2xl font-bold text-[#00D4AA]">{f.weekNumber}</span>
              <p className="text-gray-500 text-xs">Week</p>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{f.action}</p>
              {f.details && <p className="text-gray-400 text-xs mt-0.5">{f.details}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10 overflow-auto" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="space-y-3">
        {slide.content.citations?.map((c: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <p className="text-[#00D4AA] font-medium text-sm">{c.title}</p>
            <p className="text-gray-400 text-xs">{c.authors?.slice(0, 3).join(", ")}{c.authors?.length > 3 ? " et al." : ""}</p>
            <div className="flex gap-4 mt-1">
              {c.journal && <span className="text-gray-500 text-xs italic">{c.journal}</span>}
              {c.year && <span className="text-gray-500 text-xs">{c.year}</span>}
              {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#4DA6FF] text-xs underline">View</a>}
            </div>
          </div>
        ))}
        {(!slide.content.citations || slide.content.citations.length === 0) && (
          <p className="text-gray-400 text-sm">Research citations will be populated when the protocol is finalized.</p>
        )}
      </div>
    </div>
  );
}

function DriveLinksSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="h-full p-10" style={{ background: "linear-gradient(180deg, #0A1628 0%, #1A2D47 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-6">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        {slide.content.links?.map((link: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#4DA6FF]">📁</span>
              <p className="text-white font-medium text-sm">{link.title}</p>
            </div>
            <p className="text-gray-500 text-xs">{link.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitmentSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <div className="absolute top-8 left-8 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}assets/ff_pma_white_blue_helix.png`} alt="Forgotten Formula PMA" className="h-12 w-12 object-contain" />
        <div className="flex flex-col">
          <span className="text-white font-semibold text-sm">Forgotten Formula PMA</span>
          <span className="text-[#FFD700] text-[10px] font-medium">&times; ALLIO</span>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-[#FFD700] mb-8 animate-fade-in">{slide.title}</h2>
      <div className="max-w-3xl bg-white/5 border border-[#FFD700]/20 rounded-2xl p-8 animate-scale-in">
        <p className="text-gray-300 text-base leading-relaxed">{slide.content.message}</p>
      </div>
      <div className="absolute bottom-8 flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center p-1">
          <img src={`${import.meta.env.BASE_URL}assets/ff_pma_white_blue_helix.png`} alt="Forgotten Formula PMA" className="w-full h-full object-contain" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center p-1">
          <img src={`${import.meta.env.BASE_URL}assets/ff_pma_black_blue_helix.png`} alt="Forgotten Formula Black Helix" className="w-full h-full object-contain" />
        </div>
        <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/15 overflow-hidden flex items-center justify-center p-1">
          <img src={`${import.meta.env.BASE_URL}assets/ff_pma_allio_combined_logo.png`} alt="Forgotten Formula PMA & Allio Combined" className="w-full h-full object-contain" />
        </div>
      </div>
      <p className="absolute bottom-28 text-gray-500 italic text-sm">
        "Before you heal someone, ask them if they're willing to give up the things that make them sick"
      </p>
    </div>
  );
}

function AnimatedCounter({ value, suffix, label, color, delay }: { value: number; suffix?: string; label: string; color: string; delay: number }) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 40;
      const increment = value / steps;
      let current = 0;
      intervalRef.current = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [value, delay]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center animate-scale-in" style={{ animationDelay: `${delay}ms` }}>
      <p className="text-4xl font-bold" style={{ color }}>{count}{suffix}</p>
      <p className="text-gray-400 text-sm mt-2">{label}</p>
    </div>
  );
}

function EcosystemSlide({ slide }: { slide: SlideData }) {
  const capabilities = slide.content.capabilities || [];
  const icons: Record<string, string> = {
    "Protocol Assembly": "🧬",
    "Research Engine": "🔬",
    "Member Portal": "👤",
    "Trustee Dashboard": "📊",
    "Drive Library": "📁",
    "Intake System": "📋",
    "Lab Tracking": "🧪",
    "Slide Generator": "📑",
    "PDF Protocols": "📄",
    "AI Analysis": "🤖",
  };
  return (
    <div className="h-full p-10 flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full border-2 border-[#00D4AA] flex items-center justify-center">
          <span className="text-[#00D4AA] font-bold text-xl">FF</span>
        </div>
        <span className="text-gray-600 text-2xl">+</span>
        <div className="w-14 h-14 rounded-full border-2 border-[#FFD700] flex items-center justify-center">
          <span className="text-[#FFD700] font-bold text-lg">ALLIO</span>
        </div>
      </div>
      <h2 className="text-3xl font-bold text-white mb-3 animate-fade-in">{slide.title}</h2>
      <p className="text-gray-400 text-sm mb-8 max-w-xl text-center">
        The ALLIO AI ecosystem powers every aspect of your healing journey — from protocol generation to research validation to progress tracking.
      </p>
      {slide.content.stats && (
        <div className="grid grid-cols-4 gap-4 mb-8 w-full max-w-3xl">
          {slide.content.stats.map((stat: { value: number; suffix?: string; label: string; color: string }, i: number) => (
            <AnimatedCounter key={i} value={stat.value} suffix={stat.suffix} label={stat.label} color={stat.color} delay={i * 200} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-5 gap-3 max-w-4xl">
        {capabilities.map((cap: string, i: number) => (
          <div key={i} className="bg-white/5 border border-[#00D4AA]/20 rounded-xl p-4 text-center animate-scale-in hover:bg-white/10 transition-all" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="text-2xl mb-2 block">{icons[cap] || "⚙️"}</span>
            <p className="text-gray-300 text-xs font-medium">{cap}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextStepsSlide({ slide }: { slide: SlideData }) {
  const steps = slide.content.steps || [];
  return (
    <div className="h-full p-10 flex flex-col" style={{ background: "linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)" }}>
      <h2 className="text-3xl font-bold text-white mb-2 animate-fade-in">{slide.title}</h2>
      <p className="text-gray-400 text-sm mb-8">{slide.content.subtitle || "Your immediate action items to begin healing"}</p>
      <div className="flex-1 grid grid-cols-2 gap-4">
        {steps.map((step: { number: number; title: string; description: string; urgency: string }, i: number) => {
          const urgencyColors: Record<string, string> = { urgent: "#FF6B6B", high: "#FFD700", medium: "#00D4AA", normal: "#4DA6FF" };
          const color = urgencyColors[step.urgency] || "#00D4AA";
          return (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-slide-left" style={{ animationDelay: `${i * 0.12}s`, borderLeftColor: color, borderLeftWidth: 4 }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: color + "20", color }}>
                  {step.number}
                </div>
                <h3 className="text-white font-semibold text-sm">{step.title}</h3>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">{step.description}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: color + "15", color }}>
                {step.urgency}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        <p className="text-[#00D4AA] text-sm font-medium">Your ALLIO team is with you every step of the way.</p>
        <p className="text-gray-500 text-xs mt-1">Contact your Trustee for questions or schedule adjustments.</p>
      </div>
    </div>
  );
}

const SLIDE_RENDERERS: Record<string, React.FC<{ slide: SlideData }>> = {
  "title": TitleSlide,
  "summary": SummarySlide,
  "member-info": MemberInfoSlide,
  "timeline": TimelineSlide,
  "trustee-thoughts": TrusteeThoughtsSlide,
  "root-causes": RootCausesSlide,
  "five-stages": FiveStagesSlide,
  "phases": PhasesSlide,
  "daily-schedule": DailyScheduleSlide,
  "injectable-peptides": InjectablePeptidesSlide,
  "bioregulators": BioregulatorSlide,
  "oral-peptides": OralPeptidesSlide,
  "supplements": SupplementsSlide,
  "detox": DetoxSlide,
  "iv-therapies": IVTherapiesSlide,
  "mitostac": MitoStacSlide,
  "hbot": HBOTSlide,
  "dental": DentalSlide,
  "stem-cells": StemCellSlide,
  "diet": DietSlide,
  "alkaline-chart": AlkalineChartSlide,
  "labs": LabsSlide,
  "follow-up": FollowUpSlide,
  "research": ResearchSlide,
  "drive-links": DriveLinksSlide,
  "commitment": CommitmentSlide,
  "ecosystem": EcosystemSlide,
  "next-steps": NextStepsSlide,
};

export default function SlideRenderer({ slide }: { slide: SlideData }) {
  const Component = SLIDE_RENDERERS[slide.type];
  if (!Component) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Unknown slide type: {slide.type}</p>
      </div>
    );
  }
  return <Component slide={slide} />;
}
