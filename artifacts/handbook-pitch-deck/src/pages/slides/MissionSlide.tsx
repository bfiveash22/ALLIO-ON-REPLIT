export default function MissionSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_60%_30%,rgba(0,212,170,0.2),transparent_55%)]" />
      <div className="absolute left-0 top-[15vh] w-[4px] h-[70vh] bg-gradient-to-b from-transparent via-[#FFD700]/50 to-transparent" />

      <div className="relative flex h-full px-[7vw] py-[8vh]">
        <div className="flex flex-col justify-center w-[50%]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[2vh]">
            Our Mission
          </p>
          <h2 className="font-display text-[4vw] leading-[1.05] text-[#F0F4F8]">
            Healing Over Profits
          </h2>
          <h3 className="font-display text-[2.5vw] leading-[1.1] text-[#C8D6E5] mt-[1vh]">
            Nature Over Synthetic
          </h3>
          <p className="font-body text-[1.6vw] text-[#C8D6E5]/70 mt-[4vh] leading-relaxed max-w-[38vw]">
            The Forgotten Formula PMA exists to restore root-cause medicine to its rightful place — empowering practitioners and members to heal through natural, evidence-based protocols free from insurance-driven constraints.
          </p>
        </div>

        <div className="flex flex-col justify-center w-[50%] pl-[4vw] gap-[3vh]">
          <div className="bg-[#1E3A5F]/40 border border-[#2A4F7A]/30 rounded-[1vw] p-[2.5vw]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <span className="text-[1.2vw] text-[#FFD700]">✦</span>
              </div>
              <span className="font-body text-[1.6vw] font-semibold text-[#F0F4F8]">Root-Cause Focus</span>
            </div>
            <p className="font-body text-[1.4vw] text-[#C8D6E5]/70 leading-relaxed">
              Identify and resolve the underlying causes of disease — not just suppress symptoms.
            </p>
          </div>

          <div className="bg-[#1E3A5F]/40 border border-[#2A4F7A]/30 rounded-[1vw] p-[2.5vw]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <span className="text-[1.2vw] text-[#FFD700]">⚕</span>
              </div>
              <span className="font-body text-[1.6vw] font-semibold text-[#F0F4F8]">PMA Protection</span>
            </div>
            <p className="font-body text-[1.4vw] text-[#C8D6E5]/70 leading-relaxed">
              Practice medicine freely under Private Membership Association constitutional protections.
            </p>
          </div>

          <div className="bg-[#1E3A5F]/40 border border-[#2A4F7A]/30 rounded-[1vw] p-[2.5vw]">
            <div className="flex items-center gap-[1vw] mb-[1.5vh]">
              <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <span className="text-[1.2vw] text-[#FFD700]">🤖</span>
              </div>
              <span className="font-body text-[1.6vw] font-semibold text-[#F0F4F8]">AI-Powered</span>
            </div>
            <p className="font-body text-[1.4vw] text-[#C8D6E5]/70 leading-relaxed">
              Leverage ALLIO, a 48-agent AI ecosystem, for precision protocols and operational excellence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
