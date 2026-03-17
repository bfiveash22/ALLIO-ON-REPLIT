import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, Plus, Video, Phone, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DoctorSchedulingProps {
  doctorId?: string;
}

export function DoctorScheduling({ doctorId }: DoctorSchedulingProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<string>("consultation");
  const [duration, setDuration] = useState<string>("60");
  const [notes, setNotes] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membersData } = useQuery<{ members: any[] }>({
    queryKey: ['/api/doctor/members'],
  });

  const { data: appointments } = useQuery<any[]>({
    queryKey: ['/api/doctor/appointments'],
  });

  // Filter appointments for the selected date
  const selectedDateAppointments = appointments?.filter(app => {
    if (!date) return false;
    const appDate = new Date(app.appointmentDate);
    return appDate.toDateString() === date.toDateString();
  }) || [];

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/doctor/appointments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctor/appointments'] });
      setIsModalOpen(false);
      toast({
        title: "Appointment Created",
        description: "The appointment has been successfully scheduled.",
      });
      // Reset form
      setSelectedPatientId("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    }
  });

  const handleScheduleProcess = () => {
    if (!selectedPatientId || !date) {
      toast({
        title: "Missing Information",
        description: "Please select a member and date.",
        variant: "destructive",
      });
      return;
    }
    
    createAppointmentMutation.mutate({
      patientId: selectedPatientId,
      appointmentDate: date.toISOString(),
      durationMinutes: parseInt(duration),
      appointmentType,
      notes,
    });
  };

  return (
    <Card className="bg-black/20 border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-cyan-400" />
            Doctor Scheduling
          </h2>
          <p className="text-white/60 text-sm mt-1">Manage your member appointments</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30">
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                Schedule Appointment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Member</label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white">
                    {membersData?.members?.map((member: any) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Type</label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="blood-analysis">Blood Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Duration</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="30">30 Minutes</SelectItem>
                      <SelectItem value="60">60 Minutes</SelectItem>
                      <SelectItem value="90">90 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-1 block">Notes (Optional)</label>
                <Textarea 
                  className="bg-white/5 border-white/10 resize-none" 
                  placeholder="Additional context for this appointment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <Button 
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={handleScheduleProcess}
                disabled={createAppointmentMutation.isPending}
              >
                {createAppointmentMutation.isPending ? "Scheduling..." : "Confirm Appointment"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar View */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md mx-auto"
          />
        </div>

        {/* Daily Schedule */}
        <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl border border-cyan-500/20 p-4">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-cyan-400" />
            Schedule for {date ? format(date, "MMMM d, yyyy") : "Selected Date"}
          </h3>
          
          <div className="space-y-3">
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 text-white/50 bg-black/20 rounded-lg">
                No appointments scheduled for this date.
              </div>
            ) : (
              selectedDateAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex flex-col items-center justify-center text-cyan-400">
                      <span className="text-xs font-bold">{format(new Date(appointment.appointmentDate), "HH:mm")}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Member ID: {appointment.patientId}</p>
                      <p className="text-xs text-white/50 capitalize">{appointment.appointmentType} • {appointment.durationMinutes} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-cyan-400">
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {/* Example mock appointment layout if no real data is fetched yet to show the layout working */}
            {appointments?.length === 0 && selectedDateAppointments.length === 0 && (
               <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex flex-col items-center justify-center text-cyan-400">
                    <span className="text-xs font-bold">10:00</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Sample Member</p>
                    <p className="text-xs text-white/50">Consultation • 60 min</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
