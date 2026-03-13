import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search,
  Syringe,
  Eye,
  Wind,
  Sparkles,
  Scissors,
  Heart,
  ClipboardList,
  FileText,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";

interface Protocol {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  targetAudience: string[];
  duration?: string;
  materials: string[];
  steps: { title: string; description: string }[];
  precautions: string[];
  postCare?: string[];
}

const protocols: Protocol[] = [
  {
    id: "butterfly-push",
    title: "Exosome Butterfly Push",
    category: "injection",
    icon: <Syringe className="h-5 w-5" />,
    description: "Direct intravascular administration of MSC exosomes via butterfly needle for systemic regenerative support.",
    targetAudience: ["doctor", "clinic"],
    duration: "15-20 minutes",
    materials: [
      "MSC Exosome vial (5ml or 10ml)",
      "23-25G butterfly needle",
      "10ml syringe",
      "Alcohol swabs",
      "Sterile gloves",
      "Tourniquet",
      "Gauze and bandage",
    ],
    steps: [
      { title: "Patient Preparation", description: "Verify patient identity and consent. Review medical history and contraindications. Ensure patient is well-hydrated." },
      { title: "Vial Preparation", description: "Allow exosome vial to reach room temperature. Gently invert vial 3-5 times to mix. Do not shake vigorously." },
      { title: "Draw Exosomes", description: "Using aseptic technique, draw the exosome solution into a 10ml syringe. Avoid introducing air bubbles." },
      { title: "Venous Access", description: "Apply tourniquet and identify suitable vein. Clean site with alcohol and allow to dry. Insert butterfly needle at 15-30 degree angle." },
      { title: "Administration", description: "Confirm blood return. Release tourniquet. Slowly push exosome solution over 3-5 minutes. Monitor for adverse reactions." },
      { title: "Post-Injection", description: "Apply gentle pressure with gauze. Bandage site. Have patient rest for 10-15 minutes before discharge." },
    ],
    precautions: [
      "Contraindicated in active infection or fever",
      "Use caution in patients with bleeding disorders",
      "Monitor for allergic reactions",
      "Store exosomes at proper temperature until use",
    ],
    postCare: [
      "Increase water intake for 24-48 hours",
      "Avoid strenuous exercise for 24 hours",
      "Report any unusual symptoms immediately",
    ],
  },
  {
    id: "iv-infusion",
    title: "Exosome IV Infusion",
    category: "injection",
    icon: <Syringe className="h-5 w-5" />,
    description: "Extended intravenous infusion of MSC exosomes diluted in saline for enhanced systemic distribution and regeneration.",
    targetAudience: ["doctor", "clinic"],
    duration: "45-60 minutes",
    materials: [
      "MSC Exosome vial (10ml or 20ml)",
      "Normal saline 100-250ml bag",
      "IV catheter (20-22G)",
      "IV tubing set",
      "Infusion pump (optional)",
      "Sterile transfer spike",
      "Alcohol swabs and gloves",
    ],
    steps: [
      { title: "Patient Assessment", description: "Verify consent and review allergies. Take baseline vitals. Ensure IV access site is suitable." },
      { title: "Solution Preparation", description: "Using sterile technique, add exosome solution to saline bag. Gently mix by inverting bag. Label with patient info and contents." },
      { title: "IV Placement", description: "Establish IV access using appropriate gauge catheter. Confirm patency with saline flush." },
      { title: "Begin Infusion", description: "Connect exosome-saline solution. Set drip rate for 45-60 minute infusion. Start slow for first 15 minutes." },
      { title: "Monitoring", description: "Check vitals every 15 minutes. Watch for adverse reactions including flushing, difficulty breathing, or rash." },
      { title: "Completion", description: "Flush line with saline. Remove IV and apply pressure. Document procedure and patient response." },
    ],
    precautions: [
      "Pre-medicate if history of infusion reactions",
      "Have emergency medications available",
      "Do not exceed recommended infusion rate",
      "Monitor closely for first infusion",
    ],
    postCare: [
      "Rest for 30 minutes post-infusion",
      "Hydrate well for 48 hours",
      "Avoid alcohol for 24 hours",
      "Schedule follow-up as needed",
    ],
  },
  {
    id: "eyedrops",
    title: "Exosome Eyedrops",
    category: "topical",
    icon: <Eye className="h-5 w-5" />,
    description: "Topical ocular application of MSC exosomes for dry eye, corneal healing, and ocular surface regeneration.",
    targetAudience: ["doctor", "member"],
    duration: "5 minutes application",
    materials: [
      "MSC Exosome solution (ophthalmic grade)",
      "Sterile eye dropper or single-use vials",
      "Sterile saline for dilution (if needed)",
      "Clean tissues",
    ],
    steps: [
      { title: "Hand Hygiene", description: "Wash hands thoroughly with soap and water. Dry with clean towel." },
      { title: "Preparation", description: "If using vial, prepare sterile dropper. Check solution clarity - should be clear without particles." },
      { title: "Patient Position", description: "Have patient tilt head back and look up. Gently pull down lower eyelid to create pocket." },
      { title: "Application", description: "Hold dropper 1-2 inches above eye. Instill 1-2 drops into lower conjunctival sac. Avoid touching eye or lashes." },
      { title: "Post-Application", description: "Have patient close eyes gently for 1-2 minutes. Apply gentle pressure to inner corner to prevent drainage." },
      { title: "Repeat", description: "If treating both eyes, repeat process. Cap dropper immediately after use." },
    ],
    precautions: [
      "Do not use if active eye infection present",
      "Remove contact lenses before application",
      "Do not share between patients",
      "Store refrigerated when not in use",
    ],
    postCare: [
      "Wait 15 minutes before inserting contacts",
      "May experience temporary mild blurring",
      "Apply as directed (typically 2-3x daily)",
      "Report any persistent irritation",
    ],
  },
  {
    id: "nebulizer",
    title: "Nebulized Exosomes",
    category: "respiratory",
    icon: <Wind className="h-5 w-5" />,
    description: "Inhalation delivery of MSC exosomes via nebulizer for respiratory regeneration and systemic absorption through lung tissue.",
    targetAudience: ["doctor", "clinic"],
    duration: "15-20 minutes",
    materials: [
      "MSC Exosome vial (5ml)",
      "Medical-grade nebulizer",
      "Nebulizer mask or mouthpiece",
      "Sterile saline for dilution",
      "Pulse oximeter",
    ],
    steps: [
      { title: "Equipment Setup", description: "Ensure nebulizer is clean and functioning. Attach fresh nebulizer cup and appropriate mask/mouthpiece." },
      { title: "Solution Preparation", description: "Add exosome solution to nebulizer cup. Dilute with sterile saline to appropriate volume (typically 3-5ml total)." },
      { title: "Patient Preparation", description: "Position patient comfortably upright. Take baseline oxygen saturation. Instruct on slow, deep breathing." },
      { title: "Treatment", description: "Begin nebulization. Have patient breathe slowly and deeply through mouth. Continue until solution is nebulized (10-15 min)." },
      { title: "Monitoring", description: "Monitor for coughing or bronchospasm. Check oxygen saturation periodically. Stop if adverse reaction occurs." },
      { title: "Completion", description: "Have patient rest briefly. Recheck vitals. Clean and disinfect equipment." },
    ],
    precautions: [
      "Not for patients with severe asthma exacerbation",
      "Use bronchodilator pre-treatment if history of reactive airways",
      "Ensure adequate ventilation in treatment area",
      "Single-use nebulizer cups recommended",
    ],
    postCare: [
      "Avoid smoking for 24 hours",
      "Stay well hydrated",
      "Report any breathing difficulties",
      "Rinse mouth after treatment",
    ],
  },
  {
    id: "p-shot",
    title: "P-Shot (Priapus Shot)",
    category: "injection",
    icon: <Heart className="h-5 w-5" />,
    description: "Penile injection of MSC exosomes for male sexual rejuvenation, erectile function improvement, and tissue regeneration.",
    targetAudience: ["doctor"],
    duration: "30-45 minutes",
    materials: [
      "MSC Exosome vial",
      "Topical numbing cream (lidocaine)",
      "27-30G needle",
      "1-3ml syringe",
      "Alcohol swabs",
      "Sterile gloves",
      "Ice pack (optional)",
    ],
    steps: [
      { title: "Consent & History", description: "Obtain informed consent. Review sexual health history and ED medications. Discuss expectations." },
      { title: "Numbing", description: "Apply topical anesthetic cream generously. Cover with occlusive wrap. Allow 20-30 minutes for full effect." },
      { title: "Preparation", description: "Clean treatment area with alcohol. Draw exosome solution into syringe with fine needle." },
      { title: "Injection Sites", description: "Inject into corpus cavernosum at multiple points. Use proper technique to avoid urethra and dorsal vein." },
      { title: "Post-Injection", description: "Apply gentle pressure. May use ice for comfort. Have patient rest briefly." },
      { title: "Discharge", description: "Provide post-care instructions. Schedule follow-up. Discuss expected timeline for results." },
    ],
    precautions: [
      "Contraindicated in active infection or priapism history",
      "Review all ED medications",
      "Use proper aspiration technique",
      "Have priapism reversal agents available",
    ],
    postCare: [
      "Avoid sexual activity for 24-48 hours",
      "Some bruising is normal",
      "Results may take 2-4 weeks to appear",
      "Series of treatments often recommended",
    ],
  },
  {
    id: "o-shot",
    title: "O-Shot (Orgasm Shot)",
    category: "injection",
    icon: <Heart className="h-5 w-5" />,
    description: "Vaginal/clitoral injection of MSC exosomes for female sexual rejuvenation, sensitivity enhancement, and tissue regeneration.",
    targetAudience: ["doctor"],
    duration: "30-45 minutes",
    materials: [
      "MSC Exosome vial",
      "Topical numbing cream",
      "27-30G needle",
      "1-3ml syringe",
      "Sterile speculum",
      "Alcohol swabs",
      "Sterile gloves",
    ],
    steps: [
      { title: "Consultation", description: "Obtain informed consent. Discuss sexual health concerns and goals. Review medical history." },
      { title: "Preparation", description: "Apply topical anesthetic to treatment areas. Allow adequate time for numbing (20-30 min)." },
      { title: "Positioning", description: "Position patient comfortably. Use sterile technique throughout procedure." },
      { title: "Injection", description: "Inject exosome solution into designated areas including anterior vaginal wall and clitoral region." },
      { title: "Post-Procedure", description: "Monitor briefly for any adverse reactions. Ensure patient comfort." },
      { title: "Follow-up", description: "Provide written instructions. Schedule follow-up appointment. Discuss expected outcomes." },
    ],
    precautions: [
      "Rule out active infections or malignancy",
      "Not recommended during pregnancy",
      "Use appropriate injection depth",
      "Maintain strict sterile technique",
    ],
    postCare: [
      "Avoid intercourse for 48 hours",
      "Minor spotting may occur",
      "Results develop over 2-4 weeks",
      "Multiple treatments may be needed",
    ],
  },
  {
    id: "microneedle-facial",
    title: "Microneedle Exosome Facial",
    category: "aesthetic",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Combined microneedling with topical MSC exosome application for facial rejuvenation, skin texture improvement, and anti-aging.",
    targetAudience: ["doctor", "clinic"],
    duration: "45-60 minutes",
    materials: [
      "MSC Exosome serum",
      "Microneedling device (0.5-1.5mm)",
      "Topical numbing cream",
      "Gentle cleanser",
      "Sterile saline",
      "Sterile gloves",
      "Post-treatment serum/mask",
    ],
    steps: [
      { title: "Cleansing", description: "Remove makeup and cleanse face thoroughly. Pat dry with clean towel." },
      { title: "Numbing", description: "Apply topical anesthetic evenly to treatment areas. Cover and wait 20-30 minutes." },
      { title: "Preparation", description: "Remove numbing cream with saline or water. Prepare microneedling device with appropriate depth setting." },
      { title: "Microneedling", description: "Apply exosome serum to skin. Perform microneedling in systematic pattern covering all treatment areas. Apply more serum as needed." },
      { title: "Exosome Saturation", description: "Apply generous layer of exosome serum post-microneedling. Massage gently to enhance absorption through microchannels." },
      { title: "Finishing", description: "Apply soothing mask or serum. Provide aftercare instructions. Apply SPF if daytime." },
    ],
    precautions: [
      "Not for active acne, eczema, or rosacea flares",
      "Avoid in areas with active infection or open wounds",
      "Adjust needle depth based on treatment area",
      "Use single-use needle cartridges only",
    ],
    postCare: [
      "Redness normal for 24-48 hours",
      "Avoid sun exposure and use SPF 30+",
      "No makeup for 24 hours",
      "Gentle skincare only for 72 hours",
      "Results improve over 4-6 weeks",
    ],
  },
  {
    id: "hair-restoration",
    title: "Exosome Hair Restoration",
    category: "aesthetic",
    icon: <Scissors className="h-5 w-5" />,
    description: "Scalp injection of MSC exosomes with optional microneedling for hair regrowth, follicle stimulation, and scalp health.",
    targetAudience: ["doctor", "clinic"],
    duration: "45-60 minutes",
    materials: [
      "MSC Exosome vial",
      "Topical numbing spray/cream",
      "30G needle or mesotherapy gun",
      "1ml syringes (multiple)",
      "Alcohol swabs",
      "Sterile gloves",
      "Dermapen (optional)",
    ],
    steps: [
      { title: "Scalp Assessment", description: "Document areas of thinning. Take photos for tracking. Identify treatment zones." },
      { title: "Preparation", description: "Part hair to expose scalp. Apply topical anesthetic to treatment areas. Wait for numbing." },
      { title: "Injection Pattern", description: "Create grid pattern across treatment zones. Inject 0.1-0.2ml per point at 1cm intervals." },
      { title: "Technique", description: "Use superficial intradermal technique. Inject into dermis at hair follicle level. Work systematically." },
      { title: "Microneedling (Optional)", description: "Follow injections with microneedling at 1.0-1.5mm depth. Apply additional exosomes topically." },
      { title: "Completion", description: "Apply gentle pressure if bleeding. Provide aftercare instructions. Schedule next session." },
    ],
    precautions: [
      "Not for scarring alopecia without evaluation",
      "Review any blood thinners",
      "Avoid if active scalp infection or inflammation",
      "Set realistic expectations - series treatment needed",
    ],
    postCare: [
      "Do not wash hair for 24 hours",
      "Avoid harsh chemicals for 72 hours",
      "Mild swelling normal for 24-48 hours",
      "Results visible at 3-6 months",
      "Monthly treatments for 3-6 sessions recommended",
    ],
  },
  {
    id: "pre-post-treatment",
    title: "Pre & Post Treatment Guidelines",
    category: "guidelines",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "General guidelines for patient preparation and aftercare to optimize exosome treatment outcomes.",
    targetAudience: ["doctor", "clinic", "member"],
    materials: [],
    steps: [
      { title: "72 Hours Before", description: "Discontinue blood thinners if approved by physician. Avoid alcohol. Stay well hydrated. Get adequate sleep." },
      { title: "24 Hours Before", description: "No NSAIDs (ibuprofen, aspirin). Eat a light, healthy meal. Avoid excessive caffeine. Confirm appointment details." },
      { title: "Day of Treatment", description: "Arrive well-hydrated. Wear comfortable clothing. Bring list of current medications. Have someone drive if receiving sedation." },
      { title: "Immediately After", description: "Rest for recommended time. Apply ice if directed. Take prescribed medications only. Have light meal if comfortable." },
      { title: "First 24 Hours", description: "Limit physical activity. Continue extra hydration. Avoid alcohol and smoking. Monitor for unusual symptoms." },
      { title: "First Week", description: "Gradually resume normal activities. Attend follow-up if scheduled. Report any concerning symptoms. Continue healthy lifestyle." },
    ],
    precautions: [
      "Follow provider-specific instructions as they may vary",
      "Contact provider immediately for fever, severe pain, or unexpected symptoms",
      "Keep all follow-up appointments",
      "Results timeline varies by treatment type",
    ],
  },
];

const categories = [
  { id: "all", label: "All Protocols", icon: <FileText className="h-4 w-4" /> },
  { id: "injection", label: "Injection", icon: <Syringe className="h-4 w-4" /> },
  { id: "topical", label: "Topical", icon: <Eye className="h-4 w-4" /> },
  { id: "respiratory", label: "Respiratory", icon: <Wind className="h-4 w-4" /> },
  { id: "aesthetic", label: "Aesthetic", icon: <Sparkles className="h-4 w-4" /> },
  { id: "guidelines", label: "Guidelines", icon: <ClipboardList className="h-4 w-4" /> },
];

export default function ProtocolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  const filteredProtocols = protocols.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Exosome Protocols</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive treatment protocols for MSC exosome therapies
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-protocols"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex flex-wrap gap-1 h-auto">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2" data-testid={`tab-${cat.id}`}>
              {cat.icon}
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredProtocols.length > 0 ? (
            <div className="space-y-4">
              {filteredProtocols.map(protocol => (
                <Card key={protocol.id} className="overflow-visible" data-testid={`card-protocol-${protocol.id}`}>
                  <CardHeader 
                    className="cursor-pointer hover-elevate"
                    onClick={() => setExpandedProtocol(expandedProtocol === protocol.id ? null : protocol.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-md bg-primary/10 text-primary shrink-0">
                        {protocol.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <CardTitle className="text-xl">{protocol.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            {protocol.duration && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {protocol.duration}
                              </Badge>
                            )}
                            <Badge className="capitalize">
                              {protocol.category}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="mt-1">
                          {protocol.description}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            For: {protocol.targetAudience.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${expandedProtocol === protocol.id ? 'rotate-90' : ''}`} />
                    </div>
                  </CardHeader>

                  {expandedProtocol === protocol.id && (
                    <CardContent className="border-t pt-6 space-y-6">
                      {protocol.materials.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Materials Needed
                          </h4>
                          <ul className="grid gap-1 sm:grid-cols-2 text-sm">
                            {protocol.materials.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-cyan-600 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Procedure Steps
                        </h4>
                        <Accordion type="single" collapsible className="w-full">
                          {protocol.steps.map((step, i) => (
                            <AccordionItem key={i} value={`step-${i}`}>
                              <AccordionTrigger className="text-sm">
                                <span className="flex items-center gap-3">
                                  <Badge variant="outline" className="shrink-0">
                                    {i + 1}
                                  </Badge>
                                  {step.title}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground pl-10">
                                {step.description}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            Precautions
                          </h4>
                          <ul className="space-y-1 text-sm">
                            {protocol.precautions.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-600 dark:text-amber-400 shrink-0">-</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {protocol.postCare && protocol.postCare.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                              <CheckCircle2 className="h-4 w-4" />
                              Post-Treatment Care
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {protocol.postCare.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-cyan-600 dark:text-cyan-400 shrink-0">-</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t">
                        <Button data-testid={`button-print-${protocol.id}`}>
                          Print Protocol
                        </Button>
                        <Button variant="outline" data-testid={`button-download-${protocol.id}`}>
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No protocols match your search." : "No protocols in this category."}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">Important Notice</h3>
              <p className="text-sm text-muted-foreground mt-1">
                These protocols are provided for educational purposes and should be performed by qualified healthcare professionals. 
                Always obtain proper training and certifications before performing any procedures. 
                Forgotten Formula PMA does not assume liability for improper use of these protocols.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
