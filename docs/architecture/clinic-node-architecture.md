# FFPMA Clinic Node Architecture

## Overview

The Forgotten Formula PMA operates as a distributed network of autonomous clinic nodes. Each node runs the full FFPMA application stack and can operate independently if the central connection is severed, ensuring no single point of failure can take down the network.

## Node Design Pattern

### Standalone Operation
Each clinic node contains:
- **PostgreSQL Database**: Full replica of member data, protocols, products, and training content
- **Node.js API Server**: Complete FFPMA API with local ALLIO agent access
- **React Frontend**: Member portal, clinic dashboard, protocol assembly
- **Redis Cache**: Session management, rate limiting, query caching
- **Nginx Reverse Proxy**: SSL termination, load balancing, static assets

### Sync Architecture
- **Primary-Replica Model**: Central node (US East) is the primary write target
- **PostgreSQL Streaming Replication**: WAL-based replication for near-real-time sync
- **Target Lag**: <5 seconds under normal conditions
- **Conflict Resolution**: Last-write-wins with full audit trail
- **Selective Replication**: Only essential tables are replicated (see table list below)

### Replicated Tables
1. `users` - Member accounts
2. `member_profiles` - Member details and preferences
3. `clinics` - Clinic information
4. `products` - Product catalog
5. `programs` - Wellness programs
6. `library_items` - Educational content
7. `training_modules` - Training curriculum
8. `quizzes` - Assessment content
9. `contracts` - Legal agreements
10. `orders` - Transaction history
11. `protocol_sessions` - Protocol assembly data

## Failover System

### Heartbeat Protocol
- Each node sends a heartbeat every 60 seconds
- Heartbeat includes: CPU, memory, disk usage, active connections, member count, replication lag
- Nodes that miss heartbeats for 2 minutes are marked "degraded"
- Nodes that miss heartbeats for 5 minutes are marked "offline" and trigger failover

### Automatic Failover
1. System detects node failure (missed heartbeat threshold)
2. Checks configured failover target first
3. Falls back to nearest online node in same region
4. Last resort: any online node with lowest failover priority number
5. Traffic rerouted, event logged, alerts triggered
6. Member data preserved through replication

### Failover Priority
- Priority 1: Central primary node
- Priority 10-50: Regional secondary nodes
- Priority 100: Default for new nodes

## Health Monitoring

### Dashboard Features
- Real-time node status (online/degraded/offline/provisioning)
- CPU, memory, disk utilization metrics with visual bars
- Replication state and lag tracking
- Event log with severity levels (info/warning/critical)
- Event acknowledgement workflow
- Global jurisdiction mapping with health freedom scores

### Alert Thresholds
- CPU > 90%: Node marked degraded
- Memory > 90%: Node marked degraded
- Disk > 95%: Node marked degraded
- Replication lag > 300s: Node marked degraded
- Replication lag > 600s: Replication state = stale
- No heartbeat 5min: Node marked offline, failover triggered

## Deployment Pipeline

### 10-Step Node Provisioning
1. Infrastructure Provisioning (4 vCPU, 8GB RAM, 100GB SSD minimum)
2. Network Configuration (VPN, DNS, firewall: 443, 5432, 6379)
3. Database Setup (PostgreSQL 15+, streaming replication, WAL archiving)
4. Application Deployment (Node.js 20+, Redis, Nginx)
5. SSL/TLS Certificates (Let's Encrypt, auto-renewal, mTLS inter-node)
6. Replication Verification (lag <5s, consistency check, read/write test)
7. Health Check Registration (heartbeat 60s, alert thresholds)
8. Failover Testing (simulate failure, verify rerouting, data integrity)
9. Load Testing (100 concurrent members, <200ms response, resource check)
10. Go-Live Approval (Trustee approval, DNS update, 24h burn-in)

## Global Expansion Framework

### Jurisdiction Assessment Criteria
- **Legal System**: Must be common law or compatible
- **Constitutional Basis**: Freedom of association protections analogous to US 1st/14th Amendments
- **Health Freedom Score**: 0-100 rating based on constitutional protections, regulatory environment, and precedent
- **PMA Viability**: Assessment of whether private membership association model is legally defensible
- **Data Privacy**: Compliance requirements for member data (GDPR, PIPEDA, etc.)
- **Cross-Border Data Rules**: Requirements for international data transfers

### Target Jurisdictions (by Health Freedom Score)
| Country | Score | Status | Legal Basis |
|---------|-------|--------|-------------|
| United States | 92 | Active | 1st/14th Amendments, Right to Try Act |
| Canada | 78 | Researching | Charter Sections 2(d), 7; Chaoulli v. Quebec |
| New Zealand | 76 | Researching | NZBORA Section 17; strong natural health industry |
| India | 75 | Researching | Article 19(1)(c), 21; AYUSH Ministry support |
| Jamaica | 74 | Researching | Charter of Fundamental Rights 2011 |
| United Kingdom | 72 | Researching | Human Rights Act 1998, ECHR Article 11 |
| Ireland | 71 | Researching | Constitution Article 40.6.1(iii), ECHR |
| Australia | 70 | Researching | Implied constitutional right, common law |
| South Africa | 68 | Researching | Constitution Sections 18, 27, 12 |
| Kenya | 65 | Researching | Constitution Articles 36, 43, 31 |

## API Endpoints

### Node Management
- `GET /api/clinic-nodes` - List all nodes
- `GET /api/clinic-nodes/health-summary` - Network health overview
- `GET /api/clinic-nodes/:id` - Node details
- `POST /api/clinic-nodes/register` - Register new node
- `PUT /api/clinic-nodes/:id/status` - Update node status
- `POST /api/clinic-nodes/heartbeat` - Node heartbeat (no auth required)
- `POST /api/clinic-nodes/check-failover` - Manual failover check
- `GET /api/clinic-nodes/events` - Node event log
- `POST /api/clinic-nodes/events/:id/acknowledge` - Acknowledge event
- `GET /api/clinic-nodes/deployment-checklist` - Provisioning checklist
- `GET /api/clinic-nodes/replication/logs` - Replication history

### Jurisdiction Management
- `GET /api/jurisdictions` - List all jurisdictions
- `GET /api/jurisdictions/:id` - Jurisdiction details
- `POST /api/jurisdictions` - Create/update jurisdiction

### Data Seeding
- `POST /api/clinic-nodes/seed` - Initialize primary node + jurisdiction data

## Security

### Inter-Node Communication
- mTLS (mutual TLS) for all node-to-node traffic
- VPN tunnels between nodes
- Config hash verification on sync
- Heartbeat endpoint is unauthenticated (by design) but uses node identifier for lookup

### Data Protection
- All data encrypted in transit (TLS 1.3)
- Database encryption at rest
- Member PII replicated only to jurisdictions with adequate data protection
- Audit trail for all replication and failover events
