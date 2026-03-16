export default function PMANetworkSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1E3A5F]/20 via-transparent to-[#FFD700]/5" />

      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="w-[55%] flex flex-col justify-center pr-[4vw]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[2vh]">
            PMA Network
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8] mb-[3vh]">
            Why a Private Membership Association?
          </h2>
          <p className="font-body text-[1.6vw] text-[#C8D6E5]/70 leading-relaxed mb-[4vh]">
            The PMA structure provides constitutional protection for practitioners and members to engage in natural healing modalities without the constraints of conventional regulatory frameworks.
          </p>

          <div className="space-y-[2vh]">
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#FFD700] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F0F4F8]">Freedom to practice root-cause medicine without insurance limitations</p>
            </div>
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#FFD700] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F0F4F8]">Member sovereignty and informed consent as foundational principles</p>
            </div>
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#FFD700] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F0F4F8]">Nationwide clinic network with portable patient records</p>
            </div>
            <div className="flex items-start gap-[1.2vw]">
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[#FFD700] mt-[0.8vw] shrink-0" />
              <p className="font-body text-[1.5vw] text-[#F0F4F8]">Shared AI infrastructure and product catalog across all clinics</p>
            </div>
          </div>
        </div>

        <div className="w-[45%] flex flex-col justify-center gap-[2.5vh]">
          <div className="bg-gradient-to-r from-[#1E3A5F]/60 to-[#1E3A5F]/30 border border-[#FFD700]/20 rounded-[1vw] p-[2.5vw]">
            <p className="font-display text-[3vw] text-[#FFD700] mb-[0.5vh]">1st & 14th</p>
            <p className="font-body text-[1.4vw] text-[#C8D6E5]/70">Amendment protections for private associations</p>
          </div>
          <div className="bg-gradient-to-r from-[#1E3A5F]/60 to-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[1vw] p-[2.5vw]">
            <p className="font-display text-[3vw] text-[#FFD700] mb-[0.5vh]">One Membership</p>
            <p className="font-body text-[1.4vw] text-[#C8D6E5]/70">Access every clinic in the nationwide network</p>
          </div>
          <div className="bg-gradient-to-r from-[#1E3A5F]/60 to-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[1vw] p-[2.5vw]">
            <p className="font-display text-[3vw] text-[#FFD700] mb-[0.5vh]">Not a Franchise</p>
            <p className="font-body text-[1.4vw] text-[#C8D6E5]/70">A community of sovereign practitioners, not a corporate chain</p>
          </div>
        </div>
      </div>
    </div>
  );
}
