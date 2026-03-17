import { Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Syringe, ArrowLeft, FileText, Calendar, Clock, Users, ChevronRight, Info, Droplet, Zap, Shield, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const ivProtocols = [
  {
    id: "vitamin-c",
    name: "High-Dose Vitamin C",
    category: "Immune Support",
    duration: "60-90 min",
    description: "Powerful antioxidant therapy supporting immune function, collagen synthesis, and cellular health.",
    dosage: "25-75g based on assessment",
    indications: ["Chronic fatigue", "Immune support", "Post-viral recovery", "Cancer adjunct therapy"],
    contraindications: ["G6PD deficiency", "Renal insufficiency", "Iron overload"],
    icon: Droplet,
    color: "amber"
  },
  {
    id: "nad-plus",
    name: "NAD+ Infusion",
    category: "Cellular Energy",
    duration: "2-4 hours",
    description: "Restores cellular NAD+ levels for enhanced energy production, DNA repair, and anti-aging benefits.",
    dosage: "250-1000mg based on protocol",
    indications: ["Chronic fatigue", "Cognitive decline", "Addiction recovery", "Anti-aging"],
    contraindications: ["Active cancer (consult oncologist)", "Pregnancy"],
    icon: Zap,
    color: "teal"
  },
  {
    id: "glutathione",
    name: "Glutathione Push",
    category: "Detoxification",
    duration: "15-30 min",
    description: "Master antioxidant for detoxification, skin health, and immune support.",
    dosage: "600-2400mg IV push",
    indications: ["Detoxification", "Skin brightening", "Liver support", "Parkinson's adjunct"],
    contraindications: ["Sulfite sensitivity", "Asthma (use caution)"],
    icon: Shield,
    color: "purple"
  },
  {
    id: "myers-cocktail",
    name: "Myers' Cocktail",
    category: "General Wellness",
    duration: "30-45 min",
    description: "Classic vitamin and mineral infusion for overall health and energy.",
    dosage: "Magnesium, Calcium, B-vitamins, Vitamin C",
    indications: ["Fatigue", "Migraines", "Fibromyalgia", "Athletic recovery"],
    contraindications: ["Kidney disease", "Heart conditions (adjust magnesium)"],
    icon: Sparkles,
    color: "blue"
  }
];

const upcomingAppointments = [
  { id: 1, member: "John D.", protocol: "High-Dose Vitamin C", time: "Today 2:00 PM", status: "scheduled" },
  { id: 2, member: "Sarah M.", protocol: "NAD+ Infusion", time: "Today 3:30 PM", status: "scheduled" },
  { id: 3, member: "Robert K.", protocol: "Myers' Cocktail", time: "Tomorrow 10:00 AM", status: "confirmed" },
];

export default function ClinicIVProgramPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<typeof ivProtocols[0] | null>(null);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
      amber: { bg: "bg-amber-500/10", text: "text-amber-500", iconBg: "bg-amber-500/20" },
      teal: { bg: "bg-teal-500/10", text: "text-teal-500", iconBg: "bg-teal-500/20" },
      purple: { bg: "bg-purple-500/10", text: "text-purple-500", iconBg: "bg-purple-500/20" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-500", iconBg: "bg-blue-500/20" },
    };
    return colors[color] || colors.amber;
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/clinic">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">IV Therapy Program</h1>
            <p className="text-muted-foreground">Manage IV therapy protocols and scheduling</p>
          </div>
        </div>

        <Tabs defaultValue="protocols" className="space-y-6">
          <TabsList>
            <TabsTrigger value="protocols" data-testid="tab-protocols">
              <Syringe className="h-4 w-4 mr-2" />
              Protocols
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="documentation" data-testid="tab-documentation">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocols">
            <div className="grid gap-4 md:grid-cols-2">
              {ivProtocols.map((protocol) => {
                const colors = getColorClasses(protocol.color);
                const Icon = protocol.icon;
                return (
                  <Card 
                    key={protocol.id} 
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedProtocol(protocol)}
                    data-testid={`card-protocol-${protocol.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.iconBg}`}>
                          <Icon className={`h-6 w-6 ${colors.text}`} />
                        </div>
                        <Badge variant="secondary">{protocol.category}</Badge>
                      </div>
                      <CardTitle className="mt-3">{protocol.name}</CardTitle>
                      <CardDescription>{protocol.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {protocol.duration}
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                          View Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card data-testid="card-schedule">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-teal-500" />
                  Upcoming IV Appointments
                </CardTitle>
                <CardDescription>Today's and upcoming scheduled infusions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      data-testid={`appointment-${apt.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                          <Users className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-medium">{apt.member}</p>
                          <p className="text-sm text-muted-foreground">{apt.protocol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{apt.time}</p>
                        <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black" data-testid="button-new-appointment">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                  <Button variant="outline" className="flex-1" data-testid="button-view-calendar">
                    View Full Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:border-primary/50 transition-colors" data-testid="card-consent-forms">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 mb-3">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <CardTitle>Consent Forms</CardTitle>
                  <CardDescription>IV therapy consent and waiver documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Forms
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors" data-testid="card-protocols-library">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/10 mb-3">
                    <Syringe className="h-6 w-6 text-teal-500" />
                  </div>
                  <CardTitle>Protocol Library</CardTitle>
                  <CardDescription>Standard IV protocol documentation</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Browse Protocols
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors" data-testid="card-safety-guidelines">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 mb-3">
                    <Shield className="h-6 w-6 text-amber-500" />
                  </div>
                  <CardTitle>Safety Guidelines</CardTitle>
                  <CardDescription>IV administration safety protocols</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Guidelines
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedProtocol} onOpenChange={() => setSelectedProtocol(null)}>
          {selectedProtocol && (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getColorClasses(selectedProtocol.color).iconBg}`}>
                    <selectedProtocol.icon className={`h-5 w-5 ${getColorClasses(selectedProtocol.color).text}`} />
                  </div>
                  {selectedProtocol.name}
                </DialogTitle>
                <DialogDescription>{selectedProtocol.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{selectedProtocol.duration}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Dosage</p>
                    <p className="font-medium">{selectedProtocol.dosage}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Indications</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProtocol.indications.map((ind) => (
                      <Badge key={ind} variant="secondary">{ind}</Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-500">Contraindications</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        {selectedProtocol.contraindications.map((contra) => (
                          <li key={contra}>• {contra}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProtocol(null)}>Close</Button>
                <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Treatment
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </main>
  );
}
