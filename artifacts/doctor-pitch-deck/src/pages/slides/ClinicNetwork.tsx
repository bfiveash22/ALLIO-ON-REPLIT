export default function ClinicNetwork() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#162D4A] to-[#1E3A5F]">
      <div className="absolute top-[20vh] left-[50vw] w-[40vw] h-[40vw] rounded-full bg-[#00D4AA]/[0.04] blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] rounded-full bg-[#FFD700]/[0.03] blur-[80px]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[6vh]">
        <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1vh]">
          Nationwide Network
        </p>
        <h2 className="font-display text-[4vw] leading-[1] font-bold text-white tracking-tight">
          One Membership. Every Clinic.
        </h2>

        <div className="flex-1 flex items-center mt-[3vh]">
          <div className="w-full flex gap-[4vw]">
            <div className="w-[50%]">
              <div className="glass-card-gold glow-gold p-[3vw] mb-[2.5vh]">
                <p className="font-display text-[5vw] font-bold text-[#FFD700] leading-none">1</p>
                <p className="font-display text-[2.2vw] font-bold text-white mt-[1vh]">Membership</p>
                <p className="font-body text-[1.5vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                  Patients join once and access care at any clinic in the network
                </p>
              </div>
              <div className="glass-card p-[3vw]">
                <p className="font-display text-[5vw] font-bold text-[#00D4AA] leading-none">∞</p>
                <p className="font-display text-[2.2vw] font-bold text-white mt-[1vh]">Portability</p>
                <p className="font-body text-[1.5vw] text-[#C8D6E5] mt-[1vh] leading-snug">
                  Patient records and protocols follow them across all locations
                </p>
              </div>
            </div>

            <div className="w-[50%] flex flex-col justify-center">
              <div className="mb-[4vh]">
                <p className="font-body text-[1.5vw] text-[#00D4AA] uppercase tracking-wider mb-[1vh]">
                  For Patients
                </p>
                <p className="font-body text-[1.7vw] text-[#C8D6E5] leading-relaxed">
                  Seamless access to integrative care nationwide. One membership replaces fragmented clinic-by-clinic relationships.
                </p>
              </div>

              <div className="h-[1px] w-full bg-gradient-to-r from-[#FFD700]/30 to-transparent mb-[4vh]" />

              <div>
                <p className="font-body text-[1.5vw] text-[#FFD700] uppercase tracking-wider mb-[1vh]">
                  For Doctors
                </p>
                <p className="font-body text-[1.7vw] text-[#C8D6E5] leading-relaxed">
                  Turnkey infrastructure, shared patient base, and growing community — without franchise fees or bureaucracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
