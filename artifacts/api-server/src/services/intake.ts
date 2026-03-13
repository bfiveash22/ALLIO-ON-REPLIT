import { getUncachableSheetsClient } from "./sheets";
import { db } from "../db";
import { intakeForms } from "@shared/schema";
import { eq } from "drizzle-orm";
import { encryptSensitiveFields, encryptJsonField } from "../utils/field-encryption";

const SPREADSHEET_TITLE = `FFPMA Member Intake Forms Data`;

function isSheetsEnabled(): boolean {
  const flag = process.env.INTAKE_SHEETS_ENABLED;
  if (!flag || flag.toLowerCase() === 'false' || flag === '0') {
    return false;
  }
  return true;
}

export async function createIntakeSheetTemplate(): Promise<string> {
  const sheets = await getUncachableSheetsClient();

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

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Raw Responses'!A1:F1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Submission Date", "Member Name", "Email", "Phone", "Age", "Primary Concern", "Full Data JSON Dump"]]
    }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Timeline'!A1:E1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Member Name", "Decade", "Health Events", "Environmental Changes", "Symptoms"]]
    }
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Root Cause Flags'!A1:G1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["Member", "Mold Exposure", "Heavy Metals", "Childhood Trauma", "Gut Issues", "Hormone Disruption", "Autoimmune"]]
    }
  });

  return spreadsheetId;
}

export async function getOrCreateIntakeSheetId(): Promise<string> {
  if (process.env.INTAKE_SHEET_TEMPLATE_ID) {
    return process.env.INTAKE_SHEET_TEMPLATE_ID;
  }
  
  const newSheetId = await createIntakeSheetTemplate();
  process.env.INTAKE_SHEET_TEMPLATE_ID = newSheetId;
  return newSheetId;
}

function formatRawDataRow(formData: any, memberInfo: any): any[] {
  return [
    new Date().toLocaleString(),
    memberInfo.name,
    memberInfo.email,
    memberInfo.phone || "",
    memberInfo.age || "",
    formData.basicInfo?.primaryConcern || "",
    JSON.stringify(formData)
  ];
}

async function appendTimelineData(sheetId: string, memberName: string, timelineData: any) {
  if (!timelineData || Object.keys(timelineData).length === 0) return;
  
  const sheets = await getUncachableSheetsClient();
  const rows = [];
  
  for (const [decade, records] of Object.entries(timelineData)) {
    rows.push([
      memberName,
      decade,
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

async function appendRootCauseFlags(sheetId: string, memberName: string, formData: any) {
  const sheets = await getUncachableSheetsClient();
  
  const hasMold = formData.environmental?.moldExposure === "Yes" ? "Yes" : "No";
  const hasMetals = formData.environmental?.heavyMetals?.amalgamFillings === "Yes" ? "Yes" : "No";
  
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
    memberName,
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

export async function submitIntakeForm(memberInfo: any, formData: any): Promise<{ success: boolean; sheetId?: string; dbId: number }> {
  try {
    const encryptedInfo = encryptSensitiveFields(
      {
        patientName: memberInfo.name,
        patientEmail: memberInfo.email,
        patientPhone: memberInfo.phone,
      },
      ['patientName', 'patientEmail', 'patientPhone']
    );

    const [dbInsertResult] = await db.insert(intakeForms).values({
      patientName: encryptedInfo.patientName,
      patientEmail: encryptedInfo.patientEmail,
      patientPhone: encryptedInfo.patientPhone,
      dateOfBirth: memberInfo.dob ? new Date(memberInfo.dob) : null,
      age: memberInfo.age ? parseInt(memberInfo.age, 10) : null,
      formData: encryptJsonField(formData),
      status: "submitted",
      submittedAt: new Date()
    }).returning();

    let sheetId: string | undefined;

    if (isSheetsEnabled()) {
      console.warn('[Intake] DATA SOVEREIGNTY WARNING: Google Sheets mirror is enabled. Sensitive member data is being written to a third-party SaaS platform. Set INTAKE_SHEETS_ENABLED=false to disable.');
      try {
        sheetId = await getOrCreateIntakeSheetId();
        const sheets = await getUncachableSheetsClient();

        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: "'Raw Responses'!A:ZZ",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [formatRawDataRow(formData, memberInfo)]
          }
        });

        if (formData.timeline) {
          await appendTimelineData(sheetId, memberInfo.name, formData.timeline);
        }

        await appendRootCauseFlags(sheetId, memberInfo.name, formData);
      } catch (sheetError) {
        console.error("[Intake] Google Sheets mirror failed (non-fatal):", sheetError);
      }
    } else {
      console.log('[Intake] Google Sheets mirror is disabled (INTAKE_SHEETS_ENABLED not set). Data stored in database only.');
    }

    return {
      success: true,
      sheetId,
      dbId: dbInsertResult.id
    };
  } catch (error) {
    console.error("Failed to submit intake form:", error);
    throw error;
  }
}
