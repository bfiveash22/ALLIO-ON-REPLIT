import { db } from "./db";
import { categories, products, programs, trainingModules, trainingTracks, trackModules } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("Checking if database needs seeding...");
  
  // Check if categories already exist
  const existingCategories = await db.select().from(categories).limit(1);
  if (existingCategories.length > 0) {
    console.log("Database already has base data, checking for new training modules...");
    await seedTrainingModulesIfNeeded();
    return;
  }

  console.log("Seeding database with initial data...");

  // Seed categories
  const categoryData = [
    { name: "Peptides & Bioregulators", slug: "peptides", description: "Injectable and oral peptides for cellular regeneration", sortOrder: 1, isActive: true },
    { name: "Exosomes", slug: "exosomes", description: "100 Billion exosomes for regenerative therapy", sortOrder: 2, isActive: true },
    { name: "Vitamins & Minerals", slug: "vitamins", description: "Whole plant vitamins and trace minerals", sortOrder: 3, isActive: true },
    { name: "IV Supplies", slug: "iv-supplies", description: "Professional-grade IV therapy supplies", sortOrder: 4, isActive: true },
    { name: "Protocols", slug: "protocols", description: "Comprehensive treatment protocols", sortOrder: 5, isActive: true },
  ];

  const insertedCategories = await db.insert(categories).values(categoryData).returning();
  console.log(`Inserted ${insertedCategories.length} categories`);

  // Create a map for easy lookup
  const categoryMap = new Map(insertedCategories.map(c => [c.slug, c.id]));

  // Seed products
  const productData = [
    { 
      name: "BPC-157 Injectable", 
      slug: "bpc-157-injectable", 
      description: "Body Protection Compound-157 for healing and recovery. This peptide has been shown to accelerate wound healing and tissue repair.", 
      shortDescription: "Premium healing peptide for tissue repair", 
      categoryId: categoryMap.get("peptides")!, 
      retailPrice: "89.00", 
      wholesalePrice: "65.00", 
      doctorPrice: "55.00", 
      sku: "BPC-157-INJ", 
      stockQuantity: 150, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: true, 
      productType: "Injectable Peptide", 
      dosageInfo: "Standard dosing is 250-500mcg daily", 
      protocolInfo: "Typically used for 4-8 weeks" 
    },
    { 
      name: "Thymosin Alpha-1", 
      slug: "thymosin-alpha-1", 
      description: "Immune-modulating peptide for enhanced immunity and cellular health.", 
      shortDescription: "Immune support peptide", 
      categoryId: categoryMap.get("peptides")!, 
      retailPrice: "145.00", 
      wholesalePrice: "105.00", 
      doctorPrice: "85.00", 
      sku: "TA1-001", 
      stockQuantity: 75, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: true, 
      productType: "Injectable Peptide", 
      dosageInfo: "1.6mg twice weekly", 
      protocolInfo: "Ongoing protocol for immune support" 
    },
    { 
      name: "Exosome Solution - 100B", 
      slug: "exosome-100b", 
      description: "100 Billion exosomes for advanced regenerative therapy. Sourced from young, healthy donors.", 
      shortDescription: "Premium exosome solution for regeneration", 
      categoryId: categoryMap.get("exosomes")!, 
      retailPrice: "3500.00", 
      wholesalePrice: "2800.00", 
      doctorPrice: "2400.00", 
      sku: "EXO-100B", 
      stockQuantity: 25, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: true, 
      productType: "Regenerative", 
      dosageInfo: "As directed by practitioner", 
      protocolInfo: "Single or multi-session protocols available" 
    },
    { 
      name: "Liposomal Vitamin C", 
      slug: "liposomal-vitamin-c", 
      description: "High-absorption liposomal vitamin C for optimal immune support and antioxidant protection.", 
      shortDescription: "High-absorption vitamin C", 
      categoryId: categoryMap.get("vitamins")!, 
      retailPrice: "45.00", 
      wholesalePrice: "32.00", 
      doctorPrice: "28.00", 
      sku: "LVC-001", 
      stockQuantity: 200, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: false, 
      productType: "Oral Supplement", 
      dosageInfo: "1-2 packets daily", 
      protocolInfo: "Daily supplementation recommended" 
    },
    { 
      name: "Full Mineral Complex", 
      slug: "full-mineral-complex", 
      description: "Complete trace mineral complex from whole plant sources for optimal cellular function.", 
      shortDescription: "Complete trace mineral support", 
      categoryId: categoryMap.get("vitamins")!, 
      retailPrice: "38.00", 
      wholesalePrice: "28.00", 
      doctorPrice: "24.00", 
      sku: "FMC-001", 
      stockQuantity: 180, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: false, 
      productType: "Oral Supplement", 
      dosageInfo: "2 capsules daily with food", 
      protocolInfo: "Daily mineral support protocol" 
    },
    { 
      name: "IV Starter Kit", 
      slug: "iv-starter-kit", 
      description: "Professional-grade IV administration kit including catheter, tubing, and accessories.", 
      shortDescription: "Complete IV administration kit", 
      categoryId: categoryMap.get("iv-supplies")!, 
      retailPrice: "25.00", 
      wholesalePrice: "18.00", 
      doctorPrice: "15.00", 
      sku: "IVK-001", 
      stockQuantity: 300, 
      isActive: true, 
      hasCoa: false, 
      requiresMembership: true, 
      productType: "Medical Supply", 
      protocolInfo: "For trained practitioners only" 
    },
    { 
      name: "NAD+ Injectable", 
      slug: "nad-injectable", 
      description: "Nicotinamide Adenine Dinucleotide for cellular energy and longevity support.", 
      shortDescription: "Cellular energy peptide", 
      categoryId: categoryMap.get("peptides")!, 
      retailPrice: "195.00", 
      wholesalePrice: "145.00", 
      doctorPrice: "125.00", 
      sku: "NAD-001", 
      stockQuantity: 60, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: true, 
      productType: "Injectable", 
      dosageInfo: "250-500mg IV infusion", 
      protocolInfo: "Weekly or bi-weekly protocols" 
    },
    { 
      name: "Glutathione Push", 
      slug: "glutathione-push", 
      description: "High-dose glutathione for detoxification and antioxidant support.", 
      shortDescription: "Master antioxidant solution", 
      categoryId: categoryMap.get("iv-supplies")!, 
      retailPrice: "55.00", 
      wholesalePrice: "40.00", 
      doctorPrice: "35.00", 
      sku: "GLU-001", 
      stockQuantity: 120, 
      isActive: true, 
      hasCoa: true, 
      requiresMembership: true, 
      productType: "IV Solution", 
      dosageInfo: "1000-2000mg IV push", 
      protocolInfo: "Weekly detox protocol" 
    },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();
  console.log(`Inserted ${insertedProducts.length} products`);

  // Seed programs
  const programData = [
    { 
      name: "IV Therapy Certification", 
      slug: "iv-therapy-certification", 
      type: "iv" as const, 
      description: "Complete IV therapy training and certification program for practitioners. Learn proper administration techniques, protocols, and member wellness.", 
      shortDescription: "Professional IV therapy training", 
      price: "2500.00", 
      duration: "4 weeks", 
      isActive: true 
    },
    { 
      name: "Peptide Protocol Mastery", 
      slug: "peptide-protocol-mastery", 
      type: "peptide" as const, 
      description: "Master the art of peptide therapy. Comprehensive training on dosing, stacking, and member protocols.", 
      shortDescription: "Advanced peptide therapy training", 
      price: "1800.00", 
      duration: "6 weeks", 
      isActive: true 
    },
    { 
      name: "Root Cause Protocol", 
      slug: "root-cause-protocol", 
      type: "protocol" as const, 
      description: "Learn the foundational protocols for addressing root cause health issues including mineral balancing, detoxification, and cellular support.", 
      shortDescription: "Foundational healing protocols", 
      price: "995.00", 
      duration: "8 weeks", 
      isActive: true 
    },
    { 
      name: "Advanced Detox Program", 
      slug: "advanced-detox-program", 
      type: "protocol" as const, 
      description: "Comprehensive detoxification program combining IV therapy, peptides, and lifestyle protocols.", 
      shortDescription: "Full-body detoxification", 
      price: "3500.00", 
      duration: "12 weeks", 
      isActive: true 
    },
  ];

  const insertedPrograms = await db.insert(programs).values(programData).returning();
  console.log(`Inserted ${insertedPrograms.length} programs`);

  // Seed training modules for advanced modalities
  const trainingModuleData = [
    {
      title: "Quantum Therapies & Frequency Medicine",
      slug: "quantum-therapies-frequency-medicine",
      description: "Explore energy-based healing modalities including PEMF therapy, scalar energy devices, frequency generators, and bio-resonance technology.",
      category: "Advanced Modalities",
      duration: "2 hours",
      difficulty: "intermediate" as const,
      roleAccess: ["doctor", "clinic", "member"],
      sortOrder: 1,
    },
    {
      title: "Stem Cell & Regenerative Medicine",
      slug: "stem-cell-regenerative-medicine",
      description: "Comprehensive overview of stem cell therapies including exosome treatments, umbilical cord-derived products, PRP protocols, and growth factor activation.",
      category: "Advanced Modalities",
      duration: "3 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 2,
    },
    {
      title: "ECS Ligand Pathway Mastery",
      slug: "ecs-ligand-pathway-mastery",
      description: "Deep dive into the Endocannabinoid System with 12 primary cannabinoid ligands, 234 protein targets, and 708 receptor interactions.",
      category: "Advanced Modalities",
      duration: "4 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 3,
    },
    {
      title: "Cancer Terrain Mapping & Protocols",
      slug: "cancer-terrain-mapping-protocols",
      description: "Systematic approach to understanding and addressing the metabolic terrain of cancer through pathway analysis and protocol development.",
      category: "Advanced Modalities",
      duration: "5 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 4,
    },
    {
      title: "The 5 Rs to Homeostasis",
      slug: "five-rs-to-homeostasis",
      description: "Master the Remove, Replace, Reinoculate, Repair, Rebalance framework for restoring optimal function.",
      category: "Core Protocols",
      duration: "2.5 hours",
      difficulty: "intermediate" as const,
      roleAccess: ["doctor", "clinic", "member"],
      sortOrder: 5,
    },
    {
      title: "Bioregulator Therapy Fundamentals",
      slug: "bioregulator-therapy-fundamentals",
      description: "Understanding Russian bioregulator science including Thymus, Pineal, Liver, Prostate, and Testis bioregulators.",
      category: "Advanced Modalities",
      duration: "2 hours",
      difficulty: "intermediate" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 6,
    },
  ];

  const insertedModules = await db.insert(trainingModules).values(trainingModuleData).returning();
  console.log(`Inserted ${insertedModules.length} training modules`);

  // Create Advanced Modalities training track
  const [advancedTrack] = await db.insert(trainingTracks).values({
    title: "Advanced Treatment Modalities",
    slug: "advanced-treatment-modalities",
    description: "Cutting-edge therapies beyond conventional medicine including quantum therapies, stem cells, ECS optimization, and cancer terrain mapping.",
    totalModules: 4,
    estimatedDuration: "14 hours",
    difficulty: "advanced" as const,
    roleAccess: ["doctor", "clinic"],
  }).returning();
  console.log(`Created training track: ${advancedTrack.title}`);

  // Link modules to track
  const advancedModuleSlugs = [
    "quantum-therapies-frequency-medicine",
    "stem-cell-regenerative-medicine",
    "ecs-ligand-pathway-mastery",
    "cancer-terrain-mapping-protocols",
  ];
  
  let trackOrder = 1;
  for (const slug of advancedModuleSlugs) {
    const mod = insertedModules.find(m => m.slug === slug);
    if (mod) {
      await db.insert(trackModules).values({
        trackId: advancedTrack.id,
        moduleId: mod.id,
        sortOrder: trackOrder++,
        isRequired: true,
      });
    }
  }
  console.log(`Linked ${advancedModuleSlugs.length} modules to track`);

  console.log("Database seeding complete!");
}

// Function to seed new training modules even when base data exists
async function seedTrainingModulesIfNeeded() {
  const newModules = [
    {
      title: "Quantum Therapies & Frequency Medicine",
      slug: "quantum-therapies-frequency-medicine",
      description: "Explore energy-based healing modalities including PEMF therapy, scalar energy devices, frequency generators, and bio-resonance technology.",
      category: "Advanced Modalities",
      duration: "2 hours",
      difficulty: "intermediate" as const,
      roleAccess: ["doctor", "clinic", "member"],
      sortOrder: 1,
    },
    {
      title: "Stem Cell & Regenerative Medicine",
      slug: "stem-cell-regenerative-medicine",
      description: "Comprehensive overview of stem cell therapies including exosome treatments, umbilical cord-derived products, PRP protocols, and growth factor activation.",
      category: "Advanced Modalities",
      duration: "3 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 2,
    },
    {
      title: "ECS Ligand Pathway Mastery",
      slug: "ecs-ligand-pathway-mastery",
      description: "Deep dive into the Endocannabinoid System with 12 primary cannabinoid ligands, 234 protein targets, and 708 receptor interactions.",
      category: "Advanced Modalities",
      duration: "4 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 3,
    },
    {
      title: "Cancer Terrain Mapping & Protocols",
      slug: "cancer-terrain-mapping-protocols",
      description: "Systematic approach to understanding and addressing the metabolic terrain of cancer through pathway analysis and protocol development.",
      category: "Advanced Modalities",
      duration: "5 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 4,
    },
    {
      title: "The 5 Rs to Homeostasis",
      slug: "five-rs-to-homeostasis",
      description: "Master the Remove, Replace, Reinoculate, Repair, Rebalance framework for restoring optimal function.",
      category: "Core Protocols",
      duration: "2.5 hours",
      difficulty: "intermediate" as const,
      roleAccess: ["doctor", "clinic", "member"],
      sortOrder: 5,
    },
    {
      title: "Bioregulator Therapy Fundamentals",
      slug: "bioregulator-therapy-fundamentals",
      description: "Understanding Russian bioregulator science including Thymus, Pineal, Liver, Prostate, and Testis bioregulators.",
      category: "Advanced Modalities",
      duration: "2 hours",
      difficulty: "intermediate" as const,
      roleAccess: ["doctor", "clinic"],
      sortOrder: 6,
    },
  ];

  const insertedModules: (typeof trainingModules.$inferSelect)[] = [];
  
  for (const module of newModules) {
    // Check if module already exists
    const existing = await db.select().from(trainingModules).where(eq(trainingModules.slug, module.slug));
    if (existing.length === 0) {
      const [created] = await db.insert(trainingModules).values(module).returning();
      console.log(`  Created module: ${created.title}`);
      insertedModules.push(created);
    } else {
      insertedModules.push(existing[0]);
    }
  }

  // Check if track exists
  const existingTrack = await db.select().from(trainingTracks).where(eq(trainingTracks.slug, "advanced-treatment-modalities"));
  if (existingTrack.length === 0) {
    const [advancedTrack] = await db.insert(trainingTracks).values({
      title: "Advanced Treatment Modalities",
      slug: "advanced-treatment-modalities",
      description: "Cutting-edge therapies beyond conventional medicine including quantum therapies, stem cells, ECS optimization, and cancer terrain mapping.",
      totalModules: 4,
      estimatedDuration: "14 hours",
      difficulty: "advanced" as const,
      roleAccess: ["doctor", "clinic"],
    }).returning();
    console.log(`  Created track: ${advancedTrack.title}`);

    // Link modules to track
    const advancedModuleSlugs = [
      "quantum-therapies-frequency-medicine",
      "stem-cell-regenerative-medicine",
      "ecs-ligand-pathway-mastery",
      "cancer-terrain-mapping-protocols",
    ];
    
    let trackOrder = 1;
    for (const slug of advancedModuleSlugs) {
      const mod = insertedModules.find(m => m.slug === slug);
      if (mod) {
        await db.insert(trackModules).values({
          trackId: advancedTrack.id,
          moduleId: mod.id,
          sortOrder: trackOrder++,
          isRequired: true,
        });
      }
    }
    console.log(`  Linked ${advancedModuleSlugs.length} modules to track`);
  }
  
  console.log("Training modules check complete!");
}
