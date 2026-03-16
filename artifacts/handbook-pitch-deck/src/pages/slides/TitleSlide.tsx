export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_30%_20%,rgba(0,212,170,0.3),transparent_50%),radial-gradient(ellipse_at_75%_80%,rgba(212,168,67,0.15),transparent_45%)]" />
      <div className="absolute top-0 right-0 w-[45vw] h-full bg-gradient-to-l from-[#2A4F7A]/10 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />

      <div className="relative flex flex-col justify-between h-full px-[7vw] py-[8vh]">
        <div className="flex items-center gap-[1.5vw]">
          <div className="w-[3vw] h-[3vw] rounded-full bg-gradient-to-br from-[#2A4F7A] to-[#1E3A5F] flex items-center justify-center">
            <span className="font-display text-[1.4vw] text-[#FFD700]">FF</span>
          </div>
          <div className="font-body text-[1.3vw] tracking-[0.2em] text-[#C8D6E5]/80 uppercase">
            Forgotten Formula PMA
          </div>
        </div>

        <div className="max-w-[65vw]">
          <p className="font-body text-[1.6vw] tracking-[0.15em] text-[#FFD700] uppercase mb-[2vh]">
            Complete Ecosystem Handbook
          </p>
          <h1 className="font-display text-[5.5vw] leading-[0.95] text-[#F0F4F8] tracking-tight">
            FFPMA & ALLIO
          </h1>
          <h2 className="font-display text-[3vw] leading-[1.1] text-[#C8D6E5] mt-[1.5vh]">
            Ecosystem Guide & Training Manual
          </h2>
          <p className="font-body text-[1.8vw] text-[#C8D6E5]/70 mt-[3vh] max-w-[50vw] leading-relaxed">
            Mission, methodology, operations, and the AI agent network — everything you need to know about the Forgotten Formula Private Membership Association.
          </p>
        </div>

        <div className="flex items-center gap-[2vw]">
          <div className="h-[1px] w-[6vw] bg-gradient-to-r from-[#FFD700] to-transparent" />
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/60">
            Private Membership Association • Onboarding & Reference
          </p>
        </div>
      </div>
    </div>
  );
}
