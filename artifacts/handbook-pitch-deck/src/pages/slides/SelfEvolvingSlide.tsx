export default function SelfEvolvingSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] via-[#1E3A5F]/30 to-[#0F1D30]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_50%_50%,rgba(212,168,67,0.08),transparent_50%)]" />

      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="w-[50%] flex flex-col justify-center pr-[4vw]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[2vh]">
            Self-Evolving Intelligence
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8] mb-[3vh]">
            ALLIO Gets Smarter Every Week
          </h2>
          <p className="font-body text-[1.6vw] text-[#C8D6E5]/65 leading-relaxed">
            The ALLIO ecosystem runs weekly auto-enhancement cycles. Each agent evaluates its own performance, identifies improvement opportunities, and implements changes — all with Trustee oversight. The system continuously evolves without downtime.
          </p>
        </div>

        <div className="w-[50%] flex flex-col justify-center gap-[2.5vh] pl-[2vw]">
          <div className="bg-[#1E3A5F]/30 border border-[#FFD700]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#FFD700] mb-[1vh]">Weekly Enhancement Cycles</h4>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Automated performance analysis, capability assessment, and improvement proposals generated every week</p>
          </div>

          <div className="bg-[#1E3A5F]/30 border border-[#2A4F7A]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#2A4F7A] mb-[1vh]">Dynamic Model Routing</h4>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Intelligent routing to the best AI model for each task — balancing cost, speed, and accuracy automatically</p>
          </div>

          <div className="bg-[#1E3A5F]/30 border border-[#3B6FA0]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#3B6FA0] mb-[1vh]">Auto-Implementation</h4>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Approved enhancements are implemented automatically — new skills, improved prompts, and optimized workflows</p>
          </div>

          <div className="bg-[#1E3A5F]/30 border border-[#C8D6E5]/15 rounded-[1vw] p-[2.5vw]">
            <h4 className="font-body text-[1.6vw] font-bold text-[#C8D6E5] mb-[1vh]">Trustee Governance</h4>
            <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">All major changes require human approval — the AI proposes, the Trustee decides</p>
          </div>
        </div>
      </div>
    </div>
  );
}
