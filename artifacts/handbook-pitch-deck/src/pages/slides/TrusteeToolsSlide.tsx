export default function TrusteeToolsSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_70%_30%,rgba(0,212,170,0.12),transparent_50%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            Trustee Tools
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            Daily Operations Dashboard
          </h2>
        </div>

        <div className="flex-1 flex gap-[1.5vw]">
          <div className="flex-1 bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-full bg-[#2A4F7A]/20 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw]">📋</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Protocol Queue</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed flex-1">Review pending protocols, approve or request revisions, track delivery status for each member. Integrated with SENTINEL Telegram alerts.</p>
          </div>

          <div className="flex-1 bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-full bg-[#2A4F7A]/20 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw]">📊</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Agent Monitor</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed flex-1">Real-time health dashboard for all 48 ALLIO agents across 7 divisions. Track task completion, failures, and per-agent performance metrics.</p>
          </div>

          <div className="flex-1 bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-full bg-[#2A4F7A]/20 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw]">⚖️</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">SENTINEL Contract Review</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed flex-1">Multi-agent legal audit coordinated by SENTINEL. JURIS, LEXICON, AEGIS, and SCRIBE analyze PMA agreements, flag critical issues, and prioritize edits.</p>
          </div>

          <div className="flex-1 bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[1vw] p-[2vw] flex flex-col">
            <div className="w-[3vw] h-[3vw] rounded-full bg-[#2A4F7A]/20 flex items-center justify-center mb-[1.5vh]">
              <span className="text-[1.5vw]">💬</span>
            </div>
            <h3 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Communication Hub</h3>
            <p className="font-body text-[1.2vw] text-[#C8D6E5]/60 leading-relaxed flex-1">Direct messaging with doctors, members, and the ALLIO agent network. SENTINEL bridges Telegram for real-time Trustee-to-agent communication.</p>
          </div>
        </div>

        <div className="mt-[3vh] text-center">
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/50">All tools accessible through the FFPMA web application at forgottenformulapma.com</p>
        </div>
      </div>
    </div>
  );
}
