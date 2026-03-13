const base = import.meta.env.BASE_URL;

export default function TheVision() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src={`${base}assets/forgotten_formula_brand_concept.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt="Forgotten Formula brand concept"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1D30]/95 via-[#0F1D30]/85 to-[#0F1D30]/60" />

      <div className="relative flex flex-col justify-center h-full px-[7vw] py-[7vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#00D4AA] uppercase mb-[2vh]">
          Our Vision
        </p>

        <h2 className="font-display text-[4.5vw] leading-[1] font-bold text-white tracking-tight max-w-[50vw] italic">
          "Healing Over Profits. Nature Over Synthetic."
        </h2>

        <div className="mt-[5vh] max-w-[45vw]">
          <p className="font-body text-[2vw] text-[#C8D6E5] leading-relaxed">
            The Private Membership Association model frees your practice from insurance gatekeeping. Prescribe what works — not what is covered.
          </p>
        </div>

        <div className="mt-[5vh] flex gap-[3vw]">
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-[#00D4AA]" />
            <p className="font-body text-[1.6vw] text-white">No insurance approvals</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-[#FFD700]" />
            <p className="font-body text-[1.6vw] text-white">Full protocol freedom</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <div className="w-[0.8vw] h-[0.8vw] rounded-full bg-[#00D4AA]" />
            <p className="font-body text-[1.6vw] text-white">Root-cause focus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
