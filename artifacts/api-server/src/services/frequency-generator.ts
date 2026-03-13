type WaveformType = "sine" | "square" | "triangle" | "sawtooth";

interface GenerateToneOptions {
  frequencyHz: number;
  durationSeconds: number;
  waveformType: WaveformType;
  sampleRate?: number;
  amplitude?: number;
}

interface GeneratedTone {
  audioBase64: string;
  format: string;
  frequencyHz: number;
  durationSeconds: number;
  waveformType: string;
  sampleRate: number;
}

function generateWaveformSample(type: WaveformType, phase: number): number {
  switch (type) {
    case "sine":
      return Math.sin(2 * Math.PI * phase);
    case "square":
      return phase < 0.5 ? 1 : -1;
    case "triangle":
      return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    case "sawtooth":
      return 2 * phase - 1;
    default:
      return Math.sin(2 * Math.PI * phase);
  }
}

export function generateToneWav(options: GenerateToneOptions): GeneratedTone {
  const {
    frequencyHz,
    durationSeconds,
    waveformType,
    sampleRate = 44100,
    amplitude = 0.8,
  } = options;

  const numSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  const maxVal = 32767;
  for (let i = 0; i < numSamples; i++) {
    const phase = (i * frequencyHz / sampleRate) % 1;
    let sample = generateWaveformSample(waveformType, phase) * amplitude;

    const fadeInSamples = Math.min(sampleRate * 0.05, numSamples * 0.1);
    const fadeOutSamples = Math.min(sampleRate * 0.05, numSamples * 0.1);
    if (i < fadeInSamples) {
      sample *= i / fadeInSamples;
    } else if (i > numSamples - fadeOutSamples) {
      sample *= (numSamples - i) / fadeOutSamples;
    }

    const intSample = Math.max(-maxVal, Math.min(maxVal, Math.round(sample * maxVal)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return {
    audioBase64: buffer.toString("base64"),
    format: "audio/wav",
    frequencyHz,
    durationSeconds,
    waveformType,
    sampleRate,
  };
}

export interface FrequencyPreset {
  title: string;
  description: string;
  frequencyHz: number;
  category: string;
  purpose: string;
  sourceAgent: string;
  tags: string[];
  isFeatured: boolean;
}

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  {
    title: "396 Hz - Liberation",
    description: "The 396 Hz Solfeggio frequency helps liberate guilt and fear, turning grief into joy and creating a solid foundation for transformation.",
    frequencyHz: 396,
    category: "solfeggio",
    purpose: "Liberation from guilt and fear, grounding",
    sourceAgent: "HELIX",
    tags: ["solfeggio", "liberation", "grounding", "emotional-healing"],
    isFeatured: true,
  },
  {
    title: "417 Hz - Facilitating Change",
    description: "The 417 Hz frequency clears destructive influences of past events, facilitates change, and undoes negative situations.",
    frequencyHz: 417,
    category: "solfeggio",
    purpose: "Facilitating change and undoing situations",
    sourceAgent: "HELIX",
    tags: ["solfeggio", "change", "cleansing", "transformation"],
    isFeatured: false,
  },
  {
    title: "432 Hz - Universal Harmony",
    description: "432 Hz is known as Verdi's A, said to be mathematically consistent with the universe. Promotes deep calm and natural resonance with the body.",
    frequencyHz: 432,
    category: "healing",
    purpose: "Universal harmony and natural resonance",
    sourceAgent: "ORACLE",
    tags: ["harmony", "calm", "natural-tuning", "meditation"],
    isFeatured: true,
  },
  {
    title: "528 Hz - DNA Repair (Love Frequency)",
    description: "Known as the 'Love Frequency' or 'Miracle Tone,' 528 Hz is associated with DNA repair, cellular healing, and heart activation. Central to Solfeggio healing.",
    frequencyHz: 528,
    category: "dna_repair",
    purpose: "DNA repair, cellular healing, heart activation",
    sourceAgent: "HELIX",
    tags: ["solfeggio", "dna-repair", "love-frequency", "miracle-tone", "cellular-healing"],
    isFeatured: true,
  },
  {
    title: "639 Hz - Connection & Relationships",
    description: "The 639 Hz frequency enhances communication, understanding, tolerance, and love. Harmonizes interpersonal relationships.",
    frequencyHz: 639,
    category: "solfeggio",
    purpose: "Harmonizing relationships and connection",
    sourceAgent: "HELIX",
    tags: ["solfeggio", "connection", "relationships", "harmony", "communication"],
    isFeatured: true,
  },
  {
    title: "741 Hz - Detoxification",
    description: "741 Hz cleanses cells from toxins, promotes expression, and helps solve problems. Associated with intuition awakening.",
    frequencyHz: 741,
    category: "solfeggio",
    purpose: "Cellular detoxification and problem solving",
    sourceAgent: "HELIX",
    tags: ["solfeggio", "detox", "cleansing", "expression", "intuition"],
    isFeatured: false,
  },
  {
    title: "852 Hz - Spiritual Intuition",
    description: "852 Hz raises awareness and returns to spiritual order. Associated with the third eye chakra and inner strength.",
    frequencyHz: 852,
    category: "solfeggio",
    purpose: "Spiritual intuition and awareness",
    sourceAgent: "HELIX",
    tags: ["solfeggio", "intuition", "spiritual", "awareness", "third-eye"],
    isFeatured: false,
  },
  {
    title: "963 Hz - Divine Connection",
    description: "The 963 Hz frequency awakens the pineal gland and connects to higher consciousness. Known as the frequency of the gods.",
    frequencyHz: 963,
    category: "solfeggio",
    purpose: "Pineal gland activation and divine connection",
    sourceAgent: "ORACLE",
    tags: ["solfeggio", "divine", "pineal-gland", "higher-consciousness"],
    isFeatured: false,
  },
  {
    title: "7.83 Hz - Schumann Resonance",
    description: "The Earth's natural electromagnetic frequency. Promotes grounding, balance, and connection to the planet's natural rhythm. Often called the Earth's heartbeat.",
    frequencyHz: 7.83,
    category: "schumann",
    purpose: "Grounding, Earth resonance, natural balance",
    sourceAgent: "ORACLE",
    tags: ["schumann", "earth-frequency", "grounding", "natural-rhythm", "balance"],
    isFeatured: true,
  },
  {
    title: "174 Hz - Pain Relief Foundation",
    description: "The lowest Solfeggio frequency, 174 Hz acts as a natural anesthetic, reducing pain both physically and energetically.",
    frequencyHz: 174,
    category: "pain_relief",
    purpose: "Natural pain relief and energy foundation",
    sourceAgent: "HIPPOCRATES",
    tags: ["solfeggio", "pain-relief", "anesthetic", "foundation"],
    isFeatured: true,
  },
  {
    title: "285 Hz - Cellular Regeneration",
    description: "285 Hz influences energy fields and sends a message to restructure damaged organs and tissue. Promotes cellular regeneration.",
    frequencyHz: 285,
    category: "healing",
    purpose: "Cellular regeneration and tissue repair",
    sourceAgent: "HIPPOCRATES",
    tags: ["regeneration", "cellular", "tissue-repair", "healing"],
    isFeatured: false,
  },
  {
    title: "Rife 20 Hz - General Vitality",
    description: "Dr. Royal Rife's research frequency for general vitality and wellness support. Part of the foundational Rife frequency protocol.",
    frequencyHz: 20,
    category: "rife",
    purpose: "General vitality and wellness",
    sourceAgent: "HIPPOCRATES",
    tags: ["rife", "vitality", "wellness", "foundational"],
    isFeatured: false,
  },
  {
    title: "Rife 727 Hz - Immune Support",
    description: "One of Dr. Royal Rife's most well-known frequencies, historically associated with immune system support and pathogen disruption.",
    frequencyHz: 727,
    category: "rife",
    purpose: "Immune system support",
    sourceAgent: "HIPPOCRATES",
    tags: ["rife", "immune-support", "pathogen", "classic-rife"],
    isFeatured: true,
  },
  {
    title: "Rife 787 Hz - Detox & Cleanse",
    description: "A core Rife frequency used in many protocols for detoxification and systemic cleansing support.",
    frequencyHz: 787,
    category: "rife",
    purpose: "Systemic detoxification",
    sourceAgent: "HIPPOCRATES",
    tags: ["rife", "detox", "cleansing", "systemic"],
    isFeatured: false,
  },
  {
    title: "Rife 880 Hz - Pathogen Disruption",
    description: "A classic Rife frequency associated with disrupting harmful organisms. One of the original frequencies from Dr. Rife's research.",
    frequencyHz: 880,
    category: "rife",
    purpose: "Pathogen frequency disruption",
    sourceAgent: "HIPPOCRATES",
    tags: ["rife", "pathogen", "disruption", "classic"],
    isFeatured: false,
  },
  {
    title: "40 Hz - Gamma Brain Wave",
    description: "40 Hz gamma frequency stimulates cognitive function, memory consolidation, and neural synchronization. Research links it to reduced neurodegeneration.",
    frequencyHz: 40,
    category: "longevity",
    purpose: "Cognitive enhancement and neural protection",
    sourceAgent: "ORACLE",
    tags: ["gamma", "cognitive", "brain-wave", "memory", "neuroprotection"],
    isFeatured: true,
  },
  {
    title: "10 Hz - Alpha Relaxation",
    description: "10 Hz alpha brainwave frequency promotes deep relaxation, stress relief, and meditative states without drowsiness.",
    frequencyHz: 10,
    category: "relaxation",
    purpose: "Deep relaxation and stress relief",
    sourceAgent: "ORACLE",
    tags: ["alpha", "relaxation", "meditation", "stress-relief", "brain-wave"],
    isFeatured: true,
  },
  {
    title: "111 Hz - Cell Regeneration",
    description: "111 Hz promotes cell rejuvenation and regeneration. Ancient temples were acoustically tuned to this frequency for healing ceremonies.",
    frequencyHz: 111,
    category: "healing",
    purpose: "Cell rejuvenation and regeneration",
    sourceAgent: "HELIX",
    tags: ["regeneration", "ancient", "healing", "temple-frequency"],
    isFeatured: false,
  },
  {
    title: "Binaural 4 Hz - Deep Meditation (Delta)",
    description: "A 4 Hz delta binaural beat induces deep meditation and restorative sleep states. Best experienced with headphones.",
    frequencyHz: 4,
    category: "binaural",
    purpose: "Deep meditation and restorative sleep",
    sourceAgent: "ORACLE",
    tags: ["binaural", "delta", "meditation", "sleep", "deep-rest"],
    isFeatured: false,
  },
  {
    title: "Binaural 6 Hz - Theta Healing",
    description: "6 Hz theta binaural beat supports deep healing, creative visualization, and subconscious reprogramming. Best with headphones.",
    frequencyHz: 6,
    category: "binaural",
    purpose: "Deep healing and subconscious work",
    sourceAgent: "ORACLE",
    tags: ["binaural", "theta", "healing", "visualization", "subconscious"],
    isFeatured: false,
  },
];

export const CATEGORY_SEED_DATA = [
  { name: "Healing", slug: "healing", description: "General healing and wellness frequencies", icon: "heart", sortOrder: 1 },
  { name: "Longevity", slug: "longevity", description: "Anti-aging and longevity-promoting frequencies", icon: "hourglass", sortOrder: 2 },
  { name: "DNA Repair", slug: "dna_repair", description: "Frequencies associated with cellular and DNA repair", icon: "dna", sortOrder: 3 },
  { name: "Pain Relief", slug: "pain_relief", description: "Natural pain relief and analgesic frequencies", icon: "shield", sortOrder: 4 },
  { name: "Relaxation", slug: "relaxation", description: "Stress relief and relaxation frequencies", icon: "leaf", sortOrder: 5 },
  { name: "Solfeggio", slug: "solfeggio", description: "Ancient Solfeggio scale healing frequencies", icon: "music", sortOrder: 6 },
  { name: "Rife", slug: "rife", description: "Dr. Royal Rife research frequencies", icon: "zap", sortOrder: 7 },
  { name: "Binaural", slug: "binaural", description: "Binaural beat frequencies for brainwave entrainment", icon: "headphones", sortOrder: 8 },
  { name: "Schumann", slug: "schumann", description: "Earth resonance and Schumann frequencies", icon: "globe", sortOrder: 9 },
  { name: "Custom", slug: "custom", description: "Custom frequencies created by agents or members", icon: "sparkles", sortOrder: 10 },
];
