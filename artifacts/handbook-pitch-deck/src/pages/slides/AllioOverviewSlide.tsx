export default function AllioOverviewSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#1A0D40] via-[#251560] to-[#1A0D40]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_40%,rgba(102,68,187,0.15),transparent_55%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="text-center mb-[3vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[1.5vh]">
            The Agent Network
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8]">
            Meet ALLIO — 48 AI Agents, 7 Divisions
          </h2>
          <p className="font-body text-[1.6vw] text-[#B8A4E0]/60 mt-[1.5vh]">
            A self-evolving AI ecosystem purpose-built for the FFPMA
          </p>
        </div>

        <div className="flex-1 flex gap-[1.5vw] items-start mt-[1vh]">
          <div className="flex-1 bg-gradient-to-b from-[#D4A843]/10 to-transparent border border-[#D4A843]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#D4A843] mb-[1vh]">Medical Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">DR. FORMULA, Blood Analyst, ECS Profiler, Research agents — the clinical intelligence core</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#6644BB]/10 to-transparent border border-[#6644BB]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#6644BB] mb-[1vh]">Operations Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">Admin, scheduling, onboarding, communications — keeping the clinics running smoothly</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#8B6FCC]/10 to-transparent border border-[#8B6FCC]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#8B6FCC] mb-[1vh]">Legal Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">PMA compliance, document management, consent tracking, regulatory monitoring</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#B8A4E0]/10 to-transparent border border-[#B8A4E0]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#B8A4E0] mb-[1vh]">Engineering Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">Platform development, API maintenance, infrastructure, and security management</p>
          </div>
        </div>

        <div className="flex gap-[1.5vw] items-start mt-[1.5vh]">
          <div className="flex-1 bg-gradient-to-b from-[#D4A843]/8 to-transparent border border-[#D4A843]/15 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#E8C977] mb-[1vh]">Intelligence Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">Auto-enhancement, self-evolution, model routing, and continuous improvement cycles</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#6644BB]/8 to-transparent border border-[#6644BB]/15 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#9B85D5] mb-[1vh]">Security Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">Data protection, access control, audit logging, and threat monitoring</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#8B6FCC]/8 to-transparent border border-[#8B6FCC]/15 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#C4B0E8] mb-[1vh]">Creative Division</h3>
            <p className="font-body text-[1.2vw] text-[#B8A4E0]/60 leading-relaxed">Content creation, branding, marketing materials, and member-facing communications</p>
          </div>
        </div>
      </div>
    </div>
  );
}
