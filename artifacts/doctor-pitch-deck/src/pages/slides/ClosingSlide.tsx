const base = import.meta.env.BASE_URL;

export default function ClosingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F] to-[#0F1D30]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(0,212,170,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(255,215,0,0.05),transparent_40%)]" />

      <div className="relative flex flex-col items-center justify-center h-full px-[7vw] py-[7vh]">
        <img
          src={`${base}assets/ff_pma_allio_combined_logo.png`}
          crossOrigin="anonymous"
          className="w-[28vw] object-contain mb-[5vh]"
          alt="Forgotten Formula PMA + ALLIO"
        />

        <h2 className="font-display text-[4.5vw] leading-[1] font-bold text-white tracking-tight text-center">
          Join the Network
        </h2>

        <p className="font-body text-[2vw] text-[#00D4AA] mt-[3vh] text-center max-w-[50vw]">
          The future of root-cause medicine is here — and it is looking for practitioners like you.
        </p>

        <div className="mt-[6vh] flex items-center gap-[3vw]">
          <div className="h-[1px] w-[8vw] bg-gradient-to-r from-transparent to-[#FFD700]/50" />
          <p className="font-body text-[1.6vw] text-[#C8D6E5] tracking-wide">
            forgottenformulapma.com
          </p>
          <div className="h-[1px] w-[8vw] bg-gradient-to-l from-transparent to-[#FFD700]/50" />
        </div>

        <div className="absolute bottom-[5vh] flex items-center gap-[2vw]">
          <img
            src={`${base}assets/ff_pma_logo.png`}
            crossOrigin="anonymous"
            className="w-[6vw] object-contain opacity-60"
            alt="FF PMA logo"
          />
          <div className="h-[3vh] w-[1px] bg-[#8395A7]/30" />
          <p className="font-body text-[1.3vw] text-[#8395A7]">
            Private Membership Association
          </p>
        </div>
      </div>
    </div>
  );
}
