export default function TrusteeOverviewSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A5F]/20 via-transparent to-transparent" />
      <div className="absolute left-[7vw] top-[12vh] bottom-[12vh] w-[3px] bg-gradient-to-b from-[#FFD700]/40 via-[#2A4F7A]/30 to-transparent" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[3vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            Trustee Operations
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            The Trustee's Role
          </h2>
        </div>

        <div className="flex-1 flex gap-[4vw]">
          <div className="w-[50%] flex flex-col justify-center gap-[3vh] pl-[2vw]">
            <div>
              <h3 className="font-body text-[1.8vw] font-bold text-[#FFD700] mb-[1vh]">Protocol Oversight</h3>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]/65 leading-relaxed">Review every AI-generated protocol before delivery. Ensure clinical accuracy, dosage safety, and alignment with the FF PMA methodology.</p>
            </div>
            <div>
              <h3 className="font-body text-[1.8vw] font-bold text-[#FFD700] mb-[1vh]">Member Management</h3>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]/65 leading-relaxed">Oversee patient intake, membership onboarding, consent documentation, and ongoing member communication.</p>
            </div>
            <div>
              <h3 className="font-body text-[1.8vw] font-bold text-[#FFD700] mb-[1vh]">Legal Compliance</h3>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]/65 leading-relaxed">Maintain PMA legal standing, ensure proper documentation, and uphold constitutional protections for all members.</p>
            </div>
          </div>

          <div className="w-[50%] flex flex-col justify-center gap-[3vh]">
            <div>
              <h3 className="font-body text-[1.8vw] font-bold text-[#FFD700] mb-[1vh]">Network Coordination</h3>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]/65 leading-relaxed">Manage doctor approvals, clinic onboarding, and cross-network quality standards.</p>
            </div>
            <div>
              <h3 className="font-body text-[1.8vw] font-bold text-[#FFD700] mb-[1vh]">AI Ecosystem Governance</h3>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]/65 leading-relaxed">Direct ALLIO agent priorities, review enhancement proposals, and ensure the AI network serves the PMA mission.</p>
            </div>
            <div>
              <h3 className="font-body text-[1.8vw] font-bold text-[#FFD700] mb-[1vh]">Product Catalog</h3>
              <p className="font-body text-[1.4vw] text-[#C8D6E5]/65 leading-relaxed">Curate and maintain the 127+ therapeutic product catalog, manage supplier relationships, and ensure product quality.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
