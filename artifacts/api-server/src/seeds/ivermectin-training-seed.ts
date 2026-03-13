/**
 * Ivermectin Training Module Seed
 * 
 * Creates an interactive training module on Ivermectin using research PDFs
 * and the presentation from Google Drive.
 */

import { db } from '../db';
import { trainingModules, trainingModuleSections, trainingModuleKeyPoints, quizzes, quizQuestions, quizAnswers, moduleQuizzes } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Ivermectin source files from Google Drive (indexed in asset catalog)
const IVERMECTIN_SOURCES = [
  { id: '14N7LafrtQkI-oDWGVaNBiu2qKUonBuyO', name: 'IvermectinStudyEquador.pdf' },
  { id: '14QFbT_qx40rFS3li8oHQFoA_uK1HHW-H', name: 'IvermectinCancer.pdf' },
  { id: '14TkZ5_a-sOxVEmf7vbZrn7tQHQmuLNgu', name: 'Molecular Ivermectin (1).pdf' },
  { id: '14e3obEReUHUPQ96dxNBrs-MFvBquKB6E', name: 'IvermectinReversesdrugresistance.pdf' },
  { id: '1CTmsZlDAqe_gL6aFLKqAAEQKDNhQk78G', name: 'ivermectinasthmaothers.pdf' },
  { id: '14Z2wyQOeoJEliVQM2PiwNwESYIIHwWk3', name: 'IvermectinAntiViral.pdf' },
];

// Presentation ID for instructor content
const PRESENTATION_ID = '1wg5evyCkie9g9tjzKY7-LlZ_TJdb7_QHLpQ5F9cYLpM';

export async function seedIvermectinTraining() {
  console.log('[Ivermectin Seed] Creating Ivermectin training module...');
  
  const moduleId = 'ivermectin-101';
  const slug = 'ivermectin-101';
  
  // Check if module exists
  const existing = await db.select().from(trainingModules).where(eq(trainingModules.id, moduleId));
  
  if (existing.length > 0) {
    console.log('[Ivermectin Seed] Module already exists, updating...');
    await db.update(trainingModules)
      .set({
        title: 'Ivermectin: From Antiparasitic to Anticancer Agent',
        description: 'Comprehensive training on Ivermectin - its mechanism of action, antiviral properties, cancer research applications, and clinical use in various conditions. Based on peer-reviewed research studies.',
        category: 'Advanced Therapeutics',
        duration: '90 min',
        difficulty: 'intermediate',
        driveFileId: IVERMECTIN_SOURCES[1].id, // Primary source: IvermectinCancer.pdf
        pdfUrl: `https://drive.google.com/file/d/${IVERMECTIN_SOURCES[1].id}/view`,
        presentationFileId: PRESENTATION_ID,
        presentationUrl: `https://docs.google.com/presentation/d/${PRESENTATION_ID}/edit`,
        instructorName: 'Dr. Miller',
        instructorTitle: 'Medical Director',
        instructorBio: 'Dr. Miller brings extensive clinical experience in integrative medicine and has studied Ivermectin applications since the early research studies.',
        additionalMaterials: IVERMECTIN_SOURCES.map(s => ({
          fileId: s.id,
          name: s.name,
          url: `https://drive.google.com/file/d/${s.id}/view`
        })),
        isActive: true,
        roleAccess: ['member', 'doctor', 'admin'],
        updatedAt: new Date()
      })
      .where(eq(trainingModules.id, moduleId));
  } else {
    console.log('[Ivermectin Seed] Creating new module...');
    await db.insert(trainingModules).values({
      id: moduleId,
      slug,
      title: 'Ivermectin: From Antiparasitic to Anticancer Agent',
      description: 'Comprehensive training on Ivermectin - its mechanism of action, antiviral properties, cancer research applications, and clinical use in various conditions. Based on peer-reviewed research studies.',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
      category: 'Advanced Therapeutics',
      sortOrder: 1,
      duration: '90 min',
      difficulty: 'intermediate',
      isActive: true,
      requiresMembership: true,
      roleAccess: ['member', 'doctor', 'admin'],
      driveFileId: IVERMECTIN_SOURCES[1].id,
      pdfUrl: `https://drive.google.com/file/d/${IVERMECTIN_SOURCES[1].id}/view`,
      presentationFileId: PRESENTATION_ID,
      presentationUrl: `https://docs.google.com/presentation/d/${PRESENTATION_ID}/edit`,
      instructorName: 'Dr. Miller',
      instructorTitle: 'Medical Director',
      instructorBio: 'Dr. Miller brings extensive clinical experience in integrative medicine and has studied Ivermectin applications since the early research studies.',
      additionalMaterials: IVERMECTIN_SOURCES.map(s => ({
        fileId: s.id,
        name: s.name,
        url: `https://drive.google.com/file/d/${s.id}/view`
      })),
      isInteractive: false,
      hasQuiz: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  console.log('[Ivermectin Seed] Module created successfully');
  
  return {
    moduleId,
    slug,
    sourceFiles: IVERMECTIN_SOURCES,
    presentationId: PRESENTATION_ID
  };
}

