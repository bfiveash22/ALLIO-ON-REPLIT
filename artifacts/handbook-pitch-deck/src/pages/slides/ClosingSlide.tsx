export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_40%,rgba(0,212,170,0.2),transparent_50%)]" />
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_70%,rgba(212,168,67,0.08),transparent_40%)]" />

      <div className="relative flex flex-col items-center justify-center h-full px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[2vw] mb-[5vh]">
          <div className="w-[5vw] h-[5vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center border-2 border-[#FFD700]/30">
            <span className="font-display text-[2.2vw] text-[#FFD700]">FF</span>
          </div>
          <div>
            <p className="font-display text-[2.5vw] text-[#F0F4F8]">Forgotten Formula PMA</p>
            <p className="font-body text-[1.5vw] text-[#C8D6E5]/70">Powered by ALLIO</p>
          </div>
        </div>

        <h2 className="font-display text-[4.5vw] leading-[1] text-[#F0F4F8] text-center">
          The Future of Root-Cause Medicine
        </h2>

        <p className="font-body text-[2vw] text-[#FFD700] mt-[3vh] text-center max-w-[55vw]">
          Healing over profits. Nature over synthetic. Sovereignty over compliance.
        </p>

        <div className="mt-[6vh] flex items-center gap-[3vw]">
          <div className="h-[1px] w-[8vw] bg-gradient-to-r from-transparent to-[#FFD700]/40" />
          <p className="font-body text-[1.6vw] text-[#C8D6E5]/70 tracking-wide">
            forgottenformulapma.com
          </p>
          <div className="h-[1px] w-[8vw] bg-gradient-to-l from-transparent to-[#FFD700]/40" />
        </div>

        <div className="absolute bottom-[5vh] flex items-center gap-[2vw]">
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/50">
            Private Membership Association
          </p>
          <div className="h-[2vh] w-[1px] bg-[#2A4F7A]/30" />
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/50">
            Complete Ecosystem Handbook
          </p>
        </div>
      </div>
    </div>
  );
}
