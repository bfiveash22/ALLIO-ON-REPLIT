# ALLIO v1 Launch Day Runbook
## April 1, 2026

**Document Owner:** SENTINEL  
**Last Updated:** March 13, 2026  
**Approved By:** Trustee

---

## 1. PRE-LAUNCH VERIFICATION (March 31, 2026)

### 1.1 Integration Health Checks (T-24 hours)
| System | Endpoint | Expected Result | Owner |
|--------|----------|-----------------|-------|
| Stripe | `GET /api/checkout/stripe/status` | `{ configured: true, mode: 'live' }` | ATLAS |
| WooCommerce | `GET /api/checkout/health` | `{ status: 'nominal' }` | NEXUS |
| SignNow | `GET /api/signnow/status` | `{ connected: true }` | SCRIBE |
| Gmail | `GET /api/integrations/status` | Gmail: connected | ATHENA |
| Google Drive | `GET /api/integrations/status` | Drive: connected | HERMES |
| Agent Scheduler | `GET /api/admin/scheduler/status` | `{ running: true }` | SENTINEL |
| Database | `GET /api/admin/health` | `{ database: 'connected' }` | NEXUS |

### 1.2 Critical Path Verification
- [ ] Member signup flow: Landing → Join → SignNow → WordPress account → Login
- [ ] Product browsing: Catalog loads, role-based pricing works
- [ ] Checkout: Stripe payment session creation succeeds
- [ ] Intake form: Submission triggers email confirmation
- [ ] Protocol generation: Intake → AI analysis → Protocol output
- [ ] Email delivery: Welcome email sends successfully
- [ ] Agent scheduler: Tasks dispatching and completing

### 1.3 Final Checks
- [ ] All 48 agents registered and active in SENTINEL registry
- [ ] Database migrations applied and verified
- [ ] SSL certificates valid and not expiring within 30 days
- [ ] Error monitoring active (console logs, Sentinel notifications)
- [ ] Backup database snapshot taken

---

## 2. LAUNCH DAY DEPLOYMENT (April 1, 2026)

### 2.1 Deployment Sequence (6:00 AM CST)

**Step 1: Final Build** (6:00 AM)
```bash
npm run build
```

**Step 2: Verify Build Success** (6:15 AM)
- Check build output for errors
- Verify all TypeScript compilation passes

**Step 3: Database Verification** (6:20 AM)
- Confirm all tables exist and are populated
- Verify product catalog has 320+ products synced
- Check training modules (58+) are accessible

**Step 4: Start Services** (6:30 AM)
- Start API server workflow
- Start frontend workflow
- Verify health endpoints respond

**Step 5: Smoke Test** (6:45 AM)
- Load landing page
- Login as test user
- Browse products
- Access training modules
- Verify AI agents respond

**Step 6: Go Live** (7:00 AM CST)
- Announce launch via HERALD email blast
- Enable marketing campaigns
- Monitor real-time metrics

### 2.2 Launch Email Blast
Trigger the April 1 launch announcement email to all registered members via the HERALD email campaign system:
```
POST /api/herald/campaign/launch-announcement
```

---

## 3. REAL-TIME MONITORING PLAN

### 3.1 Dashboard Monitoring
- Trustee Dashboard: Check every 15 minutes for first 4 hours
- Sentinel Alerts: Real-time notification feed
- Agent Scheduler Status: Verify tasks processing

### 3.2 Key Metrics to Watch
| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| API response time | > 2 seconds | Warning |
| API response time | > 5 seconds | Critical |
| Error rate | > 1% of requests | Warning |
| Error rate | > 5% of requests | Critical |
| Concurrent users | > 50 | Monitor |
| Failed payments | Any | Investigate |
| Agent task failures | > 3 consecutive | Warning |

### 3.3 Log Monitoring
- Server console logs for ERROR level entries
- Stripe webhook events for payment failures
- SignNow callback errors
- Email delivery failures

---

## 4. ROLLBACK PROCEDURES

### 4.1 Partial Rollback (Feature-Level)
If a specific feature fails:
1. Disable the feature via environment variable or feature flag
2. Notify affected users via Sentinel
3. Investigate and fix
4. Re-enable after verification

### 4.2 Full Rollback
If critical system failure occurs:
1. Restore from the pre-launch database snapshot
2. Revert to the previous deployment build
3. Notify all team members via ATHENA
4. Send maintenance notification to members
5. Investigate root cause before re-deploying

### 4.3 Payment System Rollback
If Stripe payments fail:
1. Fall back to WooCommerce redirect checkout
2. Notify ATLAS (Financial Division) immediately
3. Monitor refund queue for any stuck transactions

---

## 5. POST-LAUNCH 24-HOUR REVIEW PROTOCOL

### Hour 1-4: Active Monitoring
- Monitor all dashboards continuously
- Respond to any member issues within 15 minutes
- Log all incidents in Sentinel notification system

### Hour 4-8: Stabilization
- Review error logs for patterns
- Verify email delivery rates
- Check agent task completion rates
- First status report to Trustee

### Hour 8-16: Operational Mode
- Reduce monitoring to every 30 minutes
- Process any pending support requests
- Second status report to Trustee

### Hour 16-24: Review
- Compile launch metrics report
- Document any issues encountered and resolutions
- Third status report to Trustee
- Plan next-day priorities

### 24-Hour Report Contents
1. Total new member signups
2. Total product orders and revenue
3. Protocol generations completed
4. API error rate and performance metrics
5. Agent task completion statistics
6. Email delivery success rate
7. Issues encountered and resolutions
8. Recommendations for next 48 hours

---

## 6. CONTACT CHAIN

| Role | Person | Contact |
|------|--------|---------|
| Trustee | Blake | blake@forgottenformula.com |
| Operations | Nancy | nancy@forgottenformula.com |
| AI System | SENTINEL | Automated via dashboard |
| Email System | HERALD | Automated via agent scheduler |
| Security | ATHENA | Automated monitoring |

---

## 7. SENTINEL AUTOMATED REPORTING

SENTINEL will automatically:
- Generate hourly status snapshots for the first 24 hours
- Alert Trustee on any critical system events
- Track agent network health across all 7 divisions
- Log all cross-division coordination events
- Report payment processing statistics

---

*Prepared by SENTINEL on March 13, 2026*
*Approved by Trustee*
