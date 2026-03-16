export default function DoctorGuideSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 bg-gradient-to-bl from-[#2A4F7A]/8 via-transparent to-transparent" />
      <div className="absolute right-0 top-[10vh] w-[3px] h-[80vh] bg-gradient-to-b from-transparent via-[#FFD700]/30 to-transparent" />

      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="w-[45%] flex flex-col justify-center pr-[3vw]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[2vh]">
            Doctor's Guide
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8] mb-[3vh]">
            Practicing Within the FFPMA Network
          </h2>
          <p className="font-body text-[1.5vw] text-[#C8D6E5]/65 leading-relaxed">
            As a network physician, you gain access to a complete clinical infrastructure — from AI-powered protocol generation to a curated product catalog and nationwide referral network. Practice the medicine you believe in, supported by technology.
          </p>
        </div>

        <div className="w-[55%] flex flex-col justify-center gap-[2.5vh] pl-[3vw]">
          <div className="flex gap-[1.5vw] items-start bg-[#1E3A5F]/25 rounded-[0.8vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.5vw] bg-[#FFD700]/15 flex items-center justify-center shrink-0">
              <span className="text-[1.3vw] text-[#FFD700]">⚡</span>
            </div>
            <div>
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8]">AI Protocol Architect</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 mt-[0.5vh]">Describe a case, receive a complete protocol with dosages, scheduling, and product sourcing</p>
            </div>
          </div>

          <div className="flex gap-[1.5vw] items-start bg-[#1E3A5F]/25 rounded-[0.8vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.5vw] bg-[#FFD700]/15 flex items-center justify-center shrink-0">
              <span className="text-[1.3vw] text-[#FFD700]">🔬</span>
            </div>
            <div>
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8]">Diagnostic Intelligence</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 mt-[0.5vh]">True Vision blood analysis and ECS profiling with AI-assisted interpretation</p>
            </div>
          </div>

          <div className="flex gap-[1.5vw] items-start bg-[#1E3A5F]/25 rounded-[0.8vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.5vw] bg-[#FFD700]/15 flex items-center justify-center shrink-0">
              <span className="text-[1.3vw] text-[#FFD700]">📚</span>
            </div>
            <div>
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8]">Research Integration</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 mt-[0.5vh]">Real-time PubMed and clinical research access with evidence citations in every protocol</p>
            </div>
          </div>

          <div className="flex gap-[1.5vw] items-start bg-[#1E3A5F]/25 rounded-[0.8vw] p-[2vw]">
            <div className="w-[3vw] h-[3vw] rounded-[0.5vw] bg-[#FFD700]/15 flex items-center justify-center shrink-0">
              <span className="text-[1.3vw] text-[#FFD700]">🏥</span>
            </div>
            <div>
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8]">Turnkey Infrastructure</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 mt-[0.5vh]">Clinic setup support, admin automation, and community — not a franchise</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
