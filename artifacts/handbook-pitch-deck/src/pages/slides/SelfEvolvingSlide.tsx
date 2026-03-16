export default function SelfEvolvingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#1A0D40] via-[#331A80]/30 to-[#1A0D40]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_50%,rgba(212,168,67,0.08),transparent_50%)]" />

      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="w-[50%] flex flex-col justify-center pr-[4vw]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[2vh]">
            Self-Evolving Intelligence
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8] mb-[3vh]">
            ALLIO Gets Smarter Every Week
          </h2>
          <p className="font-body text-[1.6vw] text-[#B8A4E0]/65 leading-relaxed">
            The ALLIO ecosystem runs weekly auto-enhancement cycles. Each agent evaluates its own performance, identifies improvement opportunities, and implements changes — all with Trustee oversight. The system continuously evolves without downtime.
          </p>
        </div>

        <div className="w-[50%] flex flex-col justify-center gap-[2.5vh] pl-[2vw]">
          <div className="bg-[#331A80]/30 border border-[#D4A843]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#D4A843] mb-[1vh]">Weekly Enhancement Cycles</h4>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Automated performance analysis, capability assessment, and improvement proposals generated every week</p>
          </div>

          <div className="bg-[#331A80]/30 border border-[#6644BB]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#6644BB] mb-[1vh]">Dynamic Model Routing</h4>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Intelligent routing to the best AI model for each task — balancing cost, speed, and accuracy automatically</p>
          </div>

          <div className="bg-[#331A80]/30 border border-[#8B6FCC]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#8B6FCC] mb-[1vh]">Auto-Implementation</h4>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Approved enhancements are implemented automatically — new skills, improved prompts, and optimized workflows</p>
          </div>

          <div className="bg-[#331A80]/30 border border-[#B8A4E0]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#B8A4E0] mb-[1vh]">Trustee Governance</h4>
            <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">All major changes require human approval — the AI proposes, the Trustee decides</p>
          </div>
        </div>
      </div>
    </div>
  );
}
