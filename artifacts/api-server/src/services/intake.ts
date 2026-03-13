import { getUncachableSheetsClient } from "./sheets";
import { db } from "../db";
import { intakeForms } from "@shared/schema";
import { eq } from "drizzle-orm";

const SPREADSHEET_TITLE = `FFPMA Patient Intake Forms Data`;

/**
 * Creates a formatted Google Sheet template for the intake process if one does not exist.
 * It strictly creates the three required tabs and sets up header structures.
 */
export async function createIntakeSheetTemplate(): Promise<string> {
  const sheets = await getUncachableSheetsClient();

  // Create the spreadsheet
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        {
          properties: { title: "Raw Responses" }
        },
        {
          properties: { title: "Timeline" }
        },
        {
          properties: { title: "Root Cause Flags" }
        }
      ]
    }
  });

  const spreadsheetId = response.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error("Failed to create spreadsheet template");
  }

  // Set up the headers for Raw Responses
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Raw Responses'!A1:F1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Submission Date", "Patient Name", "Email", "Phone", "Age", "Primary Concern", "Full Data JSON Dump"]]
    }
  });

  // Set up the headers for Timeline
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Timeline'!A1:E1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Patient Name", "Decade", "Health Events", "Environmental Changes", "Symptoms"]]
    }
  });

  // Set up the headers for Root Cause Flags
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Root Cause Flags'!A1:G1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Patient", "Mold Exposure", "Heavy Metals", "Childhood Trauma", "Gut Issues", "Hormone Disruption", "Autoimmune"]]
    }
  });

  // Create permission to share with the trustee alias or public editing (depending on organizational setup)
  // But since the service account / app creates it, let's keep it under the blake@forgottenformula.com authority.
  
  return spreadsheetId;
}

/**
 * Gets or creates the default spreadsheet ID
 */
export async function getOrCreateIntakeSheetId(): Promise<string> {
  if (process.env.INTAKE_SHEET_TEMPLATE_ID) {
    return process.env.INTAKE_SHEET_TEMPLATE_ID;
  }
  
  // If no env var, create one dynamically and theoretically we'd save it in DB/settings.
  // For now, return a freshly created one (in real-world, cache it).
  const newSheetId = await createIntakeSheetTemplate();
  process.env.INTAKE_SHEET_TEMPLATE_ID = newSheetId;
  return newSheetId;
}

/**
 * Parses JSON form data and maps it to a single row for the Raw Responses tab
 */
function formatRawDataRow(formData: any, patientInfo: any): any[] {
  return [
    new Date().toLocaleString(),
    patientInfo.name,
    patientInfo.email,
    patientInfo.phone || "",
    patientInfo.age || "",
    formData.basicInfo?.primaryConcern || "",
    JSON.stringify(formData)
  ];
}

/**
 * Helper to process timeline history data from the form
 */
async function appendTimelineData(sheetId: string, patientName: string, timelineData: any) {
  if (!timelineData || Object.keys(timelineData).length === 0) return;
  
  const sheets = await getUncachableSheetsClient();
  const rows = [];
  
  for (const [decade, records] of Object.entries(timelineData)) {
    rows.push([
      patientName,
      decade, // e.g. "0-10"
      (records as any).healthEvents || "",
      (records as any).environmentalChanges || "",
      (records as any).symptoms || ""
    ]);
  }

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "'Timeline'!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows }
    });
  }
}

/**
 * Extracts and sets the boolean/text flags for the third tab
 */
async function appendRootCauseFlags(sheetId: string, patientName: string, formData: any) {
  const sheets = await getUncachableSheetsClient();
  
  // Simple heuristics based on standard structure definitions in the prompt
  const hasMold = formData.environmental?.moldExposure === "Yes" ? "Yes" : "No";
  const hasMetals = formData.environmental?.heavyMetals?.amalgamFillings === "Yes" ? "Yes" : "No";
  
  // ACE score calculator
  let aceScore = 0;
  if (formData.trauma?.childhood) {
    Object.values(formData.trauma.childhood).forEach(val => {
      if (val) aceScore++;
    });
  }
  
  const hasGut = formData.symptoms?.digestive && Object.keys(formData.symptoms.digestive).length > 0 ? "Yes" : "No";
  const hasHormone = formData.symptoms?.hormonal && Object.keys(formData.symptoms.hormonal).length > 0 ? "Yes" : "No";
  const hasAutoimmune = formData.symptoms?.immune?.autoimmuneCondition === "Yes" ? "Yes" : "No";
  
  const row = [
    patientName,
    hasMold,
    hasMetals,
    aceScore.toString(),
    hasGut,
    hasHormone,
    hasAutoimmune
  ];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "'Root Cause Flags'!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] }
  });
}

/**
 * Main service to submit an intake form natively
 */
export async function submitIntakeForm(patientInfo: any, formData: any): Promise<{ success: boolean; sheetId: string; dbId: number }> {
  try {
    const sheetId = await getOrCreateIntakeSheetId();
    const sheets = await getUncachableSheetsClient();

    const [dbInsertResult] = await db.insert(intakeForms).values({
      patientName: patientInfo.name,
      patientEmail: patientInfo.email,
      patientPhone: patientInfo.phone,
      dateOfBirth: patientInfo.dob ? new Date(patientInfo.dob) : null,
      age: patientInfo.age ? parseInt(patientInfo.age, 10) : null,
      formData: formData,
      status: "submitted",
      googleSheetId: sheetId,
      submittedAt: new Date()
    }).returning();

    // Write to tab 1
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "'Raw Responses'!A:ZZ",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [formatRawDataRow(formData, patientInfo)]
      }
    });

    // Write to tab 2
    if (formData.timeline) {
      await appendTimelineData(sheetId, patientInfo.name, formData.timeline);
    }

    // Write to tab 3
    await appendRootCauseFlags(sheetId, patientInfo.name, formData);

    return {
      success: true,
      sheetId,
      dbId: dbInsertResult.id
    };
  } catch (error) {
    console.error("Failed to submit intake form to Google Sheets / DB:", error);
    throw error;
  }
}
