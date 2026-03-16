export default function PMAStructureSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#251560] via-[#1A0D40] to-[#1A0D40]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_80%,rgba(212,168,67,0.06),transparent_50%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="text-center mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[1.5vh]">
            Organizational Structure
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8]">
            How the PMA Network Operates
          </h2>
        </div>

        <div className="flex-1 flex gap-[2vw] items-center">
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[6vw] h-[6vw] rounded-[1vw] bg-gradient-to-br from-[#D4A843]/20 to-[#D4A843]/5 border border-[#D4A843]/30 flex items-center justify-center mb-[2vh]">
              <span className="text-[2.5vw]">👤</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F5F0E8] mb-[1vh]">Trustee</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Oversees operations, reviews protocols, ensures compliance with PMA principles</p>
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[6vw] h-[6vw] rounded-[1vw] bg-gradient-to-br from-[#6644BB]/20 to-[#6644BB]/5 border border-[#6644BB]/30 flex items-center justify-center mb-[2vh]">
              <span className="text-[2.5vw]">⚕</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F5F0E8] mb-[1vh]">Doctors</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Network practitioners who deliver root-cause protocols under PMA protection</p>
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[6vw] h-[6vw] rounded-[1vw] bg-gradient-to-br from-[#8B6FCC]/20 to-[#8B6FCC]/5 border border-[#8B6FCC]/30 flex items-center justify-center mb-[2vh]">
              <span className="text-[2.5vw]">🏥</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F5F0E8] mb-[1vh]">Clinics</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Physical locations with shared infrastructure, product access, and AI tools</p>
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-[6vw] h-[6vw] rounded-[1vw] bg-gradient-to-br from-[#B8A4E0]/20 to-[#B8A4E0]/5 border border-[#B8A4E0]/30 flex items-center justify-center mb-[2vh]">
              <span className="text-[2.5vw]">🤝</span>
            </div>
            <h3 className="font-body text-[1.8vw] font-bold text-[#F5F0E8] mb-[1vh]">Members</h3>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/65 leading-relaxed">Patients who join the PMA for access to natural healing protocols</p>
          </div>
        </div>

        <div className="mt-[2vh] bg-[#331A80]/30 border border-[#6644BB]/20 rounded-[0.8vw] p-[2vw] text-center">
          <p className="font-body text-[1.5vw] text-[#B8A4E0]/70">
            All operations are supported by ALLIO — the 48-agent AI ecosystem that handles protocol generation, administration, compliance, and continuous improvement
          </p>
        </div>
      </div>
    </div>
  );
}
