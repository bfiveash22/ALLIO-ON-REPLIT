import type { SlideData } from "./types";

export function buildSlides(protocol: any, profile: any, citations: any[], trusteeNotes: string): SlideData[] {
  const slides: SlideData[] = [];
  const pn = protocol.patientName || "Member";

  slides.push({
    id: "title",
    type: "title",
    title: "Member Protocol 2026",
    narration: `Welcome to the Forgotten Formula PMA Member Protocol for ${pn}. This comprehensive 90-day healing protocol has been carefully designed by Trustee Michael Blake and the ALLIO AI system to address the root causes of ${pn}'s health challenges. Before you heal someone, ask them if they're willing to give up the things that make them sick.`,
    content: { patientName: pn, date: protocol.generatedDate, trustee: "Michael Blake" }
  });

  slides.push({
    id: "summary",
    type: "summary",
    title: "Presentation Summary",
    narration: `This presentation covers ${pn}'s complete healing protocol: the detox phase, getting started timeline, and member overview. We address toxin exposure, periodontal issues, gut health, and nutrient deficiencies through the 5 Stages of Wellness. Our approach emphasizes holistic healing focusing on inflammation, viral load, parasite load, and metabolic functionality at the cellular level.`,
    content: {
      points: [
        "Detox phase, Getting Started, Timeline and Member Overview",
        "Addresses toxin exposure, periodontal issues, gut, and nutrient deficiencies",
        "5 Stages of Wellness to achieve balance",
        "Holistic approach focusing on inflammation, viral load, parasite load, and metabolic functionality at the cellular level"
      ],
      quote: "The natural healing force within each of us is the greatest force in getting well"
    }
  });

  slides.push({
    id: "member-info",
    type: "member-info",
    title: "Member Information",
    narration: `${pn}, age ${protocol.patientAge}. Current diagnosis: ${profile.currentDiagnoses?.join(", ") || "See details"}. Chief complaints include: ${profile.chiefComplaints?.slice(0, 3).join(", ") || "See details"}. Our goals are to ${profile.goals?.slice(0, 2).join(" and ") || "address root causes and restore health"}.`,
    content: {
      diagnoses: profile.currentDiagnoses || [],
      complaints: profile.chiefComplaints || [],
      medications: profile.currentMedications || [],
      goals: profile.goals || [],
      allergies: profile.allergies || [],
      surgicalHistory: profile.surgicalHistory || []
    }
  });

  if (profile.medicalTimeline?.length > 0) {
    slides.push({
      id: "timeline",
      type: "timeline",
      title: "Member Timeline",
      narration: `Let me walk you through ${pn}'s medical timeline. This timeline reveals the accumulation of health insults over a lifetime. ${profile.medicalTimeline.slice(0, 3).map((e: any) => `At ${e.ageRange}: ${e.event}`).join(". ")}. Each of these events contributed to the current condition.`,
      content: { events: profile.medicalTimeline }
    });
  }

  slides.push({
    id: "trustee-thoughts",
    type: "trustee-thoughts",
    title: "Michael's Thoughts",
    narration: trusteeNotes || `After meeting with ${pn} and understanding their story, their life, and their responsibilities, I believe this is something we can address through our comprehensive approach. The key is addressing the root causes, not just the symptoms.`,
    content: { notes: trusteeNotes || profile.practitionerNotes || "" }
  });

  if (protocol.rootCauseAnalysis?.length > 0) {
    slides.push({
      id: "root-causes",
      type: "root-causes",
      title: "Root Cause Analysis",
      narration: `We have identified ${protocol.rootCauseAnalysis.length} primary root causes for ${pn}'s condition. ${protocol.rootCauseAnalysis.slice(0, 3).map((rc: any) => `Number ${rc.rank}: ${rc.cause}`).join(". ")}. Each of these must be addressed for true healing.`,
      content: { causes: protocol.rootCauseAnalysis }
    });
  }

  slides.push({
    id: "five-stages",
    type: "five-stages",
    title: "5 Stages of Wellness",
    narration: "The Forgotten Formula 5R Framework guides every protocol we build. Stage 1: Reduce - eliminate toxins, pathogens, and inflammatory triggers. Stage 2: Rebalance - restore mineral, hormone, and microbiome balance. Stage 3: Reactivate - wake up dormant healing systems including p53 tumor suppressors. Stage 4: Restore - rebuild damaged tissues and cellular function. Stage 5: Revitalize - achieve long-term homeostasis and vitality.",
    content: {
      stages: [
        { name: "Reduce", description: "Eliminate toxins, pathogens, inflammatory triggers", icon: "shield" },
        { name: "Rebalance", description: "Restore mineral, hormone, and microbiome balance", icon: "scale" },
        { name: "Reactivate", description: "Wake dormant healing systems, tumor suppressors", icon: "zap" },
        { name: "Restore", description: "Rebuild damaged tissues and cellular function", icon: "heart" },
        { name: "Revitalize", description: "Achieve long-term homeostasis and vitality", icon: "sun" }
      ]
    }
  });

  if (protocol.phases?.length > 0) {
    slides.push({
      id: "phases-overview",
      type: "phases",
      title: "Protocol Phases Overview",
      narration: `This ${protocol.protocolDurationDays}-day protocol is structured in ${protocol.phases.length} phases. ${protocol.phases.map((p: any) => `Phase ${p.phaseNumber}: ${p.name}, covering ${p.weekRange}`).join(". ")}.`,
      content: { phases: protocol.phases }
    });
  }

  if (protocol.dailySchedule) {
    slides.push({
      id: "daily-morning",
      type: "daily-schedule",
      title: "Daily Schedule - Morning",
      narration: `The morning routine is the foundation of each day. ${pn} starts at ${protocol.dailySchedule.morning?.[0]?.time || "6:00 AM"} with ${protocol.dailySchedule.morning?.[0]?.item || "the morning protocol"}. Each morning item builds on the previous one to create a therapeutic cascade.`,
      content: { period: "morning", items: protocol.dailySchedule.morning || [] }
    });

    slides.push({
      id: "daily-midday",
      type: "daily-schedule",
      title: "Daily Schedule - Midday",
      narration: `The midday protocol includes nutrition and targeted therapies. ${protocol.dailySchedule.midday?.map((i: any) => i.item).join(", ") || "See details"}.`,
      content: { period: "midday", items: protocol.dailySchedule.midday || [] }
    });

    slides.push({
      id: "daily-evening",
      type: "daily-schedule",
      title: "Daily Schedule - Evening & Bedtime",
      narration: `The evening and bedtime protocols focus on repair, detoxification, and preparation for overnight healing. ${protocol.dailySchedule.evening?.slice(0, 2).map((i: any) => i.item).join(", ") || "Evening protocols"}. Before bed: ${protocol.dailySchedule.bedtime?.slice(0, 2).map((i: any) => i.item).join(", ") || "bedtime protocols"}.`,
      content: {
        evening: protocol.dailySchedule.evening || [],
        bedtime: protocol.dailySchedule.bedtime || []
      }
    });
  }

  if (protocol.injectablePeptides?.length > 0) {
    slides.push({
      id: "injectable-peptides",
      type: "injectable-peptides",
      title: "Injectable Peptide Protocol",
      narration: `${pn}'s injectable peptide protocol includes ${protocol.injectablePeptides.length} peptides. ${protocol.injectablePeptides.slice(0, 3).map((p: any) => `${p.name}: ${p.purpose?.split(".")[0]}`).join(". ")}. All peptides will be pre-dosed with clear injection instructions.`,
      content: { peptides: protocol.injectablePeptides }
    });
  }

  if (protocol.bioregulators?.length > 0) {
    slides.push({
      id: "bioregulators",
      type: "bioregulators",
      title: "PCC Bioregulator Schedule",
      narration: `PCC Bioregulators provide targeted organ-specific peptide signaling. ${pn} will use ${protocol.bioregulators.length} bioregulators targeting: ${protocol.bioregulators.map((b: any) => b.targetOrgan).join(", ")}. Morning bioregulators and evening bioregulators are timed for optimal absorption.`,
      content: { bioregulators: protocol.bioregulators }
    });
  }

  if (protocol.oralPeptides?.length > 0) {
    slides.push({
      id: "oral-peptides",
      type: "oral-peptides",
      title: "Oral Peptide Phase (Weeks 7-12)",
      narration: `Starting in week 7, ${pn} transitions to oral peptides to continue immune modulation and repair. These include: ${protocol.oralPeptides.map((p: any) => p.name).join(", ")}. The transition from injectable to oral maintains therapeutic momentum while improving convenience.`,
      content: { peptides: protocol.oralPeptides }
    });
  }

  if (protocol.supplements?.length > 0) {
    slides.push({
      id: "supplements",
      type: "supplements",
      title: "Supplementation - Full List",
      narration: `The supplement protocol addresses ${pn}'s critical mineral deficiencies and provides comprehensive nutritional support. Key supplements include nascent iodine for breast tissue protection, copper for p53 gene function, selenium for antioxidant defense, and MitoStac for mitochondrial activation. ${protocol.supplements.length} total supplements have been carefully selected.`,
      content: { supplements: protocol.supplements }
    });
  }

  if (protocol.detoxProtocols?.length > 0) {
    slides.push({
      id: "detox",
      type: "detox",
      title: "Detoxification & Pathogen Support",
      narration: `Detoxification is critical for ${pn}. We're addressing decades of accumulated toxins including mycotoxins from childhood mold exposure and mercury from the amalgam filling. Protocols include: ${protocol.detoxProtocols.map((d: any) => d.name).join(", ")}. The parasite and antiviral protocols target hidden pathogenic burdens.`,
      content: {
        detox: protocol.detoxProtocols,
        parasiteProtocols: protocol.parasiteAntiviralProtocols || []
      }
    });
  }

  if (protocol.ivTherapies?.length > 0) {
    slides.push({
      id: "iv-therapies",
      type: "iv-therapies",
      title: "IV & IM Therapies",
      narration: `Intravenous and intramuscular therapies provide direct systemic support. ${protocol.ivTherapies.map((iv: any) => `${iv.name}: ${iv.purpose?.split(".")[0]}`).join(". ")}. ${protocol.imTherapies?.length > 0 ? `Plus IM therapies: ${protocol.imTherapies.map((im: any) => im.name).join(", ")}` : ""}.`,
      content: { iv: protocol.ivTherapies, im: protocol.imTherapies || [] }
    });
  }

  slides.push({
    id: "mitostac",
    type: "mitostac",
    title: "MitoStac - Mitochondrial Activation",
    narration: "MitoStac is our proprietary mitochondrial activation complex. It supports NAD plus, Sirtuin 1, 3, and 6 activation, ATP generation, AMPK activation, antioxidant defense, and mitochondrial turnover. It replaces the need for NMN, NR, TMG, PQQ, CoQ10, ALA, ALCAR, and more in a single comprehensive formula.",
    content: {
      benefits: [
        "NAD+ restoration", "SIRT1/3/6 activation", "ATP generation",
        "AMPK activation", "Antioxidant defense", "Mitochondrial turnover"
      ],
      replaces: ["NMN", "NR", "TMG", "PQQ", "CoQ10", "ALA", "ALCAR"]
    }
  });

  slides.push({
    id: "hbot",
    type: "hbot",
    title: "Hyperbaric Oxygen Therapy (HBOT)",
    narration: `Hyperbaric oxygen therapy at 2.0 atmospheres absolute for 60 minutes, 3 times weekly for 90 days. HBOT enhances mitochondrial repair, immune synergy, and creates an oxygen-rich environment hostile to cancer cells and anaerobic pathogens. Most diseases, viruses, and harmful pathogens thrive in anaerobic environments with less oxygen and more acid. HBOT shifts this balance dramatically.`,
    content: {
      pressure: "2.0 ATA",
      duration: "60 minutes",
      frequency: "3x weekly",
      totalDuration: "90 days",
      benefits: ["Mitochondrial repair", "Immune synergy", "Anti-cancer environment", "Pathogen elimination", "Tissue oxygenation", "Stem cell mobilization"]
    }
  });

  const dentalRecs = protocol.lifestyleRecommendations?.filter((r: any) => r.category === "Dental") || [];
  if (dentalRecs.length > 0) {
    slides.push({
      id: "dental-dangers",
      type: "dental",
      title: "Dental Dangers & Amalgam Removal",
      narration: `One of the most urgent interventions for ${pn} is the safe removal of the mercury amalgam filling that has been in place for approximately 50 years. Mercury vapor from amalgam fillings suppresses immune function, disrupts the endocrine system, and creates an environment for cell pathogen colonization. We must also evaluate for old cavitations, which are jawbone infections that can harbor anaerobic bacteria. These bacteria can seed distant infections including cancer sites. Additionally, any root canals must be assessed for pathogen colonization.`,
      content: { recommendations: dentalRecs }
    });
  }

  const stemCellRecs = protocol.lifestyleRecommendations?.filter((r: any) => r.category === "Stem Cells") || [];
  if (stemCellRecs.length > 0) {
    slides.push({
      id: "stem-cells",
      type: "stem-cells",
      title: "Stem Cell Concierge",
      narration: `During Phase 2 of the protocol, ${pn} will be evaluated for stem cell therapy through holistic care dot com. Mesenchymal stem cells offer powerful tissue regeneration, immune modulation, and anti-inflammatory support. This therapy can accelerate healing and complement the peptide and supplement protocols already in place.`,
      content: { recommendations: stemCellRecs }
    });
  }

  if (protocol.dietaryGuidelines?.length > 0) {
    slides.push({
      id: "diet-plan",
      type: "diet",
      title: "DIANE Anti-Cancer Diet Protocol",
      narration: `The dietary protocol is designed specifically for ${pn}'s condition. Zero sugar, as cancer cells consume 18 times more glucose than normal cells. Zero GMO foods. Zero alcohol for 90 days. Organic only. Cruciferous vegetables daily for estrogen metabolism support. This is the foundation that makes every other therapy more effective.`,
      content: { guidelines: protocol.dietaryGuidelines }
    });

    slides.push({
      id: "alkaline-chart",
      type: "alkaline-chart",
      title: "Alkaline Food Chart",
      narration: "Always eat foods with seeds. Try to start a garden with landrace seeds, which are seeds not genetically modified by man. Many gluten issues stem from the type of grain, its modification, and the way it is stored. The human gut, already damaged by American farming practices, cannot properly digest the indigestible wheat they feed us. Durum wheat is an excellent alternative for pasta.",
      content: {
        alkaline: ["Leafy greens", "Cruciferous vegetables", "Avocado", "Cucumber", "Celery", "Sprouts", "Sea vegetables", "Lemons/Limes", "Watermelon", "Almonds", "Coconut"],
        acidic: ["Sugar (all forms)", "Processed foods", "Conventional dairy", "Conventional meat", "Alcohol", "Coffee (limit)", "Seed oils", "Wheat/Gluten (conventional)"],
        superfoods: ["Moringa", "Chlorella", "Marine Phytoplankton", "Spirulina", "Turmeric", "Bone Broth"]
      }
    });
  }

  if (protocol.labsRequired?.length > 0) {
    slides.push({
      id: "labs",
      type: "labs",
      title: "Required Laboratory Testing",
      narration: `To monitor ${pn}'s progress and ensure safety, we require ${protocol.labsRequired.length} laboratory tests. These include hormone panels, mineral levels, heavy metals, mycotoxin panels, and the RGCC circulating tumor cell analysis for personalized cancer vaccine development.`,
      content: { labs: protocol.labsRequired }
    });
  }

  if (protocol.followUpPlan?.length > 0) {
    slides.push({
      id: "follow-up",
      type: "follow-up",
      title: "Follow-Up Plan",
      narration: `We have ${protocol.followUpPlan.length} scheduled check-points throughout the protocol. ${protocol.followUpPlan.slice(0, 3).map((f: any) => `Week ${f.weekNumber}: ${f.action}`).join(". ")}. Regular monitoring ensures we can adjust the protocol based on ${pn}'s response.`,
      content: { plan: protocol.followUpPlan }
    });
  }

  if (citations?.length > 0) {
    slides.push({
      id: "research",
      type: "research",
      title: "Research Backing Our Protocols",
      narration: `Our protocols are backed by peer-reviewed scientific research. We have ${citations.length} citations supporting the therapies used in this protocol. Every intervention has a scientific basis.`,
      content: { citations }
    });
  }

  slides.push({
    id: "drive-links",
    type: "drive-links",
    title: "Additional Resources & Google Drive Links",
    narration: `Additional resources are available in the Forgotten Formula Google Drive Library. This includes recommended books, research papers, case studies, and clinical protocols. Specific resources for ${pn} include the FF Detox Bath protocol, Liver and Gallbladder Cleanse instructions, the 5-Day Fast guide, and recommended reading materials.`,
    content: {
      links: [
        { title: "FF Detox Bath Protocol", category: "Detox" },
        { title: "Liver & Gallbladder Cleanse Guide", category: "Detox" },
        { title: "5-Day Fast Protocol", category: "Detox" },
        { title: "Rapid Virus Recovery", category: "Recommended Reading" },
        { title: "A Cancer Therapy: Results of Fifty Cases (Dr. Gerson)", category: "Clinical Protocols" },
        { title: "One Minute Cure", category: "Holistic Modalities" },
        { title: "Cymatics: A Study of Wave Phenomena", category: "Research" }
      ]
    }
  });

  slides.push({
    id: "commitment",
    type: "commitment",
    title: "My Commitment to You",
    narration: `I will do everything in my power and knowledge to focus on the root of all problems. Most doctors focus only on the symptoms, not the underlying cause of the disease or issue. We will not give up on you, but you need to work with us on every step of this protocol. Don't lose hope and don't give up. There is no single pill or capsule that will fix this. Only a commitment to follow the steps laid herein. If you choose to do so, the endocannabinoid system, the gut, and your body will take care of itself. Homeostasis is about balance in the body.`,
    content: {
      message: "I will do everything in my power and knowledge to focus on the root of all problems. Most doctors focus only on the symptoms, not the underlying cause of the disease or issue. We will not give up on you, but you need to work with us on every step of this protocol. Don't lose hope and don't give up! There is no single pill or capsule that will fix this. Only a commitment to follow the steps laid herein if you choose to do so the ECS, the gut and your body will take care of itself. Homeostasis is about balance in the body."
    }
  });

  return slides;
}
