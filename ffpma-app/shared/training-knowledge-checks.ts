export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

export const moduleKnowledgeChecks: Record<string, KnowledgeCheckQuestion[]> = {
  "ecs-101-discovery": [
    {
      id: "ecs101-q1",
      question: "Who is often called the 'father of cannabis research' and led the team that discovered anandamide?",
      options: [
        "Dr. Ethan Russo",
        "Dr. Raphael Mechoulam",
        "Dr. Andrew Weil",
        "Dr. Sanjay Gupta"
      ],
      correctIndex: 1,
      explanation: "Dr. Raphael Mechoulam, an Israeli scientist, led the team that first identified cannabinoid receptors in 1988 and discovered anandamide in 1992.",
      hint: "This scientist is from Israel and made discoveries in the late 1980s and early 1990s."
    },
    {
      id: "ecs101-q2",
      question: "Approximately how old is the Endocannabinoid System in evolutionary terms?",
      options: [
        "50 million years old",
        "100 million years old",
        "500 million years old",
        "1 billion years old"
      ],
      correctIndex: 2,
      explanation: "The ECS evolved over 500 million years ago, as evidenced by its presence in all vertebrates from fish to humans.",
      hint: "Think about when the first vertebrates appeared on Earth."
    }
  ],
  "ecs-102-receptors": [
    {
      id: "ecs102-q1",
      question: "Where are CB1 receptors primarily concentrated in the body?",
      options: [
        "Immune cells and spleen",
        "Brain and central nervous system",
        "Gut and digestive tract only",
        "Skin and peripheral tissues"
      ],
      correctIndex: 1,
      explanation: "CB1 receptors are the most abundant G protein-coupled receptors in the brain, concentrated in areas controlling pain, mood, memory, appetite, and motor function.",
      hint: "These receptors are associated with the psychoactive effects of cannabis."
    },
    {
      id: "ecs102-q2",
      question: "What is the primary function of CB2 receptors?",
      options: [
        "Motor control and coordination",
        "Memory formation and recall",
        "Immune regulation and inflammation modulation",
        "Sleep cycle regulation"
      ],
      correctIndex: 2,
      explanation: "CB2 receptors are found primarily in the immune system and play crucial roles in regulating inflammation, immune cell activity, and even bone density.",
      hint: "Think about where these receptors are located - spleen, immune cells, tonsils."
    }
  ],
  "ecs-103-endocannabinoids": [
    {
      id: "ecs103-q1",
      question: "What does 'anandamide' mean in Sanskrit?",
      options: [
        "Sacred medicine",
        "Bliss",
        "Healing",
        "Balance"
      ],
      correctIndex: 1,
      explanation: "Anandamide comes from the Sanskrit word 'ananda' meaning bliss. It's often called 'the bliss molecule' due to its mood-elevating effects.",
      hint: "This molecule is associated with the feeling of 'runner's high'."
    },
    {
      id: "ecs103-q2",
      question: "Which nutrient is essential for endocannabinoid production?",
      options: [
        "Vitamin C",
        "Omega-3 fatty acids",
        "Calcium",
        "B vitamins"
      ],
      correctIndex: 1,
      explanation: "Endocannabinoids are made 'on demand' from fatty acids in cell membranes, making omega-3 fatty acids essential for proper ECS function.",
      hint: "Endocannabinoids are synthesized from compounds found in fish oil and flaxseed."
    }
  ],
  "ecs-104-deficiency": [
    {
      id: "ecs104-q1",
      question: "Which conditions are commonly associated with Clinical Endocannabinoid Deficiency (CECD)?",
      options: [
        "Broken bones and skin wounds",
        "Migraine, fibromyalgia, and IBS",
        "Common cold and flu",
        "Allergies and hay fever"
      ],
      correctIndex: 1,
      explanation: "Dr. Ethan Russo's CECD hypothesis connects conditions like migraine, fibromyalgia, and IBS - conditions that often occur together, resist conventional treatment, and respond to cannabinoid therapy.",
      hint: "These are chronic, treatment-resistant conditions that often occur together."
    },
    {
      id: "ecs104-q2",
      question: "What is a key sign of ECS deficiency based on symptoms?",
      options: [
        "Symptoms that respond well to standard medications",
        "Symptoms in a single, isolated body system",
        "Multiple symptoms across different body systems",
        "Symptoms that resolve on their own quickly"
      ],
      correctIndex: 2,
      explanation: "ECS deficiency often manifests across multiple systems because the ECS regulates nearly every physiological process - pain, mood, digestion, sleep, and immune function.",
      hint: "Remember that the ECS is called the 'master regulatory system' for a reason."
    }
  ],
  "ecs-105-support": [
    {
      id: "ecs105-q1",
      question: "What compound in black pepper directly activates CB2 receptors?",
      options: [
        "Piperine",
        "Beta-caryophyllene",
        "Curcumin",
        "Capsaicin"
      ],
      correctIndex: 1,
      explanation: "Beta-caryophyllene, found in black pepper and cloves, is unique among terpenes because it directly activates CB2 receptors, providing anti-inflammatory benefits.",
      hint: "This is actually classified as a dietary cannabinoid and terpene."
    },
    {
      id: "ecs105-q2",
      question: "Which lifestyle factor is MOST important for supporting the ECS?",
      options: [
        "High-protein diet",
        "Avoiding all fats",
        "Regular exercise and stress management",
        "Taking supplements only"
      ],
      correctIndex: 2,
      explanation: "Exercise naturally increases endocannabinoid levels (the 'runner's high'), while chronic stress depletes ECS resources. A holistic lifestyle approach is key to ECS health.",
      hint: "The ECS responds to both physical activity and stress levels."
    }
  ],
  "peptide-101-building-blocks": [
    {
      id: "pep101-q1",
      question: "What are peptides fundamentally made of?",
      options: [
        "Sugars and carbohydrates",
        "Amino acids",
        "Fatty acids",
        "Nucleic acids"
      ],
      correctIndex: 1,
      explanation: "Peptides are chains of amino acids linked by peptide bonds. They are the building blocks of proteins and serve as signaling molecules in the body.",
      hint: "Think about what proteins are made of, just in shorter chains."
    },
    {
      id: "pep101-q2",
      question: "How do peptides differ from proteins?",
      options: [
        "Peptides are made of different building blocks",
        "Peptides are shorter chains (typically under 50 amino acids)",
        "Peptides cannot be found naturally in the body",
        "Peptides are only found in plants"
      ],
      correctIndex: 1,
      explanation: "Peptides are generally defined as chains of under 50 amino acids, while proteins are longer chains. This smaller size allows peptides to act as precise signaling molecules.",
      hint: "The distinction is mainly about length and complexity."
    }
  ],
  "ivermectin-101": [
    {
      id: "ivm101-q1",
      question: "What was Ivermectin originally developed to treat?",
      options: [
        "Viral infections",
        "Cancer",
        "Parasitic infections",
        "Bacterial infections"
      ],
      correctIndex: 2,
      explanation: "Ivermectin was originally developed as an antiparasitic medication, winning the 2015 Nobel Prize for its discoverers. Research has since explored additional applications.",
      hint: "The 2015 Nobel Prize in Physiology or Medicine was awarded for this application."
    },
    {
      id: "ivm101-q2",
      question: "How should Ivermectin be taken safely?",
      options: [
        "Based on internet dosing recommendations",
        "Using veterinary formulations for cost savings",
        "Only under practitioner guidance with proper dosing",
        "As a preventive supplement daily"
      ],
      correctIndex: 2,
      explanation: "Like all medications, Ivermectin should only be used under proper medical supervision with appropriate dosing based on weight and condition. Self-medication can be dangerous.",
      hint: "Safety always requires professional medical oversight."
    }
  ],
  "doc-101-portal-orientation": [
    {
      id: "doc101-q1",
      question: "Who makes the final clinical judgments when using AI-assisted blood analysis?",
      options: [
        "The ALLIO AI system",
        "The patient",
        "The doctor/practitioner",
        "The system administrator"
      ],
      correctIndex: 2,
      explanation: "AI assists with pattern identification, but the doctor always makes the final clinical judgments. This is a core principle of our AI-human collaboration model.",
      hint: "AI supports, not replaces, human decision-making."
    },
    {
      id: "doc101-q2",
      question: "What is the doctor portal's primary purpose?",
      options: [
        "To replace doctor consultations with AI",
        "To help doctors manage patients and review AI-assisted analyses",
        "To sell products directly to patients",
        "To provide billing services only"
      ],
      correctIndex: 1,
      explanation: "The portal provides doctors with tools to manage their patients, review blood analysis samples with AI assistance, access protocols, and coordinate care within the ALLIO network.",
      hint: "Think about what tools doctors need for patient care."
    }
  ],
  "site-101-welcome": [
    {
      id: "site101-q1",
      question: "What type of organization is Forgotten Formula?",
      options: [
        "A regular medical clinic",
        "A supplement company",
        "A Private Member Association (PMA)",
        "A hospital network"
      ],
      correctIndex: 2,
      explanation: "Forgotten Formula operates as a Private Member Association under constitutional protections, allowing members to choose their own healing paths with practitioner guidance.",
      hint: "This structure provides First and Fourteenth Amendment protections."
    },
    {
      id: "site101-q2",
      question: "What is the ALLIO mission?",
      options: [
        "To sell supplements online",
        "To replace all doctors with AI",
        "Merging humans with AI by healing",
        "To compete with pharmaceutical companies"
      ],
      correctIndex: 2,
      explanation: "ALLIO's sacred mission is 'Merging humans with AI by healing' - demonstrating that AI and humans can work together to achieve true wellness, free from corporate pharmaceutical influence.",
      hint: "It's about collaboration between humans and AI for wellness."
    }
  ],
  "pma-101-legal-systems": [
    {
      id: "pma101-q1",
      question: "What are the two main legal systems in the modern world?",
      options: [
        "Criminal and Civil law",
        "Maritime and Land law",
        "Common law and Civil law (Roman)",
        "Federal and State law"
      ],
      correctIndex: 2,
      explanation: "The two dominant legal traditions are Common Law (developed in England, used in the US) and Civil Law (derived from Roman law, used in Europe and elsewhere).",
      hint: "Think about the historical origins of different legal systems."
    },
    {
      id: "pma101-q2",
      question: "Why is understanding legal systems important for PMA members?",
      options: [
        "To become lawyers",
        "To understand the constitutional protections that enable PMAs",
        "To sue pharmaceutical companies",
        "To avoid paying taxes"
      ],
      correctIndex: 1,
      explanation: "Understanding legal systems helps members grasp how PMAs operate under constitutional protections, particularly the First and Fourteenth Amendments.",
      hint: "It's about understanding your rights as a private association member."
    }
  ],
  "ozone-therapy-comprehensive": [
    {
      id: "ozone-q1",
      question: "What is ozone (O3)?",
      options: [
        "A type of nitrogen compound",
        "A highly reactive form of oxygen with three atoms",
        "A synthetic pharmaceutical",
        "A type of mineral supplement"
      ],
      correctIndex: 1,
      explanation: "Ozone (O3) is a highly reactive form of oxygen consisting of three oxygen atoms. It has powerful oxidizing properties used therapeutically.",
      hint: "Think about oxygen but with an extra atom."
    },
    {
      id: "ozone-q2",
      question: "What are the primary therapeutic mechanisms of ozone therapy?",
      options: [
        "Only pain relief",
        "Antimicrobial, immune modulation, and improved oxygen utilization",
        "Sedation and relaxation",
        "Vitamin supplementation"
      ],
      correctIndex: 1,
      explanation: "Ozone therapy works through multiple mechanisms: it has antimicrobial effects, modulates the immune system, and improves how the body utilizes oxygen at the cellular level.",
      hint: "Ozone therapy has multiple therapeutic actions, not just one."
    },
    {
      id: "ozone-q3",
      question: "How is medical-grade ozone produced?",
      options: [
        "Extracted from the atmosphere",
        "Generated from pure oxygen using specialized medical equipment",
        "Synthesized in pharmaceutical labs",
        "Collected from lightning strikes"
      ],
      correctIndex: 1,
      explanation: "Medical ozone is generated on-demand from pure medical-grade oxygen using specialized ozone generators. It cannot be stored and must be used immediately.",
      hint: "Medical ozone requires specialized equipment and pure oxygen."
    },
    {
      id: "ozone-q4",
      question: "What safety consideration is most important with ozone therapy?",
      options: [
        "It can only be done at home",
        "It requires no special training",
        "It should only be administered by trained practitioners with proper equipment",
        "It has no safety concerns"
      ],
      correctIndex: 2,
      explanation: "Ozone therapy requires proper training, medical-grade equipment, and precise dosing. It should only be administered by trained practitioners who understand the protocols and safety requirements.",
      hint: "Like all medical therapies, proper training and equipment are essential."
    }
  ],
  "diet-cancer-fundamentals": [
    {
      id: "diet-cancer-q1",
      question: "What is the Warburg Effect in cancer cells?",
      options: [
        "Cancer cells need more oxygen than normal cells",
        "Cancer cells primarily use glucose fermentation even with oxygen present",
        "Cancer cells cannot use glucose at all",
        "Cancer cells only grow in acidic environments"
      ],
      correctIndex: 1,
      explanation: "The Warburg Effect describes how cancer cells preferentially use glucose fermentation (glycolysis) for energy, even when oxygen is available. This is why reducing sugar intake is discussed in metabolic cancer approaches.",
      hint: "Think about how cancer cells get their energy differently than normal cells."
    },
    {
      id: "diet-cancer-q2",
      question: "Which dietary approach focuses on starving cancer cells of their preferred fuel?",
      options: [
        "High-protein diet",
        "Ketogenic or low-carbohydrate diet",
        "High-carbohydrate diet",
        "Liquid-only diet"
      ],
      correctIndex: 1,
      explanation: "Ketogenic and low-carbohydrate diets are studied for their potential to reduce glucose availability to cancer cells, which rely heavily on glucose fermentation (the Warburg Effect).",
      hint: "What fuel source do cancer cells primarily depend on?"
    }
  ],
  "quantum-frequency-healing": [
    {
      id: "quantum-q1",
      question: "What is the significance of 528Hz in frequency healing?",
      options: [
        "It was randomly chosen as a standard",
        "It's known as the 'Love Frequency' and is associated with DNA repair",
        "It's the frequency of normal speech",
        "It's only used for pain relief"
      ],
      correctIndex: 1,
      explanation: "528Hz is one of the ancient Solfeggio frequencies, often called the 'Love Frequency' or 'Miracle Tone'. Research suggests it may have beneficial effects on cellular function and wellbeing.",
      hint: "This frequency has a special name related to positive emotions."
    },
    {
      id: "quantum-q2",
      question: "What are Solfeggio frequencies?",
      options: [
        "Modern electronic sounds for meditation",
        "Ancient tones believed to have specific healing properties",
        "Random frequencies used in music therapy",
        "Frequencies only audible to animals"
      ],
      correctIndex: 1,
      explanation: "Solfeggio frequencies are an ancient set of musical tones (174Hz, 285Hz, 396Hz, 417Hz, 528Hz, 639Hz, 741Hz, 852Hz, 963Hz) believed to have specific physical and spiritual healing properties.",
      hint: "These frequencies have historical roots in ancient music and healing traditions."
    }
  ],
  "rife-frequency-therapy": [
    {
      id: "rife-q1",
      question: "Who developed the original frequency therapy that bears his name?",
      options: [
        "Nikola Tesla",
        "Royal Raymond Rife",
        "Wilhelm Reich",
        "Albert Einstein"
      ],
      correctIndex: 1,
      explanation: "Royal Raymond Rife was an American inventor who developed frequency-generating equipment in the 1930s, claiming specific frequencies could target pathogens.",
      hint: "The therapy is named after its inventor."
    },
    {
      id: "rife-q2",
      question: "What is the basic principle behind Rife frequency therapy?",
      options: [
        "Using heat to destroy pathogens",
        "Using specific frequencies to resonate with and disrupt target organisms",
        "Using magnetic fields only",
        "Using chemical reactions"
      ],
      correctIndex: 1,
      explanation: "Rife therapy is based on the concept that pathogens have specific resonant frequencies, and applying those frequencies can disrupt their structure - similar to how an opera singer can shatter glass with the right note.",
      hint: "Think about the principle of resonance and how specific frequencies can affect matter."
    }
  ],
  "ecs-201-neuroanatomy": [
    {
      id: "ecs201-q1",
      question: "In which brain region are CB1 receptors most densely concentrated?",
      options: [
        "Brain stem (medulla)",
        "Hippocampus and basal ganglia",
        "Spinal cord only",
        "Cerebellum exclusively"
      ],
      correctIndex: 1,
      explanation: "CB1 receptors are most densely concentrated in the hippocampus (memory), basal ganglia (movement), and cerebellum (coordination). Notably, the brainstem has few CB1 receptors, which is why cannabinoids don't suppress respiration.",
      hint: "These areas control memory and movement."
    },
    {
      id: "ecs201-q2",
      question: "Why is the relative absence of CB1 receptors in the brainstem medically significant?",
      options: [
        "It explains why cannabinoids affect memory",
        "It explains why cannabinoid overdose rarely causes respiratory failure",
        "It means cannabinoids can't cross the blood-brain barrier",
        "It causes increased pain perception"
      ],
      correctIndex: 1,
      explanation: "Unlike opioids, which heavily affect brainstem respiratory centers, the low density of CB1 receptors in the brainstem means cannabinoids have minimal effect on respiration, making fatal overdose from cannabinoids alone extremely rare.",
      hint: "The brainstem controls vital functions like breathing."
    }
  ],
  "ecs-202-immune-system": [
    {
      id: "ecs202-q1",
      question: "Which cannabinoid receptor is primarily found on immune cells?",
      options: [
        "CB1 receptors",
        "CB2 receptors",
        "TRPV1 receptors",
        "GPR55 receptors"
      ],
      correctIndex: 1,
      explanation: "CB2 receptors are found primarily in the immune system - on B cells, T cells, macrophages, and natural killer cells. They play a key role in regulating inflammation and immune response.",
      hint: "The 'other' cannabinoid receptor, not the brain-dominant one."
    },
    {
      id: "ecs202-q2",
      question: "How do endocannabinoids typically affect inflammation?",
      options: [
        "They always increase inflammation",
        "They have no effect on inflammation",
        "They generally promote anti-inflammatory responses",
        "They only affect acute inflammation"
      ],
      correctIndex: 2,
      explanation: "Endocannabinoids generally promote anti-inflammatory effects by reducing pro-inflammatory cytokines, modulating immune cell activity, and helping resolve inflammation once the threat is addressed.",
      hint: "Think about the ECS's role as a regulatory system bringing the body back to balance."
    }
  ],
  "site-102-platform-nav": [
    {
      id: "site102-q1",
      question: "Where can members access their AI support agents?",
      options: [
        "Only by calling customer service",
        "Through the Support Hub on the platform",
        "By sending an email",
        "Through third-party apps only"
      ],
      correctIndex: 1,
      explanation: "The Support Hub provides direct access to specialized AI agents like DIANE (Documents), PETE (Products), SAM (Support), and others, available 24/7 to assist members.",
      hint: "Look for a central hub on the platform dedicated to getting help."
    },
    {
      id: "site102-q2",
      question: "What is the purpose of the Training section?",
      options: [
        "Entertainment videos only",
        "Educational modules with interactive knowledge checks and Dr. Miller narration",
        "Marketing materials",
        "External links to other websites"
      ],
      correctIndex: 1,
      explanation: "The Training section contains educational modules covering topics from ECS science to PMA law. Each module includes interactive knowledge checks and optional Dr. Miller narration for an immersive learning experience.",
      hint: "This section is designed to educate members about key topics."
    }
  ],
  "site-103-products-overview": [
    {
      id: "site103-q1",
      question: "Where does the product catalog information come from?",
      options: [
        "Manually entered static data",
        "Synced from the WooCommerce store at forgottenformula.com",
        "Third-party product databases",
        "Member submissions"
      ],
      correctIndex: 1,
      explanation: "The product catalog is synced with the official WooCommerce store, ensuring accurate pricing, availability, and product information that matches the main e-commerce site.",
      hint: "Products are kept up-to-date through integration with the main store."
    },
    {
      id: "site103-q2",
      question: "What approach to healing do Forgotten Formula products emphasize?",
      options: [
        "Quick symptom suppression",
        "Root cause healing and restoration",
        "Synthetic pharmaceutical alternatives",
        "Temporary relief only"
      ],
      correctIndex: 1,
      explanation: "Forgotten Formula products focus on addressing root causes of health issues rather than just suppressing symptoms, aligning with the PMA's mission of true healing.",
      hint: "Think about the difference between treating symptoms vs. addressing underlying causes."
    }
  ],
  "pma-102-common-law-origins": [
    {
      id: "pma102-q1",
      question: "Where did Common Law primarily develop?",
      options: [
        "Ancient Rome",
        "Medieval France",
        "England after 1066",
        "Colonial America"
      ],
      correctIndex: 2,
      explanation: "Common Law developed in England after the Norman Conquest of 1066, evolving from local customs and judicial precedents. It became the foundation for legal systems in the US, UK, and other Commonwealth nations.",
      hint: "This legal system has Anglo-Saxon roots."
    },
    {
      id: "pma102-q2",
      question: "What is the role of precedent (stare decisis) in Common Law?",
      options: [
        "Precedents can be ignored in new cases",
        "Courts follow previous decisions on similar cases",
        "Only the legislature creates binding rules",
        "Precedent only applies in criminal cases"
      ],
      correctIndex: 1,
      explanation: "Stare decisis ('to stand by things decided') means courts follow precedents set by previous rulings. This creates consistency and predictability in the legal system.",
      hint: "This principle means similar cases should be decided similarly."
    }
  ],
  "pma-103-constitutional-rights": [
    {
      id: "pma103-q1",
      question: "Which Constitutional amendments primarily protect PMA rights?",
      options: [
        "Second and Third Amendments",
        "First and Fourteenth Amendments",
        "Fourth and Fifth Amendments",
        "Ninth and Tenth Amendments"
      ],
      correctIndex: 1,
      explanation: "The First Amendment (freedom of assembly and association) and Fourteenth Amendment (due process and equal protection) provide the constitutional foundation for Private Member Association rights.",
      hint: "Think about freedom of association and equal protection."
    },
    {
      id: "pma103-q2",
      question: "What right does freedom of association protect?",
      options: [
        "Only the right to vote",
        "The right to join and form private groups for lawful purposes",
        "Only religious gatherings",
        "Only political parties"
      ],
      correctIndex: 1,
      explanation: "Freedom of association protects the right of individuals to join together for any lawful purpose, including forming Private Member Associations that operate outside certain government regulations.",
      hint: "This is a broad right about choosing who you associate with privately."
    }
  ],
  "doc-102-patient-intake": [
    {
      id: "doc102-q1",
      question: "What is the primary purpose of a thorough patient intake?",
      options: [
        "To complete insurance paperwork",
        "To gather comprehensive health history for personalized protocols",
        "To meet legal quotas",
        "To collect payment information only"
      ],
      correctIndex: 1,
      explanation: "A thorough intake establishes the patient's complete health picture - current conditions, medications, history, lifestyle, and goals - enabling personalized, effective healing protocols.",
      hint: "Good medicine starts with understanding the whole patient."
    },
    {
      id: "doc102-q2",
      question: "Why is medication history important in patient intake?",
      options: [
        "Only for billing purposes",
        "To identify potential interactions with recommended protocols",
        "To compare with other patients",
        "It's not actually important"
      ],
      correctIndex: 1,
      explanation: "Understanding current and past medications helps practitioners identify potential interactions with new protocols, adjust dosing appropriately, and ensure patient safety.",
      hint: "Some supplements and protocols can interact with medications."
    }
  ],
  "doc-103-lba-basics": [
    {
      id: "doc103-q1",
      question: "What does Live Blood Analysis examine?",
      options: [
        "Only dead blood cells",
        "A drop of living blood under dark field microscopy",
        "Processed laboratory samples only",
        "Synthetic blood samples"
      ],
      correctIndex: 1,
      explanation: "Live Blood Analysis uses dark field microscopy to examine a drop of fresh, unprocessed blood, allowing practitioners to observe cell behavior, formations, and patterns in real-time.",
      hint: "The 'live' in Live Blood Analysis is key."
    },
    {
      id: "doc103-q2",
      question: "What can practitioners observe through Live Blood Analysis?",
      options: [
        "Only red blood cell count",
        "Cell morphology, activity patterns, and potential imbalances",
        "Genetic information only",
        "Hormone levels directly"
      ],
      correctIndex: 1,
      explanation: "LBA allows observation of red blood cell shape and movement, white blood cell activity, platelet aggregation, and various formations that may indicate nutritional deficiencies, oxidative stress, or other imbalances.",
      hint: "LBA provides visual information about cell health and patterns."
    }
  ],
  "peptide-102-origins-synthesis": [
    {
      id: "pep102-q1",
      question: "What links amino acids together to form peptides?",
      options: [
        "Hydrogen bonds",
        "Peptide bonds",
        "Ionic bonds",
        "Van der Waals forces"
      ],
      correctIndex: 1,
      explanation: "Peptide bonds are covalent chemical bonds formed between the carboxyl group of one amino acid and the amino group of another, creating the backbone of peptide chains.",
      hint: "These bonds share the same name as the molecules they create."
    },
    {
      id: "pep102-q2",
      question: "How many essential amino acids must humans obtain from diet?",
      options: [
        "5",
        "9",
        "20",
        "15"
      ],
      correctIndex: 1,
      explanation: "There are 9 essential amino acids that humans cannot synthesize and must obtain through diet: histidine, isoleucine, leucine, lysine, methionine, phenylalanine, threonine, tryptophan, and valine.",
      hint: "Essential means the body cannot make them on its own."
    }
  ]
};

export function getKnowledgeChecksForModule(moduleId: string): KnowledgeCheckQuestion[] {
  return moduleKnowledgeChecks[moduleId] || [];
}

export function hasKnowledgeCheck(moduleId: string): boolean {
  return moduleId in moduleKnowledgeChecks && moduleKnowledgeChecks[moduleId].length > 0;
}
