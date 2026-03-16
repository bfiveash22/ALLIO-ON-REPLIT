export interface SlideData {
  id: string;
  type: string;
  title: string;
  narration: string;
  content: Record<string, any>;
}

export interface PresentationData {
  protocolId: number;
  patientName: string;
  generatedDate: string;
  trusteeNotes: string;
  profile: any;
  protocol: any;
  citations: any[];
  slides: SlideData[];
}

export interface NarrationState {
  isPlaying: boolean;
  currentSlide: number;
  utterance: SpeechSynthesisUtterance | null;
}
