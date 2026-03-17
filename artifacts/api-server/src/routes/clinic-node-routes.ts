import { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../working-auth";
import {
  getAllNodes,
  getNodeById,
  getNodeByIdentifier,
  registerNode,
  updateNodeStatus,
  processHeartbeat,
  checkForFailover,
  getNodeHealthSummary,
  getNodeEvents,
  acknowledgeEvent,
  getAllJurisdictions,
  getJurisdictionById,
  upsertJurisdiction,
  getReplicationLogs,
  seedJurisdictions,
  seedPrimaryNode,
  NODE_DEPLOYMENT_CHECKLIST,
  REPLICATION_TABLES,
} from "../services/clinic-node-service";

export function registerClinicNodeRoutes(app: Express): void {
  app.get("/api/clinic-nodes", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const nodes = await getAllNodes();
      res.json({ success: true, nodes });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/clinic-nodes/health-summary", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const summary = await getNodeHealthSummary();
      res.json({ success: true, summary });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/clinic-nodes/deployment-checklist", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    res.json({ success: true, checklist: NODE_DEPLOYMENT_CHECKLIST, replicationTables: REPLICATION_TABLES });
  });

  app.get("/api/clinic-nodes/events", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const nodeId = req.query.nodeId as string | undefined;
      const events = await getNodeEvents(nodeId, limit);
      res.json({ success: true, events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/clinic-nodes/:id", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const node = await getNodeById(req.params.id);
      if (!node) return res.status(404).json({ success: false, error: "Node not found" });
      res.json({ success: true, node });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/clinic-nodes/register", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const { nodeIdentifier, displayName, region, clinicId, jurisdictionId, endpoint, version, isPrimary, failoverPriority } = req.body;
      if (!nodeIdentifier || !displayName || !region) {
        return res.status(400).json({ success: false, error: "nodeIdentifier, displayName, and region are required" });
      }
      const existing = await getNodeByIdentifier(nodeIdentifier);
      if (existing) {
        return res.status(409).json({ success: false, error: "Node with this identifier already exists" });
      }
      const node = await registerNode({ nodeIdentifier, displayName, region, clinicId, jurisdictionId, endpoint, version, isPrimary, failoverPriority });
      res.json({ success: true, node });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put("/api/clinic-nodes/:id/status", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!["online", "degraded", "offline", "provisioning", "decommissioned"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }
      const node = await updateNodeStatus(req.params.id, status);
      if (!node) return res.status(404).json({ success: false, error: "Node not found" });
      res.json({ success: true, node });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/clinic-nodes/heartbeat", async (req: Request, res: Response) => {
    try {
      const nodeApiKey = req.headers["x-node-api-key"] as string;
      if (!nodeApiKey) {
        return res.status(401).json({ success: false, error: "Missing x-node-api-key header" });
      }
      const { nodeIdentifier, ...metrics } = req.body;
      if (!nodeIdentifier) {
        return res.status(400).json({ success: false, error: "nodeIdentifier required" });
      }
      const existingNode = await getNodeByIdentifier(nodeIdentifier);
      if (!existingNode) return res.status(404).json({ success: false, error: "Node not registered" });
      if (existingNode.configHash && existingNode.configHash !== nodeApiKey) {
        return res.status(401).json({ success: false, error: "Invalid node API key" });
      }
      const node = await processHeartbeat(nodeIdentifier, metrics);
      if (!node) return res.status(404).json({ success: false, error: "Node not registered" });
      res.json({ success: true, node: { id: node.id, status: node.status, replicationState: node.replicationState } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/clinic-nodes/check-failover", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const actions = await checkForFailover();
      res.json({ success: true, failoverActions: actions, count: actions.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/clinic-nodes/events/:eventId/acknowledge", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const user = (req as any).session?.user;
      const event = await acknowledgeEvent(req.params.eventId, user?.email || "admin");
      if (!event) return res.status(404).json({ success: false, error: "Event not found" });
      res.json({ success: true, event });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/clinic-nodes/replication/logs", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const nodeId = req.query.nodeId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await getReplicationLogs(nodeId, limit);
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/jurisdictions", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const jurisdictions = await getAllJurisdictions();
      res.json({ success: true, jurisdictions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/jurisdictions/:id", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const jurisdiction = await getJurisdictionById(req.params.id);
      if (!jurisdiction) return res.status(404).json({ success: false, error: "Jurisdiction not found" });
      res.json({ success: true, jurisdiction });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/jurisdictions", requireAuth, requireRole("admin", "trustee"), async (req: Request, res: Response) => {
    try {
      const jurisdiction = await upsertJurisdiction(req.body);
      res.json({ success: true, jurisdiction });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/clinic-nodes/seed", requireAuth, requireRole("admin", "trustee"), async (_req: Request, res: Response) => {
    try {
      const [node, jurisdictionCount] = await Promise.all([
        seedPrimaryNode(),
        seedJurisdictions(),
      ]);
      res.json({ success: true, primaryNode: node, jurisdictionsSeeded: jurisdictionCount });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
