import { db } from "../db";
import { programs } from "@shared/schema";

const programsData = [
  {
    id: "prog-iv-vitamin-therapy",
    name: "IV Vitamin Therapy Starter",
    slug: "iv-vitamin-therapy-starter",
    type: "iv" as const,
    description: "Begin your wellness journey with our foundational IV therapy program. Over 4 weeks, you'll receive customized intravenous infusions designed to replenish nutrient deficiencies, boost immune function, and restore cellular energy. Each infusion is tailored based on your initial health assessment and lab results. This starter program introduces you to high-dose Vitamin C, glutathione, B-complex vitamins, and NAD+ precursors — the cornerstones of IV nutrient therapy. You'll work directly with one of our network physicians to establish your personalized protocol and build a maintenance plan for ongoing vitality.",
    shortDescription: "4-week foundational IV therapy program with customized infusions for immune support, energy optimization, and nutrient repletion.",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800",
    price: "1200.00",
    duration: "4 weeks",
    isActive: true,
  },
  {
    id: "prog-peptide-healing",
    name: "Peptide Healing Protocol",
    slug: "peptide-healing-protocol",
    type: "peptide" as const,
    description: "Our comprehensive 8-week peptide healing program harnesses the power of targeted peptide therapy for tissue repair, immune modulation, and gut restoration. You'll begin with a thorough health assessment and injection training, then progress through a carefully sequenced protocol featuring BPC-157 for gut healing and tissue repair, Thymosin Alpha-1 for immune optimization, and GHK-Cu for skin and tissue regeneration. In weeks 5-7, you'll experience synergistic peptide stacking for enhanced effects, with the final week dedicated to transitioning to a sustainable maintenance protocol. All peptides, supplies, and weekly coaching calls are included.",
    shortDescription: "8-week comprehensive peptide therapy program featuring BPC-157, Thymosin Alpha-1, and GHK-Cu for healing, immune support, and regeneration.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800",
    price: "2400.00",
    duration: "8 weeks",
    isActive: true,
  },
  {
    id: "prog-5rs-homeostasis",
    name: "5 R's to Homeostasis",
    slug: "5-rs-to-homeostasis",
    type: "protocol" as const,
    description: "The flagship Forgotten Formula PMA program — a 12-week deep-dive into the FF PMA 5R Framework: Remove, Replace, Regenerate, Restore, and Rebalance. This comprehensive protocol addresses the root causes of chronic illness by systematically detoxifying the body, replenishing essential nutrients, repairing gut integrity, restoring organ function, and rebalancing the nervous system. You'll receive functional lab testing, a complete supplement protocol, bi-weekly coaching calls, personalized meal plans, and lifetime access to all program materials. Guided by the PARACELSUS and RESONANCE AI agents for personalized protocol adjustments throughout your journey.",
    shortDescription: "12-week flagship program implementing the complete FF PMA 5R Framework — Remove, Replace, Regenerate, Restore, and Rebalance for chronic health restoration.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
    price: "3500.00",
    duration: "12 weeks",
    isActive: true,
  },
  {
    id: "prog-glp1-weight",
    name: "GLP-1 Weight Management",
    slug: "glp-1-weight-management",
    type: "peptide" as const,
    description: "A medically supervised 16-week weight management program utilizing GLP-1 receptor agonist peptides for sustainable fat loss while preserving lean muscle mass. Starting with a comprehensive metabolic assessment and education phase, you'll progress through careful dose titration, protein-focused nutrition planning, and structured resistance training. Weekly coaching calls, comprehensive metabolic labs, body composition tracking, and ongoing protocol adjustments ensure optimal results. The final weeks focus on lifestyle integration, dose tapering, and establishing a long-term maintenance plan so your results last well beyond the program.",
    shortDescription: "16-week medically supervised GLP-1 peptide program for sustainable weight loss with metabolic optimization and muscle preservation.",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    price: "4200.00",
    duration: "16 weeks",
    isActive: true,
  },
  {
    id: "prog-nad-revival",
    name: "NAD+ Cellular Revival",
    slug: "nad-cellular-revival",
    type: "iv" as const,
    description: "Revitalize at the cellular level with our 6-week NAD+ optimization program. Nicotinamide adenine dinucleotide (NAD+) is essential for mitochondrial energy production, DNA repair, and healthy aging — but levels decline significantly with age. This program begins with a baseline assessment and NAD+ education, followed by a loading phase of NAD+ IV infusions or subcutaneous protocol. You'll add precursor supplements and cofactors for sustained benefit, then transition to a maintenance dosing strategy. Includes cognitive function testing to track improvements in brain performance, energy, and endurance throughout the program.",
    shortDescription: "6-week NAD+ optimization program with IV or subcutaneous delivery, precursor supplementation, and cognitive performance tracking.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-7b21e0ed3a23?w=800",
    price: "2800.00",
    duration: "6 weeks",
    isActive: true,
  },
  {
    id: "prog-parasite-cleanse",
    name: "Parasite Cleanse Protocol",
    slug: "parasite-cleanse-protocol",
    type: "protocol" as const,
    description: "A thorough 6-week anti-parasitic cleanse program designed to safely and systematically eliminate parasites while supporting your body's drainage pathways. Week 1 prepares the body with binders and drainage support to prevent Herxheimer reactions. Weeks 2-4 implement a progressive anti-parasitic herbal protocol with biofilm-disrupting agents. Week 5 shifts focus to gut restoration with targeted probiotics, and Week 6 completes the cleanse with a maintenance protocol and follow-up testing recommendations. Includes a complete herbal cleanse kit, binders, drainage support supplements, probiotic restoration protocol, and detailed dietary guidelines.",
    shortDescription: "6-week systematic anti-parasitic cleanse with drainage support, herbal protocols, biofilm disruption, and gut restoration.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
    price: "800.00",
    duration: "6 weeks",
    isActive: true,
  },
];

export async function seedPrograms() {
  console.log("[Programs Seed] Seeding FF PMA programs...");

  let count = 0;
  for (const prog of programsData) {
    await db
      .insert(programs)
      .values(prog)
      .onConflictDoUpdate({
        target: programs.id,
        set: {
          name: prog.name,
          slug: prog.slug,
          type: prog.type,
          description: prog.description,
          shortDescription: prog.shortDescription,
          imageUrl: prog.imageUrl,
          price: prog.price,
          duration: prog.duration,
          isActive: prog.isActive,
        },
      });
    count++;
  }

  console.log(`[Programs Seed] Upserted ${count} programs`);
  return { success: true, programs: count };
}
