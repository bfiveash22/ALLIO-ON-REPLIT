export default function DoctorWorkflowSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#0F1D30] to-[#1E3A5F]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_30%_70%,rgba(212,168,67,0.05),transparent_50%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[1.5vh]">
            Doctor's Workflow
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8]">
            From Member Intake to Protocol Delivery
          </h2>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full flex gap-[0.8vw]">
            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/25 rounded-[1vw] p-[1.6vw] h-full">
                <div className="font-body text-[1.1vw] font-bold text-[#FFD700] mb-[0.8vh]">Step 1</div>
                <h4 className="font-body text-[1.3vw] font-bold text-[#F0F4F8] mb-[0.8vh]">Consult</h4>
                <p className="font-body text-[1.1vw] text-[#C8D6E5]/60 leading-relaxed">Evaluate member, review history, upload blood work for Vision AI analysis, and document chief complaints.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#2A4F7A]/15 to-[#2A4F7A]/5 border border-[#2A4F7A]/25 rounded-[1vw] p-[1.6vw] h-full">
                <div className="font-body text-[1.1vw] font-bold text-[#2A4F7A] mb-[0.8vh]">Step 2</div>
                <h4 className="font-body text-[1.3vw] font-bold text-[#F0F4F8] mb-[0.8vh]">Submit Intake</h4>
                <p className="font-body text-[1.1vw] text-[#C8D6E5]/60 leading-relaxed">Submit intake form through the Protocol Assembly page. SignNow contract must be verified before submission.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#3B6FA0]/15 to-[#3B6FA0]/5 border border-[#3B6FA0]/25 rounded-[1vw] p-[1.6vw] h-full">
                <div className="font-body text-[1.1vw] font-bold text-[#3B6FA0] mb-[0.8vh]">Step 3</div>
                <h4 className="font-body text-[1.3vw] font-bold text-[#F0F4F8] mb-[0.8vh]">AI Generation</h4>
                <p className="font-body text-[1.1vw] text-[#C8D6E5]/60 leading-relaxed">DR. FORMULA generates a complete 90-day 5R protocol with products, injectable peptides, detox plans, and daily schedules.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#C8D6E5]/15 to-[#C8D6E5]/5 border border-[#C8D6E5]/25 rounded-[1vw] p-[1.6vw] h-full">
                <div className="font-body text-[1.1vw] font-bold text-[#C8D6E5] mb-[0.8vh]">Step 4</div>
                <h4 className="font-body text-[1.3vw] font-bold text-[#F0F4F8] mb-[0.8vh]">Slides & Sign-Off</h4>
                <p className="font-body text-[1.1vw] text-[#C8D6E5]/60 leading-relaxed">Google Slides presentation auto-generated and uploaded to Drive. Trustee reviews in Protocol Queue and approves.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/25 rounded-[1vw] p-[1.6vw] h-full">
                <div className="font-body text-[1.1vw] font-bold text-[#FFD700] mb-[0.8vh]">Step 5</div>
                <h4 className="font-body text-[1.3vw] font-bold text-[#F0F4F8] mb-[0.8vh]">Deliver & Follow Up</h4>
                <p className="font-body text-[1.1vw] text-[#C8D6E5]/60 leading-relaxed">Approved protocol delivered to member. Schedule check-ins, retest labs, adapt the protocol at the 90-day mark.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[2vh] text-center">
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/50">Full pipeline — intake to Google Slides — completes in under 60 seconds. SignNow contract verification required before protocol generation.</p>
        </div>
      </div>
    </div>
  );
}
