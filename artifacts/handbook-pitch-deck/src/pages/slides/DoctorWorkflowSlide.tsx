export default function DoctorWorkflowSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-br from-[#1A0D40] to-[#251560]">
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_30%_70%,rgba(212,168,67,0.05),transparent_50%)]" />

      <div className="relative flex flex-col h-full px-[7vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#D4A843] uppercase mb-[1.5vh]">
            Doctor's Workflow
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F5F0E8]">
            From Patient Intake to Protocol Delivery
          </h2>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full flex gap-[1vw]">
            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#D4A843]/15 to-[#D4A843]/5 border border-[#D4A843]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#D4A843] mb-[1vh]">Step 1</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Consult</h4>
                <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Evaluate the patient, review history, order diagnostics, and document chief complaints.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#6644BB]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#6644BB]/15 to-[#6644BB]/5 border border-[#6644BB]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#6644BB] mb-[1vh]">Step 2</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Request Protocol</h4>
                <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Submit patient data to DR. FORMULA through the FFPMA platform for AI analysis.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#6644BB]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#8B6FCC]/15 to-[#8B6FCC]/5 border border-[#8B6FCC]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#8B6FCC] mb-[1vh]">Step 3</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">AI Generation</h4>
                <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">DR. FORMULA generates a personalized 5R protocol with products, doses, and timeline.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#6644BB]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#B8A4E0]/15 to-[#B8A4E0]/5 border border-[#B8A4E0]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#B8A4E0] mb-[1vh]">Step 4</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Review & Deliver</h4>
                <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Trustee reviews, doctor refines if needed, and the protocol PDF is delivered to the member.</p>
              </div>
            </div>

            <div className="flex items-center">
              <span className="text-[1.5vw] text-[#6644BB]/50">→</span>
            </div>

            <div className="flex-1 relative">
              <div className="bg-gradient-to-b from-[#D4A843]/15 to-[#D4A843]/5 border border-[#D4A843]/25 rounded-[1vw] p-[2vw] h-full">
                <div className="font-body text-[1.2vw] font-bold text-[#D4A843] mb-[1vh]">Step 5</div>
                <h4 className="font-body text-[1.5vw] font-bold text-[#F5F0E8] mb-[1vh]">Follow Up</h4>
                <p className="font-body text-[1.3vw] text-[#B8A4E0]/60 leading-relaxed">Schedule check-ins, retest labs, and adapt the protocol based on patient response.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[2vh] text-center">
          <p className="font-body text-[1.3vw] text-[#B8A4E0]/50">Average protocol generation: under 60 seconds from submission to complete document</p>
        </div>
      </div>
    </div>
  );
}
