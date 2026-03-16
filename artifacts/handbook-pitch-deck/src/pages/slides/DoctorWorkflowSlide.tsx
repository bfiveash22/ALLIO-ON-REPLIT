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
            From Patient Intake to Protocol Delivery
          </h2>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full flex gap-[1vw]">
            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#FFD700] mb-[1vh]">Step 1</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Consult</h4>
                <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Evaluate the patient, review history, order diagnostics, and document chief complaints.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#2A4F7A]/15 to-[#2A4F7A]/5 border border-[#2A4F7A]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#2A4F7A] mb-[1vh]">Step 2</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Request Protocol</h4>
                <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Submit patient data to DR. FORMULA through the FFPMA platform for AI analysis.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#3B6FA0]/15 to-[#3B6FA0]/5 border border-[#3B6FA0]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#3B6FA0] mb-[1vh]">Step 3</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">AI Generation</h4>
                <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">DR. FORMULA generates a personalized 5R protocol with products, doses, and timeline.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#C8D6E5]/15 to-[#C8D6E5]/5 border border-[#C8D6E5]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#C8D6E5] mb-[1vh]">Step 4</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Review & Deliver</h4>
                <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Trustee reviews, doctor refines if needed, and the protocol PDF is delivered to the member.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#2A4F7A]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#FFD700] mb-[1vh]">Step 5</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Follow Up</h4>
                <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Schedule check-ins, retest labs, and adapt the protocol based on patient response.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[2vh] text-center">
          <p className="font-body text-[1.3vw] text-[#C8D6E5]/50">Average protocol generation: under 60 seconds from submission to complete document</p>
        </div>
      </div>
    </div>
  );
}
