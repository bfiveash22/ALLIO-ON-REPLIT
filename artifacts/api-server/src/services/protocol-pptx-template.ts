import * as fs from "fs";
import * as path from "path";
import JSZip from "jszip";
import type {
  HealingProtocol,
  PatientProfile,
} from "@shared/types/protocol-assembly";
import { sanitizePmaLanguage } from "@shared/pma-language";

const TEMPLATE_PATH = path.join(process.cwd(), "artifacts", "api-server", "assets", "protocol-template.pptx");

function replaceTextInXml(xml: string, placeholder: string, value: string): string {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const escapedPlaceholder = placeholder
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const simplePattern = new RegExp(escapedPlaceholder, "g");
  let result = xml.replace(simplePattern, escaped);

  if (result === xml) {
    const chars = placeholder.split("");
    let splitPattern = "";
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      splitPattern += c;
      if (i < chars.length - 1) {
        splitPattern += "(?:</a:t></a:r><a:r[^>]*><a:rPr[^/]*/><a:t>)?";
      }
    }
    const splitRegex = new RegExp(splitPattern, "g");
    const splitMatch = xml.match(splitRegex);
    if (splitMatch) {
      result = xml.replace(splitRegex, escaped);
    }
  }

  return result;
}

function buildSelectedPeptidesList(protocol: HealingProtocol): string {
  const peptides: string[] = [];

  if (protocol.injectablePeptides?.length) {
    for (const p of protocol.injectablePeptides) {
      const name = typeof p === "string" ? p : (p as any).name || "";
      if (name) peptides.push(name);
    }
  }
  if (protocol.oralPeptides?.length) {
    for (const p of protocol.oralPeptides) {
      const name = typeof p === "string" ? p : (p as any).name || "";
      if (name) peptides.push(name);
    }
  }
  if (protocol.bioregulators?.length) {
    for (const p of protocol.bioregulators) {
      const name = typeof p === "string" ? p : (p as any).name || "";
      if (name) peptides.push(name);
    }
  }

  return peptides.length > 0 ? peptides.join(", ") : "See protocol details";
}

function buildSelectedModalities(protocol: HealingProtocol): string {
  const mods: string[] = [];
  const p = protocol as any;

  if (p.hbotProtocol || p.hbot) mods.push("HBOT");
  if (protocol.ivTherapies?.length) mods.push("IV Therapy");
  if (protocol.detoxProtocols?.length) mods.push("Detox");
  if (protocol.ecsProtocol?.overview) mods.push("Cannabinoid/ECS");
  if (protocol.suppositories?.length) mods.push("Suppositories");
  if (protocol.liposomals?.length) mods.push("Liposomals");
  if (protocol.nebulization?.length) mods.push("Nebulization");
  if (protocol.topicals?.length) mods.push("Topicals");
  if (protocol.exosomes?.length) mods.push("Exosomes");
  if (protocol.sirtuinStack?.mitoSTAC) mods.push("MitoSTAC");
  if (protocol.dietaryProtocol?.phases?.length) mods.push("Dietary Protocol");

  return mods.length > 0 ? mods.join(", ") : "See protocol details";
}

function buildHBOTChamber(protocol: HealingProtocol): string {
  const p = protocol as any;
  const hbot = p.hbotProtocol || p.hbot;
  if (!hbot) return "Not selected";

  const chamber = hbot.chamber || hbot.chamberModel || hbot.chamberType || "";
  const pressure = hbot.pressure || hbot.ata || "";
  const parts: string[] = [];
  if (chamber) parts.push(String(chamber));
  if (pressure) parts.push(`${pressure} ATA`);

  return parts.length > 0 ? parts.join(" — ") : "HBOT included — see details";
}

function buildNotesSection(protocol: HealingProtocol, profile: PatientProfile): string {
  const notes: string[] = [];
  const p = protocol as any;
  const pr = profile as any;

  if (p.specialNotes) notes.push(String(p.specialNotes));
  if (p.additionalNotes) notes.push(String(p.additionalNotes));
  if (pr.specialConsiderations) notes.push(String(pr.specialConsiderations));

  const conditions = p.conditions || pr.conditions || [];
  if (conditions.length > 0) {
    notes.push(`Focus areas: ${conditions.join(", ")}`);
  }

  return notes.length > 0 ? notes.join(". ") : "Standard 90-day protocol";
}

function buildTrustee(protocol: HealingProtocol, profile: PatientProfile): string {
  const p = protocol as any;
  const pr = profile as any;
  const trustee = p.trustee || p.referringPractitioner ||
    pr.referringDoctor || pr.trustee || "";
  return trustee ? String(trustee) : "Forgotten Formula PMA";
}

export async function generateProtocolPPTXFromTemplate(
  protocol: HealingProtocol,
  profile: PatientProfile
): Promise<Buffer> {
  console.log(`[PPTX-Template] Generating presentation for ${sanitizePmaLanguage(protocol.patientName)} using Trustee final template`);

  let templateData: Buffer;
  try {
    templateData = fs.readFileSync(TEMPLATE_PATH);
  } catch (err: any) {
    throw new Error(`Protocol template not found at ${TEMPLATE_PATH}: ${err.message}`);
  }

  const zip = await JSZip.loadAsync(templateData);

  const patientName = sanitizePmaLanguage(protocol.patientName || "Member");
  const startDate = protocol.generatedDate || new Date().toISOString().split("T")[0];
  const selectedPeptides = buildSelectedPeptidesList(protocol);
  const selectedModalities = buildSelectedModalities(protocol);
  const hbotChamber = buildHBOTChamber(protocol);
  const trustee = buildTrustee(protocol, profile);
  const notes = buildNotesSection(protocol, profile);

  const slide1File = zip.file("ppt/slides/slide1.xml");
  if (slide1File) {
    let xml = await slide1File.async("text");
    xml = replaceTextInXml(xml, "[Patient Name]", patientName);
    zip.file("ppt/slides/slide1.xml", xml);
  }

  const slide36File = zip.file("ppt/slides/slide36.xml");
  if (slide36File) {
    let xml = await slide36File.async("text");
    xml = replaceTextInXml(xml, "[From intake form]", patientName);
    xml = replaceTextInXml(xml, "MM / DD / YYYY", startDate);
    xml = replaceTextInXml(xml, "[List selected peptides from Protocol Builder]", selectedPeptides);
    xml = replaceTextInXml(xml, "[HBOT, IV, Detox, Cannabinoid selections]", selectedModalities);
    xml = replaceTextInXml(xml, "[Chamber model + pricing]", hbotChamber);
    xml = replaceTextInXml(xml, "[Protocol-specific notes, dosing adjustments, scheduling preferences]", notes);
    zip.file("ppt/slides/slide36.xml", xml);
  }

  const presFile = zip.file("ppt/presentation.xml");
  if (presFile) {
    let xml = await presFile.async("text");
    xml = xml.replace(
      /<dc:title>[^<]*<\/dc:title>/,
      `<dc:title>${patientName} — Member Protocol 2026</dc:title>`
    );
    zip.file("ppt/presentation.xml", xml);
  }

  const coreFile = zip.file("docProps/core.xml");
  if (coreFile) {
    let xml = await coreFile.async("text");
    xml = xml.replace(
      /<dc:title>[^<]*<\/dc:title>/,
      `<dc:title>${patientName} — Member Protocol 2026</dc:title>`
    );
    xml = xml.replace(
      /<dc:creator>[^<]*<\/dc:creator>/,
      `<dc:creator>Forgotten Formula PMA — DR. FORMULA</dc:creator>`
    );
    zip.file("docProps/core.xml", xml);
  }

  const appFile = zip.file("docProps/app.xml");
  if (appFile) {
    let xml = await appFile.async("text");
    xml = xml.replace(
      /<vt:lpstr>[^<]*<\/vt:lpstr>/,
      `<vt:lpstr>${patientName} Protocol</vt:lpstr>`
    );
    zip.file("docProps/app.xml", xml);
  }

  const outputData = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  console.log(`[PPTX-Template] Generated ${(outputData.length / 1024 / 1024).toFixed(1)}MB presentation for ${sanitizePmaLanguage(protocol.patientName)} (37 slides from Trustee template)`);
  return outputData;
}
