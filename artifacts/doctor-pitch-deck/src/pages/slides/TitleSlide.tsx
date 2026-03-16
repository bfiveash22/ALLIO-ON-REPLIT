const base = import.meta.env.BASE_URL;

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}assets/allio_hero_banner_landscape.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt="ALLIO hero banner"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1D30]/95 via-[#1E3A5F]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1D30]/70 via-transparent to-transparent" />

      <div className="relative flex flex-col justify-between h-full px-[7vw] py-[7vh]">
        <div className="flex items-center gap-[1.5vw]">
          <img
            src={`${base}assets/ff_pma_white_blue_helix.png`}
            crossOrigin="anonymous"
            className="h-[6vw] object-contain"
            alt="Forgotten Formula PMA Helix"
          />
          <img
            src={`${base}assets/ff_pma_allio_combined_logo.png`}
            crossOrigin="anonymous"
            className="w-[14vw] object-contain"
            alt="Forgotten Formula PMA + ALLIO logo"
          />
        </div>

        <div className="max-w-[55vw]">
          <p className="font-body text-[1.6vw] tracking-[0.2em] text-[#00D4AA] uppercase mb-[2vh]">
            The Future of Root-Cause Medicine
          </p>
          <h1 className="font-display text-[5.5vw] leading-[0.95] font-bold text-white tracking-tight">
            Forgotten Formula PMA
          </h1>
          <p className="font-body text-[2vw] text-[#C8D6E5] mt-[3vh] leading-snug max-w-[48vw]">
            AI-powered integrative medicine. Practice freedom under PMA protection. A new era for physicians.
          </p>
        </div>

        <div className="flex items-center gap-[2vw]">
          <div className="h-[1px] w-[6vw] bg-gradient-to-r from-[#00D4AA] to-transparent" />
          <p className="font-body text-[1.3vw] text-[#8395A7]">
            Physician Network Invitation
          </p>
        </div>
      </div>
    </div>
  );
}
