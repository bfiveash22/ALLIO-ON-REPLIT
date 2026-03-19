export interface PatientProfile {
  name: string;
  age: number;
  gender: string;
  location?: string;
  callDate?: string;

  chiefComplaints: string[];
  currentDiagnoses: string[];
  currentMedications: string[];

  medicalTimeline: TimelineEvent[];

  rootCauses: RootCause[];

  environmentalExposures: {
    moldExposure: boolean;
    moldDetails?: string;
    heavyMetals: boolean;
    heavyMetalDetails?: string;
    amalgamFillings: boolean;
    amalgamCount?: number;
    amalgamYears?: number;
    pesticides: boolean;
    radiation: boolean;
    otherToxins?: string[];
  };

  traumaHistory: {
    childhoodTrauma: boolean;
    traumaDetails?: string;
    aceScore?: number;
    earlyPuberty?: boolean;
    significantStressors?: string[];
  };

  surgicalHistory: string[];

  gutHealth: {
    gallbladderRemoved: boolean;
    appendixRemoved: boolean;
    digestiveIssues: string[];
    probioticHistory?: string;
  };

  hormoneStatus: {
    thyroidIssues?: string;
    estrogenDominance?: boolean;
    hormoneDetails?: string;
  };

  parasiteStatus: {
    everTreated: boolean;
    treatmentDetails?: string;
  };

  dentalHistory: {
    amalgamFillings: boolean;
    rootCanals: number;
    cavitations?: boolean;
  };

  deficiencies: string[];

  contraindications: string[];

  goals: string[];

  rawTranscript?: string;
  intakeFormId?: number;
  additionalProtocolNotes?: string;
}

export interface TimelineEvent {
  ageRange: string;
  year?: string;
  event: string;
  significance: string;
}

export interface RootCause {
  rank: number;
  cause: string;
  category: 'primary' | 'secondary' | 'tertiary' | 'quaternary' | 'quinary';
  details: string;
  relatedSymptoms: string[];
}

export interface HealingProtocol {
  patientName: string;
  patientAge: number;
  generatedDate: string;
  protocolDurationDays: number;

  summary: string;

  rootCauseAnalysis: RootCause[];

  phases: ProtocolPhase[];

  dailySchedule: DailySchedule;

  injectablePeptides: PeptideProtocol[];

  oralPeptides: OralPeptideProtocol[];

  bioregulators: BioregulatorProtocol[];

  supplements: SupplementProtocol[];

  ivTherapies: IVTherapyProtocol[];

  imTherapies: IMTherapyProtocol[];

  detoxProtocols: DetoxProtocol[];

  parasiteAntiviralProtocols: ParasiteAntiviralProtocol[];

  lifestyleRecommendations: LifestyleRecommendation[];

  dietaryGuidelines: string[];

  followUpPlan: FollowUpItem[];

  contraindications: string[];

  labsRequired: string[];

  suppositories: SuppositoryProtocol[];

  liposomals: LiposomalProtocol[];

  exosomes: ExosomeProtocol[];

  topicals: TopicalProtocol[];

  nebulization: NebulizationProtocol[];

  ecsProtocol: ECSProtocol;

  sirtuinStack: SirtuinProtocol;

  dietaryProtocol: DietaryProtocol;
}

export interface ProtocolPhase {
  phaseNumber: number;
  name: string;
  weekRange: string;
  focus: string;
  keyActions: string[];
}

export interface DailySchedule {
  morning: ScheduleItem[];
  midday: ScheduleItem[];
  evening: ScheduleItem[];
  bedtime: ScheduleItem[];
}

export interface ScheduleItem {
  time?: string;
  item: string;
  details?: string;
  frequency?: string;
}

export interface PeptideProtocol {
  name: string;
  vialSize: string;
  reconstitution: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  purpose: string;
  notes?: string;
}

export interface OralPeptideProtocol {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  purpose: string;
}

export interface BioregulatorProtocol {
  name: string;
  targetOrgan: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface SupplementProtocol {
  name: string;
  dose: string;
  timing: string;
  purpose: string;
}

export interface IVTherapyProtocol {
  name: string;
  frequency: string;
  duration: string;
  purpose: string;
  notes?: string;
}

export interface IMTherapyProtocol {
  name: string;
  dose: string;
  frequency: string;
  purpose: string;
}

export interface DetoxProtocol {
  name: string;
  method: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface ParasiteAntiviralProtocol {
  name: string;
  dose: string;
  schedule: string;
  duration: string;
  purpose: string;
}

export interface LifestyleRecommendation {
  category: string;
  recommendation: string;
  details?: string;
}

export interface FollowUpItem {
  weekNumber: number;
  action: string;
  details?: string;
}

export interface SuppositoryProtocol {
  name: string;
  timing: 'daytime' | 'nighttime' | 'as-needed';
  formula: string;
  cannabinoids: {
    CBD?: string;
    CBG?: string;
    CBN?: string;
    THC?: string;
    DMSO?: string;
  };
  base: string;
  frequency: string;
  purpose: string;
  notes?: string;
}

export interface LiposomalProtocol {
  name: string;
  dose: string;
  frequency: string;
  timing: string;
  purpose: string;
}

export interface ExosomeProtocol {
  name: string;
  source: string;
  concentration: string;
  route: string;
  frequency: string;
  purpose: string;
  notes?: string;
}

export interface TopicalProtocol {
  name: string;
  form: string;
  application: string;
  frequency: string;
  purpose: string;
}

export interface NebulizationProtocol {
  name: string;
  solution: string;
  dose: string;
  frequency: string;
  duration: string;
  purpose: string;
}

export interface ECSProtocol {
  overview: string;
  daytimeFormula: {
    CBD: string;
    CBG: string;
    CBN?: string;
    THC?: string;
    DMSO: string;
    base: string;
    deliveryMethod: string;
  };
  nighttimeFormula: {
    CBD: string;
    CBG?: string;
    CBN: string;
    THC: string;
    DMSO: string;
    base: string;
    deliveryMethod: string;
  };
  tincture: {
    name: string;
    cannabinoids: string[];
    dose: string;
    frequency: string;
  };
  targetedRatios: Array<{
    condition: string;
    ratio: string;
    rationale: string;
  }>;
  ecsSupport: string[];
  molecularTargets: string[];
}

export interface SirtuinProtocol {
  mitoSTAC: {
    resveratrol: string;
    pterostilbene: string;
    quercetin: string;
    fisetin: string;
  };
  nadPrecursors: {
    compound: string;
    dose: string;
    frequency: string;
  };
  glyNAC: {
    glycine: string;
    nac: string;
    frequency: string;
  };
  mitochondrialSupport: Array<{
    name: string;
    dose: string;
    purpose: string;
  }>;
  methylationSupport: Array<{
    name: string;
    dose: string;
  }>;
}

export interface DietaryProtocol {
  phases: Array<{
    name: string;
    duration: string;
    focus: string;
    eliminate: string[];
    emphasize: string[];
    notes?: string;
  }>;
  intermittentFasting: {
    protocol: string;
    schedule: string;
    purpose: string;
  };
  specialConsiderations: string[];
}
