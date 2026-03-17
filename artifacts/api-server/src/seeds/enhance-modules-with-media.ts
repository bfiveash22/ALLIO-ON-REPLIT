import { db } from '../db';
import { trainingModules, driveAssets } from '@shared/schema';
import { eq, like, sql, isNull } from 'drizzle-orm';

const TRAINING_INTRO_VIDEO = '1TaREjW9CYSHOoXCjCXaxW7joCRBrGNJo';
const ALLIO_HEALING_PULSE = '1z5vfirYso7EtbPz5lJOLdB7n3ArHZsqv';
const ALLIO_HEALING_JOURNEY = '1onOTJtonA2qBW6O8KNuncx7P6_kRqpDR';
const ALLIO_LAUNCH_VIDEO = '14NvFEreBTnlCUkVT3fLuO1N_7NiLPjR_';
const ALLIO_DNA_TRANSFORMATION = '1ADov5f92IcoHtthoN-WefvF0usQ2233r';

const moduleVideoMappings: Record<string, { videoId: string; description: string }> = {
  'site-102-platform-nav': { videoId: TRAINING_INTRO_VIDEO, description: 'Platform Navigation Guide' },
  'site-106-new-staff-quiz': { videoId: TRAINING_INTRO_VIDEO, description: 'Staff Certification Overview' },
  'site-104-support-skills': { videoId: TRAINING_INTRO_VIDEO, description: 'Support Skills Training' },
  'site-105-compliance': { videoId: TRAINING_INTRO_VIDEO, description: 'Compliance Training' },
  'site-101-welcome': { videoId: TRAINING_INTRO_VIDEO, description: 'Welcome to Forgotten Formula' },
  'site-103-products-overview': { videoId: TRAINING_INTRO_VIDEO, description: 'Product Knowledge Essentials' },
  
  '6e075459-f517-47ad-a494-471f2cc6d370': { videoId: ALLIO_HEALING_PULSE, description: 'Live Blood Analysis Fundamentals' },
  'doc-103-lba-basics': { videoId: ALLIO_HEALING_PULSE, description: 'Live Blood Analysis Overview' },
  
  'ecs-101-basics': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'ECS Basics Video' },
  'ecs-102-receptors': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'CB Receptors Video' },
  'ecs-103-phytocannabinoids': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Phytocannabinoids Video' },
  'ecs-201-neuroanatomy': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'ECS Neuroanatomy Video' },
  'ecs-101-discovery': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'The Discovery of the ECS' },
  'ecs-103-endocannabinoids': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Your Body\'s Own Cannabinoids' },
  'ecs-104-deficiency': { videoId: ALLIO_HEALING_PULSE, description: 'Clinical Endocannabinoid Deficiency' },
  'ecs-105-support': { videoId: ALLIO_HEALING_PULSE, description: 'Natural ECS Support Strategies' },
  'ecs-202-immune-system': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'ECS and Immune Regulation' },
  'ecs-203-member-assessment': { videoId: ALLIO_HEALING_PULSE, description: 'ECS Member Assessment Protocol' },
  'ecs-204-phytocannabinoids': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Phytocannabinoid Pharmacology' },
  'ecs-205-terpenes': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'The Entourage Effect & Terpenes' },
  'ecs-206-dosing': { videoId: ALLIO_HEALING_PULSE, description: 'Dosing Strategies & Titration' },
  'ecs-207-drug-interactions': { videoId: ALLIO_HEALING_PULSE, description: 'Drug Interactions & Safety' },
  'ecs-208-certification-exam-prep': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Practitioner Certification Exam' },
  'ecs-301-research-review': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Critical Research Analysis' },
  'ecs-302-complex-conditions': { videoId: ALLIO_HEALING_PULSE, description: 'ECS in Complex Conditions' },
  'ecs-303-compounding': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Cannabinoid Compounding' },
  'ecs-304-emerging-therapies': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Emerging Cannabinoid Therapies' },
  'ecs-305-case-studies': { videoId: ALLIO_HEALING_PULSE, description: 'Advanced Clinical Case Studies' },
  'ecs-306-specialist-exam': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Advanced Specialist Certification Exam' },
  
  'c6054366-5063-4710-b2cb-674b4d3f107d': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Peptide Therapy Intro' },
  'e0cf9a56-cae4-4bc9-a130-7fe90c016b99': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'BPC-157 Deep Dive Video' },
  '28191eb2-58bd-4ede-a4ce-f6cafdcafb51': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Bioregulators 101 Video' },
  'peptide-101-building-blocks': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Peptide Fundamentals: Building Blocks' },
  'peptide-102-origins-synthesis': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Origins and Synthesis of Amino Acids' },
  'peptide-103-modified-amino-acids': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Modified Amino Acids and Enzymes' },
  'peptide-104-analysis-function': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Analysis and Function of Amino Acids' },
  'peptide-105-diabetes-management': { videoId: ALLIO_HEALING_PULSE, description: 'Peptides in Diabetes Management' },
  'peptide-106-hormones-bioregulators': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'Chemical Synthesis of Hormones' },
  'e736ebf0-c14d-4f59-926d-4271b0a44b7b': { videoId: ALLIO_DNA_TRANSFORMATION, description: 'GLP-1 Agonists in Practice' },
  
  'pma-101-legal-systems': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Understanding Legal Systems' },
  'pma-102-common-law-origins': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Origins of Common Law' },
  'pma-103-constitutional-rights': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Constitutional Rights Video' },
  'pma-104-state-action': { videoId: ALLIO_LAUNCH_VIDEO, description: 'State Action & Federal Authority' },
  'pma-105-pma-structure': { videoId: ALLIO_LAUNCH_VIDEO, description: 'PMA Structure Overview' },
  'pma-106-freedom-contract': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Freedom of Contract Video' },
  'pma-107-case-law': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Case Law Video' },
  'pma-108-practical-application': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Practical Application for Members' },
  
  'ozone-therapy-comprehensive': { videoId: ALLIO_HEALING_JOURNEY, description: 'Ozone Therapy Video' },
  'ivermectin-101': { videoId: ALLIO_HEALING_JOURNEY, description: 'Ivermectin Research Video' },
  'diet-cancer-fundamentals': { videoId: ALLIO_HEALING_JOURNEY, description: 'Diet and Cancer Video' },
  
  'doc-101-portal-orientation': { videoId: TRAINING_INTRO_VIDEO, description: 'Doctor Portal Orientation' },
  'doc-102-member-intake': { videoId: TRAINING_INTRO_VIDEO, description: 'Member Intake Protocol' },
  'doc-104-protocol-recommending': { videoId: ALLIO_HEALING_PULSE, description: 'Protocol Recommendation Guide' },
  'doc-105-referral-network': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Referral Network Video' },
  'doc-106-ai-agents': { videoId: TRAINING_INTRO_VIDEO, description: 'Working with ALLIO AI Agents' },
  'doc-107-compliance-legal': { videoId: ALLIO_LAUNCH_VIDEO, description: 'Doctor Compliance & Legal' },
  'doc-108-certification-exam': { videoId: TRAINING_INTRO_VIDEO, description: 'Doctor Certification Exam' },
  
  '21240eeb-04ca-4e16-b41d-b09571060562': { videoId: ALLIO_HEALING_PULSE, description: 'IV Therapy Safety & Administration' },
  '3cba6221-d593-486d-b04d-5f4b9be66c45': { videoId: ALLIO_HEALING_JOURNEY, description: 'Mineral Balance & Dr. Wallach Protocol' },
  '2f4f2f25-79c0-4079-955f-47163ca006d0': { videoId: ALLIO_HEALING_JOURNEY, description: 'The 5 Rs Protocol Explained' },
};

export async function enhanceModulesWithMedia() {
  console.log('[Media Enhancement] Starting video integration...');
  const results = [];
  
  for (const [moduleId, mapping] of Object.entries(moduleVideoMappings)) {
    try {
      const existingModule = await db
        .select()
        .from(trainingModules)
        .where(eq(trainingModules.id, moduleId))
        .limit(1);
      
      if (existingModule.length === 0) {
        console.log(`[Media] Module ${moduleId} not found, skipping...`);
        results.push({ moduleId, status: 'not_found' });
        continue;
      }
      
      const videoUrl = `https://drive.google.com/file/d/${mapping.videoId}/preview`;
      
      await db.update(trainingModules)
        .set({ videoUrl })
        .where(eq(trainingModules.id, moduleId));
      
      console.log(`[Media] Linked video to ${moduleId}: ${mapping.description}`);
      results.push({ moduleId, status: 'success', videoId: mapping.videoId, description: mapping.description });
      
    } catch (error: any) {
      console.error(`[Media] Error linking video to ${moduleId}:`, error.message);
      results.push({ moduleId, status: 'error', error: error.message });
    }
  }
  
  const allVideosInDrive = await db
    .select({
      id: driveAssets.driveFileId,
      name: driveAssets.name,
      tags: driveAssets.tags
    })
    .from(driveAssets)
    .where(like(driveAssets.mimeType, 'video/%'))
    .limit(50);
  
  console.log('[Media Enhancement] Video integration complete!');
  return {
    modulesUpdated: results.filter(r => r.status === 'success').length,
    totalMappings: Object.keys(moduleVideoMappings).length,
    results,
    availableVideos: allVideosInDrive.length
  };
}

export async function getAvailableMediaAssets() {
  const videos = await db
    .select({
      id: driveAssets.driveFileId,
      name: driveAssets.name,
      tags: driveAssets.tags,
      path: driveAssets.path
    })
    .from(driveAssets)
    .where(like(driveAssets.mimeType, 'video/%'))
    .limit(100);
  
  const images = await db
    .select({
      id: driveAssets.driveFileId,
      name: driveAssets.name,
      tags: driveAssets.tags,
      path: driveAssets.path
    })
    .from(driveAssets)
    .where(like(driveAssets.mimeType, 'image/%'))
    .limit(100);
  
  return {
    videos: videos.length,
    images: images.length,
    videoAssets: videos,
    imageAssets: images
  };
}
