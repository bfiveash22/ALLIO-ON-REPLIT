import OpenAI from "openai";
import type { BloodworkUpload } from "@shared/schema";

interface ExtractedMarker {
  testName: string;
  category: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: "normal" | "low" | "high" | "critical_low" | "critical_high";
  confidence: number;
  notes?: string;
}

interface BloodworkAnalysisResult {
  extractedMarkers: ExtractedMarker[];
  clinicalSummary: string;
  aiObservations: string[];
  protocolAlignments: string[];
  abnormalFlags: string[];
  confidence: "high" | "moderate" | "low";
  labName?: string;
  collectionDate?: string;
}

const SYSTEM_PROMPT = `You are an expert FFPMA clinical laboratory specialist and hematologist.
Your task is to analyze uploaded bloodwork lab reports (PDFs or images) and extract structured biomarker data.

FFPMA LANGUAGE COMPLIANCE - MANDATORY:
- Use "member" not "patient"
- Use "wellness assessment" not "diagnosis"  
- Use "protocol recommendation" not "prescription"
- Use "support" not "treat"

BIOMARKER CATEGORIES:
- CBC (Complete Blood Count): WBC, RBC, Hemoglobin, Hematocrit, Platelets, MCV, MCH, MCHC
- Metabolic Panel: Glucose, BUN, Creatinine, eGFR, Sodium, Potassium, CO2, Calcium
- Liver Panel: ALT, AST, ALP, Bilirubin, Albumin, Total Protein
- Lipid Panel: Total Cholesterol, LDL, HDL, Triglycerides
- Thyroid: TSH, T3, T4, Free T3, Free T4
- Hormones: Testosterone, Estradiol, Progesterone, DHEA-S, Cortisol
- Nutrients/Vitamins: Vitamin D, B12, Folate, Iron, Ferritin, Zinc, Magnesium
- Inflammation: CRP, ESR, Homocysteine, Fibrinogen
- Other: HbA1c, Insulin, IGF-1, PSA, CA-125

STATUS DETERMINATION:
- "critical_low": Value < 80% of reference minimum (immediate attention needed)
- "low": Value < reference minimum
- "normal": Value within reference range
- "high": Value > reference maximum
- "critical_high": Value > 120% of reference maximum

CONFIDENCE SCORING (0-1):
- 1.0: Clearly legible value with explicit reference ranges
- 0.8: Clear value, standard reference ranges used
- 0.6: Partially legible or unusual units requiring interpretation
- 0.4: Estimated from context or unclear

Return a JSON object with this exact structure:
{
  "extractedMarkers": [
    {
      "testName": "string (official test name)",
      "category": "string (CBC|Metabolic|Liver|Lipid|Thyroid|Hormones|Nutrients|Inflammation|Other)",
      "value": number,
      "unit": "string",
      "referenceMin": number or null,
      "referenceMax": number or null,
      "status": "normal|low|high|critical_low|critical_high",
      "confidence": number (0-1),
      "notes": "string (optional clinical note)"
    }
  ],
  "clinicalSummary": "string (2-3 sentence summary using FFPMA language)",
  "aiObservations": ["string array of key findings"],
  "protocolAlignments": ["string array of FFPMA 2026 protocol suggestions based on findings"],
  "abnormalFlags": ["string array of concerning findings needing attention"],
  "confidence": "high|moderate|low",
  "labName": "string or null (name of the laboratory if visible)",
  "collectionDate": "string or null (ISO date if visible on report)"
}`;

export async function analyzeBloodworkReport(
  imageBase64: string,
  mimeType: string,
  memberContext?: string
): Promise<BloodworkAnalysisResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const base64Data = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`;

  const userMessage = memberContext
    ? `Please analyze this bloodwork lab report and extract all biomarkers. Member context: ${memberContext}`
    : "Please analyze this bloodwork lab report and extract all biomarkers with their values, units, and reference ranges.";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: base64Data, detail: "high" } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No analysis returned from AI");

  const parsed = JSON.parse(content);

  if (!parsed.extractedMarkers || !Array.isArray(parsed.extractedMarkers)) {
    throw new Error("Invalid analysis format returned from AI");
  }

  return {
    extractedMarkers: parsed.extractedMarkers || [],
    clinicalSummary: parsed.clinicalSummary || "",
    aiObservations: parsed.aiObservations || [],
    protocolAlignments: parsed.protocolAlignments || [],
    abnormalFlags: parsed.abnormalFlags || [],
    confidence: parsed.confidence || "moderate",
    labName: parsed.labName || undefined,
    collectionDate: parsed.collectionDate || undefined,
  };
}

export async function analyzeBloodworkPDF(
  pdfBuffer: Buffer,
  memberContext?: string
): Promise<BloodworkAnalysisResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Extract text from PDF using pdf-parse (GPT-4o vision doesn't support PDF blobs via image_url)
  let pdfText = "";
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(pdfBuffer);
    pdfText = pdfData.text || "";
  } catch (parseErr: unknown) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.warn("[Bloodwork AI] pdf-parse extraction partial:", msg);
  }

  if (!pdfText || pdfText.trim().length < 50) {
    throw new Error(
      "Could not extract readable text from PDF. Please ensure the file is a text-based lab report, not a scanned image."
    );
  }

  const userMessage = memberContext
    ? `Please analyze this bloodwork lab report text and extract all biomarkers. Member context: ${memberContext}\n\nLAB REPORT TEXT:\n${pdfText}`
    : `Please analyze this bloodwork lab report text and extract all biomarkers with values, units, and reference ranges.\n\nLAB REPORT TEXT:\n${pdfText}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No analysis returned from AI");

  const parsed = JSON.parse(content);

  return {
    extractedMarkers: parsed.extractedMarkers || [],
    clinicalSummary: parsed.clinicalSummary || "",
    aiObservations: parsed.aiObservations || [],
    protocolAlignments: parsed.protocolAlignments || [],
    abnormalFlags: parsed.abnormalFlags || [],
    confidence: parsed.confidence || "moderate",
    labName: parsed.labName || undefined,
    collectionDate: parsed.collectionDate || undefined,
  };
}

export function buildBloodworkProtocolContext(uploads: BloodworkUpload[]): string {
  if (!uploads || uploads.length === 0) return "";

  const recentUploads = uploads.slice(0, 3);
  const lines: string[] = ["BLOODWORK LAB RESULTS CONTEXT:"];

  for (const upload of recentUploads) {
    const date = upload.collectionDate
      ? new Date(upload.collectionDate).toLocaleDateString()
      : new Date(upload.createdAt ?? Date.now()).toLocaleDateString();

    lines.push(`\n[Lab Report - ${date}${upload.labName ? ` from ${upload.labName}` : ""}]`);

    if (upload.clinicalSummary) {
      lines.push(`Summary: ${upload.clinicalSummary}`);
    }

    if (upload.abnormalFlags && upload.abnormalFlags.length > 0) {
      lines.push(`Abnormal Findings: ${upload.abnormalFlags.join(", ")}`);
    }

    if (upload.extractedMarkers && upload.extractedMarkers.length > 0) {
      const abnormals = upload.extractedMarkers.filter((m) => m.status !== "normal");
      if (abnormals.length > 0) {
        lines.push("Key Abnormal Markers:");
        for (const marker of abnormals.slice(0, 10)) {
          lines.push(
            `  - ${marker.testName}: ${marker.value} ${marker.unit} [${marker.status.toUpperCase()}]${marker.referenceMin !== undefined ? ` (ref: ${marker.referenceMin}-${marker.referenceMax})` : ""}`
          );
        }
      }

      const normals = upload.extractedMarkers.filter((m) => m.status === "normal");
      if (normals.length > 0) {
        lines.push(`Normal markers: ${normals.map((m) => m.testName).join(", ")}`);
      }
    }
  }

  return lines.join("\n");
}
