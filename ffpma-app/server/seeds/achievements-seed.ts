import { db } from "../db";
import { achievements } from "@shared/schema";

export async function seedAchievements() {
  const existingAchievements = await db.select().from(achievements);
  if (existingAchievements.length > 0) {
    console.log("Achievements already seeded");
    return { seeded: false, count: existingAchievements.length };
  }

  const achievementsList = [
    {
      name: "First Steps",
      description: "Complete your first training module",
      type: "module_complete" as const,
      icon: "footprints",
      color: "bronze",
      points: 10,
      criteria: { modulesCompleted: 1 },
    },
    {
      name: "Knowledge Seeker",
      description: "Complete 5 training modules",
      type: "module_complete" as const,
      icon: "book-open",
      color: "silver",
      points: 25,
      criteria: { modulesCompleted: 5 },
    },
    {
      name: "Scholar",
      description: "Complete 15 training modules",
      type: "module_complete" as const,
      icon: "graduation-cap",
      color: "gold",
      points: 50,
      criteria: { modulesCompleted: 15 },
    },
    {
      name: "Master Healer",
      description: "Complete all training modules in a track",
      type: "track_complete" as const,
      icon: "award",
      color: "gold",
      points: 100,
      criteria: { trackCompleted: true },
    },
    {
      name: "Quiz Champion",
      description: "Score 100% on any quiz",
      type: "quiz_master" as const,
      icon: "star",
      color: "gold",
      points: 30,
      criteria: { perfectScore: true },
    },
    {
      name: "Quick Learner",
      description: "Pass 5 quizzes with 80% or higher",
      type: "quiz_master" as const,
      icon: "zap",
      color: "silver",
      points: 40,
      criteria: { quizzesPassed: 5 },
    },
    {
      name: "Dedication",
      description: "Log in for 7 consecutive days",
      type: "streak" as const,
      icon: "flame",
      color: "orange",
      points: 35,
      criteria: { consecutiveDays: 7 },
    },
    {
      name: "Community Voice",
      description: "Start your first discussion thread",
      type: "community_contributor" as const,
      icon: "message-circle",
      color: "cyan",
      points: 15,
      criteria: { threadsCreated: 1 },
    },
    {
      name: "Helpful Member",
      description: "Reply to 10 discussion threads",
      type: "community_contributor" as const,
      icon: "heart",
      color: "pink",
      points: 25,
      criteria: { repliesPosted: 10 },
    },
    {
      name: "Blood Analyst",
      description: "Complete your first blood sample analysis",
      type: "first_analysis" as const,
      icon: "microscope",
      color: "red",
      points: 50,
      criteria: { analysesCompleted: 1 },
    },
    {
      name: "Certified Practitioner",
      description: "Earn your first official certification",
      type: "certification_earned" as const,
      icon: "badge",
      color: "gold",
      points: 100,
      criteria: { certificationsEarned: 1 },
    },
    {
      name: "ALLIO Pioneer",
      description: "Join during the platform launch period",
      type: "milestone" as const,
      icon: "rocket",
      color: "purple",
      points: 75,
      criteria: { joinedBefore: "2026-03-01" },
    },
  ];

  await db.insert(achievements).values(achievementsList);
  console.log(`Seeded ${achievementsList.length} achievements`);
  return { seeded: true, count: achievementsList.length };
}
