# Clinic Node Deployment Guide

This guide details how to deploy and connect a localized clinic node to the central Allio distributed network. This allows your clinic to securely synchronize encrypted patient metadata and continue operations independently if the central system becomes unreachable.

## Prerequisites

1. Physical hardware running a localized copy of the Allio ecosystem.
2. An active `NODE_API_KEY` and `CLINIC_ID` securely distributed by the central Administrator.
3. Access to terminal to start the node services.

## Setting Up Environment Variables

Create or update the `.env` file on your localized clinic server with the necessary connection parameters:

```env
# URL for the central Allio instance
CENTRAL_ALLIO_URL="https://forgottenformula.com"

# The unique API Key provisioned for your node
NODE_API_KEY="your-secure-node-api-key"

# The localized Clinic ID
CLINIC_ID="your-clinic-uuid"
```

## Running the Instance

1. Ensure all services are up to date and your local `.env` file is properly configured.
2. Start your localized server:
   ```bash
   npm run build
   npm start
   ```

## Verifying Synchronization

Once active, the node will periodically push an encrypted payload containing patient metadata back to the main server.

You can verify the connection manually by triggering a sync ping (this mimics the behavior of the internal cron job):

```bash
curl -X POST https://forgottenformula.com/api/sync/node \
  -H "x-node-api-key: your-secure-node-api-key" \
  -H "x-node-id: your-clinic-node-uuid" \
  -H "Content-Type: application/json" \
  -d '{"payload": {"status": "ok", "encryptedData": "..."}}'
```

If successful, you should receive a `200 OK` response similar to:

```json
{
  "success": true,
  "message": "Sync payload received successfully",
  "serverTimestamp": "2026-03-09T20:00:00.000Z",
  "receivedBytes": 42
}
```

## Fallback Mode

If the central network goes offline, the node will safely queue metadata sync events locally. Normal scheduling and physical clinic operations will not be disrupted based on the constitutional PMA guidelines.
