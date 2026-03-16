export default function PMANetworkSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1A0D40]">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#331A80]/20 via-transparent to-[#D4A843]/5" />

      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="w-[55%] flex flex-col justify-center pr-[4vw]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[2vh]">
            PMA Network
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8] mb-[3vh]">
            Why a Private Membership Association?
          </h2>
          <p className="font-body text-[1.6vw] text-[#B8A4E0]/70 leading-relaxed mb-[4vh]">
            The PMA structure provides constitutional protection for practitioners and members to engage in natural healing modalities without the constraints of conventional regulatory frameworks.
          </p>

          <div className="space-y-[2vh]">
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#D4A843] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F5F0E8]">Freedom to practice root-cause medicine without insurance limitations</p>
            </div>
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#D4A843] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F5F0E8]">Member sovereignty and informed consent as foundational principles</p>
            </div>
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#D4A843] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F5F0E8]">Nationwide clinic network with portable patient records</p>
            </div>
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#D4A843] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F5F0E8]">Shared AI infrastructure and product catalog across all clinics</p>
            </div>
          </div>
        </div>

        <div className="w-[45%] flex flex-col justify-center gap-[2.5vh]">
          <div className="bg-gradient-to-r from-[#331A80]/60 to-[#331A80]/30 border border-[#D4A843]/20 rounded-[1vw] p-[2.5vw]">
            <p className="font-display text-[3vw] text-[#D4A843] mb-[0.5vh]">1st & 14th</p>
            <p className="font-body text-[1.4vw] text-[#B8A4E0]/70">Amendment protections for private associations</p>
          </div>
          <div className="bg-gradient-to-r from-[#331A80]/60 to-[#331A80]/30 border border-[#6644BB]/20 rounded-[1vw] p-[2.5vw]">
            <p className="font-display text-[3vw] text-[#D4A843] mb-[0.5vh]">One Membership</p>
            <p className="font-body text-[1.4vw] text-[#B8A4E0]/70">Access every clinic in the nationwide network</p>
          </div>
          <div className="bg-gradient-to-r from-[#331A80]/60 to-[#331A80]/30 border border-[#6644BB]/20 rounded-[1vw] p-[2.5vw]">
            <p className="font-display text-[3vw] text-[#D4A843] mb-[0.5vh]">Not a Franchise</p>
            <p className="font-body text-[1.4vw] text-[#B8A4E0]/70">A community of sovereign practitioners, not a corporate chain</p>
          </div>
        </div>
      </div>
    </div>
  );
}
