export default function AdminGuideSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0F1D30]">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1E3A5F]/15 via-transparent to-[#FFD700]/3" />

      <div className="relative flex h-full px-[7vw] py-[7vh]">
        <div className="w-[45%] flex flex-col justify-center pr-[3vw]">
          <p className="font-body text-[1.5vw] tracking-[0.2em] text-[#FFD700] uppercase mb-[2vh]">
            Admin Guide
          </p>
          <h2 className="font-display text-[3.5vw] leading-[1.05] text-[#F0F4F8] mb-[3vh]">
            Clinic Administration Made Simple
          </h2>
          <p className="font-body text-[1.6vw] text-[#C8D6E5]/65 leading-relaxed">
            ALLIO automates the heavy lifting of clinic operations — from member onboarding and appointment scheduling to inventory management and compliance tracking. Focus on patient care, not paperwork.
          </p>
        </div>

        <div className="w-[55%] flex flex-col justify-center pl-[3vw]">
          <div className="grid grid-cols-2 gap-[2vw]">
            <div className="bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[0.8vw] p-[2vw]">
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Member Onboarding</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Automated intake forms, consent documentation, and membership agreement processing</p>
            </div>
            <div className="bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[0.8vw] p-[2vw]">
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Product Orders</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Catalog-integrated ordering from protocol shopping lists with supplier coordination</p>
            </div>
            <div className="bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[0.8vw] p-[2vw]">
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Scheduling</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Appointment management, follow-up reminders, and cross-clinic patient coordination</p>
            </div>
            <div className="bg-[#1E3A5F]/30 border border-[#2A4F7A]/20 rounded-[0.8vw] p-[2vw]">
              <h4 className="font-body text-[1.5vw] font-bold text-[#F0F4F8] mb-[1vh]">Reporting</h4>
              <p className="font-body text-[1.3vw] text-[#C8D6E5]/60 leading-relaxed">Operational dashboards, protocol analytics, and compliance reports for the Trustee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
