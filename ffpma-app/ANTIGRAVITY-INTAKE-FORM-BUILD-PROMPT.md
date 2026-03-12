# Patient Intake Form - Custom Build Specification
**For:** Antigravity  
**Project:** FFPMA Patient Intake System (Steve Baker Model)  
**Deadline:** ASAP (after ML APIs deployment complete)  
**Platform:** ffpma.com (VPS deployment, Linux/Nginx)

---

## PROJECT OVERVIEW

Build a comprehensive patient intake form that automates the Steve Baker Model 1-hour life timeline collection process. The form will reduce Trustee's intake time from 60 minutes to 15 minutes by having patients fill out their complete health history BEFORE the appointment.

**Goal:** Save 45 minutes per patient = 4x patient capacity

---

## TECHNICAL REQUIREMENTS

### Deployment Environment
- **Server:** VPS at 130.49.160.73 (vm93616.vpsone.xyz)
- **OS:** Linux (Ubuntu/Debian)
- **Web Server:** Nginx (already configured for ffpma.com)
- **Application:** Node.js backend (PM2 managed)
- **Database:** PostgreSQL via Neon (existing connection in .env)
- **Build:** Must compile for Linux (not Windows)

### Critical Deployment Requirements
⚠️ **MUST AVOID 502 BAD GATEWAY ERRORS:**

1. **Build for Linux:**
   - Use esbuild or similar (NOT Vite if it causes issues)
   - Test build completes successfully before deployment
   - Compile to `/root/allio-v1/dist/` directory
   - Ensure dist/index.cjs is Linux-compatible

2. **Nginx Configuration:**
   - Add intake form routes to existing nginx config
   - Proxy pass to Node.js backend (port 5000)
   - Set appropriate timeouts (upload_timeout, proxy_timeout)
   - Handle file uploads (if including image/document upload feature)

3. **PM2 Restart:**
   - After deployment, restart: `pm2 restart allio-v1`
   - Verify no errors in logs: `pm2 logs allio-v1 --lines 50`
   - Check application responds: `curl http://localhost:5000/api/health`

4. **Testing Checklist:**
   - [ ] Build completes without errors
   - [ ] dist/index.cjs rebuilt with new routes
   - [ ] PM2 restart successful
   - [ ] No errors in PM2 logs
   - [ ] Form loads at https://ffpma.com/intake (or chosen URL)
   - [ ] Form submission works
   - [ ] Data saves to Google Sheet
   - [ ] No 502 errors when accessing form

---

## FUNCTIONAL REQUIREMENTS

### User Flow
1. Patient receives intake form link (via email/SMS)
2. Patient fills out multi-step wizard (saves draft locally)
3. Patient submits completed form
4. Data saves to Google Sheet (via Sheets API)
5. Confirmation email sent to patient (via Gmail API)
6. Notification sent to Trustee (form ready for review)
7. DR_FORMULA agent can now read Sheet and generate protocol

### Data Output
**Primary:** Google Sheets (via existing Sheets API integration)
- Sheet ID: To be created (or use existing template)
- Tab 1: Raw Responses (all form fields)
- Tab 2: Structured Timeline (organized by decade)
- Tab 3: Root Cause Flags (auto-populated based on responses)

**Secondary:** Database backup (PostgreSQL)
- Store in `patient_records` table (if exists) or create new `intake_forms` table
- Fields: patient_id, form_data (JSON), submitted_at, reviewed_by, status

**Notification:** Email to Trustee
- Subject: "New Patient Intake: [Patient Name]"
- Body: Summary of key findings + link to Google Sheet
- Sent via Gmail API (already configured)

---

## FORM STRUCTURE

### Multi-Step Wizard (7 Steps + Review)

**Progress Indicator:** Show current step (e.g., "Step 3 of 8: Environmental Exposures")

**Save Draft Feature:**
- Auto-save to localStorage every 30 seconds
- "Save & Continue Later" button
- Resume via unique link (email or localStorage)

**Navigation:**
- Next/Previous buttons
- Skip optional sections (but mark as incomplete)
- Jump to step via progress bar (only for completed steps)

---

### STEP 1: Basic Information

**Fields:**
- Full Name (required)
- Date of Birth (required, datepicker)
- Age (auto-calculated)
- Email (required, validation)
- Phone (required, formatting)
- Gender (select: Male/Female/Other/Prefer not to say)
- Current Location (City, State, Country)

**Primary Concern:**
- "What is your main health concern today?" (textarea, 500 chars)

**Goals for Healing:**
- "What are your goals for working with FFPMA?" (textarea, 500 chars)

---

### STEP 2: Life Timeline (Dynamic by Decade)

**Instructions:**
"We're going to walk through your life from birth to present. For each period, tell us about major health events, illnesses, exposures, and traumas."

**Decades (Conditional - show based on age):**
- Birth - Age 10: Childhood
- Age 11-20: Adolescence  
- Age 21-30: Young Adult
- Age 31-40: Adult
- Age 41-50: Middle Age
- Age 51-60: Mature Adult
- Age 61+: Senior

**For Each Decade, Ask:**

1. **Major Health Events:**
   - Illnesses, hospitalizations, surgeries
   - Diagnoses received
   - Medications started
   - (textarea, 1000 chars)

2. **Environmental Changes:**
   - Where you lived (city/state, housing type)
   - Occupational exposures
   - Major life changes (moves, job changes, relationships)
   - (textarea, 1000 chars)

3. **Notable Symptoms:**
   - Chronic symptoms that started
   - Energy levels, digestive issues, mental health
   - (textarea, 1000 chars)

**Dynamic Logic:**
- Only show decades patient has lived through
- Example: 35-year-old sees 4 sections (0-10, 11-20, 21-30, 31-35)
- Current decade section titled: "Current (Age [X] - Present)"

---

### STEP 3: Environmental Exposures

**Mold Exposure:**
- Ever lived/worked in water-damaged building? (Yes/No)
- If Yes:
  - When? (date range picker)
  - Where? (address or general location)
  - Duration? (months/years)
  - Symptoms noticed? (textarea)
  - Tested/remediated? (Yes/No)

**Chemical Exposures:**
- Pesticides/herbicides (agriculture, lawn care, household)
- Industrial chemicals (occupation-related)
- Household toxins (cleaning products, air fresheners, etc.)
- For each: Yes/No → When/Where/Duration

**Heavy Metals:**
- Amalgam fillings? (Yes/No) → How many? When placed?
- Lead exposure? (old paint, water pipes, etc.)
- Other metals? (arsenic, cadmium, aluminum)
- For each: Yes/No → When/Where/Duration

**EMF/Radiation:**
- High EMF exposure? (cell towers, power lines, occupational)
- Radiation exposure? (X-rays, CT scans, etc.)
- For each: Yes/No → When/Where/Duration

**Water/Air Quality:**
- Well water vs municipal? 
- Filter system? (Yes/No)
- Air quality concerns? (traffic, industrial, wildfires)
- (textarea, 500 chars)

---

### STEP 4: Trauma & Stress History

**Childhood Trauma (ACEs - Adapted):**
"Before age 18, did you experience any of the following?" (checkboxes)
- [ ] Physical abuse
- [ ] Emotional abuse
- [ ] Sexual abuse
- [ ] Physical neglect
- [ ] Emotional neglect
- [ ] Parent with mental illness
- [ ] Parent with substance abuse
- [ ] Parent incarcerated
- [ ] Domestic violence
- [ ] Parental separation/divorce

**Major Life Stressors:**
- Death of loved one (when, relationship)
- Divorce/separation (when)
- Job loss/financial crisis (when)
- Serious illness/injury (when)
- Other major trauma (describe)
- (repeating fields - add multiple events)

**Current Stress:**
- Stress level (1-10 slider)
- Main sources of stress (checkboxes + other)
- Coping mechanisms (textarea)

**Mental/Emotional Health:**
- History of anxiety? (Yes/No) → When diagnosed? Current?
- History of depression? (Yes/No) → When diagnosed? Current?
- PTSD? (Yes/No) → When diagnosed? Current?
- Other mental health diagnoses? (textarea)

---

### STEP 5: Current Symptoms (System-by-System)

**Instructions:**
"Check all symptoms you currently experience (past 6 months). Rate severity: Mild (1) / Moderate (2) / Severe (3)"

**Digestive System:**
- [ ] Bloating (severity: 1-3)
- [ ] Gas (severity: 1-3)
- [ ] Constipation (severity: 1-3)
- [ ] Diarrhea (severity: 1-3)
- [ ] Acid reflux (severity: 1-3)
- [ ] Nausea (severity: 1-3)
- [ ] Food sensitivities (severity: 1-3) → Which foods? (textarea)
- [ ] Other digestive issues (describe)

**Hormonal System:**
- [ ] Fatigue (severity: 1-3)
- [ ] Weight gain (severity: 1-3)
- [ ] Weight loss (severity: 1-3)
- [ ] Hair loss (severity: 1-3)
- [ ] Hot flashes (severity: 1-3)
- [ ] Low libido (severity: 1-3)
- [ ] Irregular periods (severity: 1-3)
- [ ] Mood swings (severity: 1-3)
- [ ] Other hormonal issues (describe)

**Neurological System:**
- [ ] Brain fog (severity: 1-3)
- [ ] Memory issues (severity: 1-3)
- [ ] Headaches (severity: 1-3)
- [ ] Migraines (severity: 1-3)
- [ ] Numbness/tingling (severity: 1-3)
- [ ] Tremors (severity: 1-3)
- [ ] Dizziness (severity: 1-3)
- [ ] Other neurological issues (describe)

**Immune System:**
- [ ] Frequent infections (severity: 1-3)
- [ ] Autoimmune condition (severity: 1-3) → Which? (textarea)
- [ ] Allergies (severity: 1-3) → To what? (textarea)
- [ ] Chronic inflammation (severity: 1-3)
- [ ] Other immune issues (describe)

**Cardiovascular System:**
- [ ] High blood pressure (severity: 1-3)
- [ ] Heart palpitations (severity: 1-3)
- [ ] Chest pain (severity: 1-3)
- [ ] Poor circulation (severity: 1-3)
- [ ] Other cardiovascular issues (describe)

**Musculoskeletal System:**
- [ ] Joint pain (severity: 1-3) → Where? (textarea)
- [ ] Muscle pain (severity: 1-3) → Where? (textarea)
- [ ] Stiffness (severity: 1-3)
- [ ] Weakness (severity: 1-3)
- [ ] Other musculoskeletal issues (describe)

**Skin:**
- [ ] Rashes (severity: 1-3) → Where? (textarea)
- [ ] Acne (severity: 1-3)
- [ ] Eczema (severity: 1-3)
- [ ] Psoriasis (severity: 1-3)
- [ ] Other skin issues (describe)

**Respiratory:**
- [ ] Shortness of breath (severity: 1-3)
- [ ] Chronic cough (severity: 1-3)
- [ ] Asthma (severity: 1-3)
- [ ] Sinus issues (severity: 1-3)
- [ ] Other respiratory issues (describe)

**Free-Form Description:**
- "Describe your main symptoms in your own words" (textarea, 2000 chars)

---

### STEP 6: Dental & Surgical History

**Dental:**
- Amalgam fillings? (Yes/No) → How many? (number) → When placed? (date)
- Root canals? (Yes/No) → How many? (number) → Which teeth? (textarea)
- Crowns/bridges? (Yes/No) → Details (textarea)
- Implants? (Yes/No) → Details (textarea)
- Gum disease? (Yes/No) → When diagnosed? (date)
- Other dental issues? (textarea)

**Surgeries:**
- Gallbladder removed? (Yes/No) → When? (date)
- Appendix removed? (Yes/No) → When? (date)
- Tonsils removed? (Yes/No) → When? (date)
- Hysterectomy? (Yes/No) → When? (date)
- Other surgeries? (repeating fields: Surgery name, date, reason)

**Implants/Devices:**
- Pacemaker? (Yes/No)
- Breast implants? (Yes/No)
- Joint replacements? (Yes/No)
- Other implants? (textarea)

---

### STEP 7: Diet & Lifestyle

**Current Diet:**
- Diet type (select: Standard American, Vegetarian, Vegan, Paleo, Keto, Carnivore, Mediterranean, Other)
- If Other, describe (textarea)
- Typical breakfast (textarea, 200 chars)
- Typical lunch (textarea, 200 chars)
- Typical dinner (textarea, 200 chars)
- Snacks (textarea, 200 chars)
- Water intake (oz/day, number input)

**Food Sensitivities/Allergies:**
- Known sensitivities? (textarea)
- Gluten-free? (Yes/No)
- Dairy-free? (Yes/No)
- Other restrictions? (textarea)

**Supplements:**
- Currently taking? (Yes/No)
- If Yes, list all (textarea, 1000 chars)

**Medications:**
- Currently taking? (Yes/No)
- If Yes, list all (name, dose, duration) (textarea, 1000 chars)

**Lifestyle:**
- Exercise frequency (select: None, 1-2x/week, 3-4x/week, 5+x/week)
- Exercise type (checkboxes: Cardio, Strength, Yoga, Walking, Sports, Other)
- Sleep hours/night (number input)
- Sleep quality (1-10 slider)
- Alcohol use (select: None, Occasional, Weekly, Daily)
- Tobacco use (select: Never, Former, Current)
- Recreational drugs? (Yes/No) → If yes, describe (textarea)

**Stress Management:**
- Meditation? (Yes/No) → Frequency? (select)
- Prayer/spiritual practice? (Yes/No) → Frequency? (select)
- Therapy/counseling? (Yes/No) → Current or past?
- Other practices? (textarea)

---

### STEP 8: Review & Submit

**Summary Page:**
- Display all answers in organized sections
- "Edit" button next to each section (jumps back to that step)
- Completion indicator (e.g., "All required fields complete ✓")

**Consent:**
- [ ] "I confirm all information provided is accurate to the best of my knowledge" (required)
- [ ] "I consent to FFPMA storing this information securely" (required)
- [ ] "I understand this intake will be reviewed by a FFPMA practitioner" (required)

**Submit Button:**
- "Submit Intake Form"
- Loading state ("Submitting...")
- Success message: "Thank you! Your intake has been submitted. You'll receive a confirmation email shortly."
- Error handling: "Submission failed. Please try again or contact support."

---

## UI/UX DESIGN

### Visual Style
- **Match FFPMA Branding:**
  - Colors: (use existing ffpma.com palette)
  - Fonts: (match existing site)
  - Logo: Include FFPMA logo at top

- **Clean, Medical-Professional Look:**
  - White/light gray background
  - Clear section headers
  - Plenty of whitespace
  - Easy-to-read fonts (16px minimum)

- **Mobile-Responsive:**
  - Works on phone, tablet, desktop
  - Touch-friendly (larger tap targets)
  - Vertical layout on mobile

### User Experience
- **Progress Indicator:** Always visible (e.g., "Step 3 of 8: Environmental Exposures")
- **Validation:** Real-time (red border on invalid fields)
- **Help Text:** Tooltips/info icons for complex questions
- **Character Counters:** Show remaining characters for textareas
- **Auto-Save:** "Draft saved" indicator
- **Keyboard Navigation:** Tab through fields, Enter to submit

### Accessibility
- ARIA labels on all form fields
- Keyboard accessible
- Screen reader friendly
- High contrast mode support
- Skip to section navigation

---

## BACKEND IMPLEMENTATION

### API Endpoints (Add to /root/allio-v1/server/)

**POST /api/intake/submit**
- Accepts form data (JSON)
- Validates all required fields
- Saves to Google Sheet via Sheets API
- Saves backup to PostgreSQL
- Sends confirmation email via Gmail API
- Returns: { success: true, sheetId: "...", confirmationId: "..." }

**POST /api/intake/save-draft**
- Accepts partial form data (JSON)
- Saves to database with status: "draft"
- Returns: { success: true, draftId: "..." }

**GET /api/intake/resume/:draftId**
- Retrieves saved draft
- Returns: { formData: {...} }

**GET /api/intake/sheet-template**
- Returns Google Sheet template ID
- Or creates new sheet if doesn't exist

### Google Sheets Integration

**Sheet Structure:**

**Tab 1: Raw Responses**
Columns:
- Submission Date
- Patient Name
- Email
- Phone
- Age
- Primary Concern
- (all other form fields as columns)

**Tab 2: Timeline (Structured)**
Columns:
- Patient Name
- Decade (0-10, 11-20, etc.)
- Health Events
- Environmental Changes
- Symptoms

**Tab 3: Root Cause Flags**
Auto-populated based on responses:
- Mold Exposure? (Yes/No)
- Heavy Metals? (Yes/No)
- Childhood Trauma? (ACE Score)
- Gut Issues? (Yes/No)
- Hormone Disruption? (Yes/No)
- Autoimmune? (Yes/No)
- Chronic Stress? (Yes/No)

**Functions to Implement:**
```javascript
// server/services/intake.ts
export async function submitIntakeForm(formData) {
  // 1. Validate data
  const validated = validateIntakeData(formData);
  
  // 2. Save to Google Sheet
  const sheetId = await saveToGoogleSheet(validated);
  
  // 3. Save to database (backup)
  const dbId = await saveToDatabase(validated);
  
  // 4. Send confirmation email
  await sendConfirmationEmail(validated.email, sheetId);
  
  // 5. Notify Trustee
  await notifyTrustee(validated.name, sheetId);
  
  return { success: true, sheetId, dbId };
}

async function saveToGoogleSheet(data) {
  const sheets = await getUncachableSheetsClient();
  
  // Use existing template or create new
  const sheetId = process.env.INTAKE_SHEET_TEMPLATE_ID || await createNewSheet();
  
  // Append to Raw Responses tab
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Raw Responses!A:ZZ',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [formatRowData(data)]
    }
  });
  
  // Append to Timeline tab (structured)
  await appendTimelineData(sheetId, data.timeline);
  
  // Update Root Cause Flags tab
  await updateRootCauseFlags(sheetId, data);
  
  return sheetId;
}
```

### Database Schema (PostgreSQL)

**Create new table:**
```sql
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name VARCHAR(255) NOT NULL,
  patient_email VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(50),
  date_of_birth DATE,
  age INTEGER,
  
  form_data JSONB NOT NULL,  -- Full form data as JSON
  
  google_sheet_id VARCHAR(255),  -- Link to Google Sheet
  
  status VARCHAR(50) DEFAULT 'submitted',  -- draft, submitted, reviewed, processed
  
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_intake_patient_email ON intake_forms(patient_email);
CREATE INDEX idx_intake_status ON intake_forms(status);
CREATE INDEX idx_intake_submitted_at ON intake_forms(submitted_at);
```

---

## DEPLOYMENT STEPS

### 1. Build Process

```bash
# On your local Windows machine:
cd /path/to/allio-v1
npm install  # Ensure all dependencies

# Build using esbuild (NOT Vite if it causes issues)
# Use custom build script or:
npm run build

# Verify build succeeded
ls -lh dist/index.cjs  # Should be ~15-20 MB

# Test locally first
node dist/index.cjs  # Should start without errors
```

### 2. VPS Deployment

```bash
# SSH into VPS
ssh root@130.49.160.73

# Backup current deployment
cd /root/allio-v1
cp -r dist dist.backup.$(date +%Y%m%d-%H%M%S)

# Upload new build (from your machine)
# Use WinSCP or:
scp dist/index.cjs root@130.49.160.73:/root/allio-v1/dist/

# Or if deploying full folder:
# Zip on Windows, upload, extract on VPS
```

### 3. Nginx Configuration

**Edit nginx config:**
```bash
nano /etc/nginx/sites-available/ffpma.com
```

**Add intake form routes:**
```nginx
server {
    server_name ffpma.com www.ffpma.com;
    
    # Existing configuration...
    
    # NEW: Intake form routes
    location /intake {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Prevent 502 errors:
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /api/intake {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Prevent 502 errors:
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # If allowing file uploads:
        client_max_body_size 10M;
    }
    
    # Existing SSL and other config...
}
```

**Test nginx config:**
```bash
nginx -t
```

**If OK, reload nginx:**
```bash
systemctl reload nginx
```

### 4. PM2 Restart & Verification

```bash
cd /root/allio-v1

# Restart application
pm2 restart allio-v1

# Watch logs for errors
pm2 logs allio-v1 --lines 50

# Should see something like:
# "[express] serving on port 5000"
# "[startup] Intake form routes registered"
# NO errors about missing modules or 502s

# Test health endpoint
curl http://localhost:5000/api/health

# Test intake form loads
curl -I https://ffpma.com/intake
# Should return: HTTP/1.1 200 OK
# NOT: HTTP/1.1 502 Bad Gateway
```

### 5. Post-Deployment Testing

**Checklist:**
- [ ] Form loads at https://ffpma.com/intake (no 502 error)
- [ ] Can navigate through all steps
- [ ] Validation works (required fields highlighted)
- [ ] Auto-save works (check localStorage)
- [ ] Submit succeeds
- [ ] Data appears in Google Sheet
- [ ] Confirmation email sent
- [ ] No errors in PM2 logs
- [ ] Mobile responsive (test on phone)

**If 502 Error Occurs:**
1. Check PM2 logs: `pm2 logs allio-v1 --err --lines 100`
2. Check nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify Node.js running: `pm2 status`
4. Check port 5000 listening: `netstat -tulpn | grep 5000`
5. Restart nginx: `systemctl restart nginx`
6. Restart PM2: `pm2 restart allio-v1`

---

## GOOGLE SHEETS API SETUP

**Sheet Template ID:**
- Create manually or via API
- Store in .env: `INTAKE_SHEET_TEMPLATE_ID=<sheet-id>`
- Or create dynamically on first submission

**Permissions:**
- Sheet should be owned by blake@forgottenformula.com
- Trustee has edit access
- DR_FORMULA agent can read via Sheets API

**Sheet URL Format:**
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
```

---

## NOTIFICATIONS

### Patient Confirmation Email (via Gmail API)

**Template:**
```
Subject: Intake Form Received - FFPMA

Hi [Patient Name],

Thank you for completing your patient intake form!

We've received your information and it's being reviewed by our team. 
You should hear from us within 24-48 hours to schedule your consultation.

Your Intake Summary:
- Primary Concern: [concern]
- Submitted: [date/time]
- Reference ID: [confirmation-id]

If you need to make any changes, please contact us at blake@forgottenformula.com.

Best regards,
The FFPMA Team

---
This is an automated message. Please do not reply directly to this email.
```

### Trustee Notification Email (via Gmail API)

**Template:**
```
Subject: New Patient Intake: [Patient Name]

A new patient intake form has been submitted:

Patient: [Name]
Email: [Email]
Phone: [Phone]
Age: [Age]

Primary Concern: [concern]

Key Flags:
- Mold Exposure: [Yes/No]
- Heavy Metals: [Yes/No]
- ACE Score: [score]
- Autoimmune: [Yes/No]

View full intake:
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit

Ready for DR_FORMULA to generate protocol.

---
Automated notification from FFPMA intake system
```

---

## TESTING PLAN

### Unit Tests
- Form validation functions
- Google Sheets data formatting
- Email template rendering
- Draft save/resume logic

### Integration Tests
- Full form submission flow
- Google Sheets API integration
- Gmail API email sending
- Database backup creation

### User Acceptance Tests
- Trustee fills out form as test patient
- Verify data appears correctly in Sheet
- Confirm emails sent
- Test DR_FORMULA can read Sheet

---

## SUCCESS METRICS

**Technical:**
- [ ] Build completes without errors
- [ ] Deploys to VPS successfully
- [ ] No 502 errors
- [ ] Form loads in <2 seconds
- [ ] Submission completes in <5 seconds
- [ ] 100% uptime first 24 hours

**Functional:**
- [ ] All 7 steps work
- [ ] Conditional logic works (age-based timeline)
- [ ] Auto-save works
- [ ] Data saves to Google Sheet correctly
- [ ] Emails send successfully
- [ ] Mobile responsive

**User Experience:**
- [ ] Trustee approves UX
- [ ] First patient completes form without issues
- [ ] DR_FORMULA can read and process data
- [ ] Saves Trustee time (target: 45 min/patient)

---

## TIMELINE ESTIMATE

**Build:** 3-4 hours (including testing)
**Deploy:** 30 minutes (build, upload, nginx config, restart)
**Test:** 1 hour (full workflow verification)

**Total:** 4.5-5.5 hours

---

## DELIVERABLES

1. **Source Code:**
   - Frontend: Multi-step form component
   - Backend: API endpoints (/api/intake/*)
   - Database: Migration scripts

2. **Deployment Package:**
   - Built dist/index.cjs (Linux-compatible)
   - Updated nginx config
   - PM2 restart script
   - Deployment verification checklist

3. **Documentation:**
   - User guide for patients (how to fill out form)
   - Admin guide for Trustee (how to review submissions)
   - Developer docs (API endpoints, database schema)
   - Troubleshooting guide (502 errors, failed submissions)

4. **Google Sheet Template:**
   - Pre-formatted with 3 tabs
   - Sample data for testing
   - Shared with Trustee

---

## PRIORITY NOTES

⚠️ **CRITICAL:**
- Must build for Linux (not Windows)
- Must not cause 502 errors (nginx timeouts, build issues)
- Must integrate with existing Sheets API (already working)
- Must be mobile-responsive (patients fill out on phones)

✅ **NICE TO HAVE (if time permits):**
- File upload (lab results, photos)
- E-signature integration
- Multi-language support (Spanish)
- Progress analytics (completion rates)

---

## QUESTIONS FOR ANTIGRAVITY

Before you start, confirm:

1. **Build Tool:** esbuild (bypassing Vite)? Or another tool?
2. **Frontend Framework:** React (existing stack)? Or vanilla JS for simplicity?
3. **Database Table:** Create new `intake_forms` or use existing `patient_records`?
4. **Sheet Template:** Create manually first, or generate via code?
5. **Testing:** Deploy to staging first, or straight to production?

---

## CONTACT

**Questions?** Ask Trustee via WhatsApp (+19405970117)

**VPS Access:** SSH root@130.49.160.73 (you already have deploy scripts)

**Codebase:** /root/allio-v1/ on VPS

**Nginx Config:** /etc/nginx/sites-available/ffpma.com

---

**LET'S BUILD THIS AND SAVE TRUSTEE 45 MINUTES PER PATIENT! 🚀**

**Estimated Impact:**
- 4 patients/day × 45 min saved = 3 hours/day
- 20 patients/week × 45 min = 15 hours/week
- = 60 hours/month freed up for actual healing work

**This form is a game-changer. Build it right, deploy it clean, no 502s.** 💪
