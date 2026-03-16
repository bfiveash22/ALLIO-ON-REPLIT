export default function AllioOverviewSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_40%,rgba(0,212,170,0.15),transparent_55%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="text-center mb-[3vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            The Agent Network
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            Meet ALLIO — 48 AI Agents, 7 Divisions
          </h2>
          <p className="font-body text-[1.6vw] text-[#C8D6E5]/60 mt-[1.5vh]">
            A self-evolving AI ecosystem purpose-built for the FFPMA
          </p>
        </div>

        <div className="flex-1 flex gap-[1.5vw] items-start mt-[1vh]">
          <div className="flex-1 bg-gradient-to-b from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#FFD700] mb-[1vh]">Medical Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">DR. FORMULA, Blood Analyst, ECS Profiler, Research agents — the clinical intelligence core</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#2A4F7A]/10 to-transparent border border-[#2A4F7A]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#2A4F7A] mb-[1vh]">Operations Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">Admin, scheduling, onboarding, communications — keeping the clinics running smoothly</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#3B6FA0]/10 to-transparent border border-[#3B6FA0]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#3B6FA0] mb-[1vh]">Legal Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">PMA compliance, document management, consent tracking, regulatory monitoring</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#C8D6E5]/10 to-transparent border border-[#C8D6E5]/20 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#C8D6E5] mb-[1vh]">Engineering Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">Platform development, API maintenance, infrastructure, and security management</p>
          </div>
        </div>

        <div className="flex gap-[1.5vw] items-start mt-[1.5vh]">
          <div className="flex-1 bg-gradient-to-b from-[#FFD700]/8 to-transparent border border-[#FFD700]/15 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#FFE44D] mb-[1vh]">Intelligence Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">Auto-enhancement, self-evolution, model routing, and continuous improvement cycles</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#2A4F7A]/8 to-transparent border border-[#2A4F7A]/15 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#00D4AA] mb-[1vh]">Security Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">Data protection, access control, audit logging, and threat monitoring</p>
          </div>

          <div className="flex-1 bg-gradient-to-b from-[#3B6FA0]/8 to-transparent border border-[#3B6FA0]/15 rounded-[1vw] p-[1.8vw]">
            <h3 className="font-body text-[1.5vw] font-bold text-[#33DFBD] mb-[1vh]">Creative Division</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed">Content creation, branding, marketing materials, and member-facing communications</p>
          </div>
        </div>
      </div>
    </div>
  );
}
