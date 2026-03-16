# Migrate OpenClaw from WhatsApp to Telegram

## Goal Description
The current OpenClaw integration architecture allows Allio Agents to communicate with the Trustee. Currently, agents insert messages into the `openclaw_messages` table, and an external OpenClaw process polls this table to send them via WhatsApp. 
The objective here is to change this connection to use Telegram instead of WhatsApp, entirely from the VPS.

## Proposed Changes
I will implement a standalone Node.js service that acts as the OpenClaw Telegram Bridge. This script will run alongside the Allio server on the VPS.

### [New Service] `c:\Users\adminstrators1\Downloads\Allio-v1\_agent_workspaces\openclaw_workspace\workspace\openclaw-telegram-bot.js`
This file will use `node-telegram-bot-api` (or a similar module) to:
1. **DB Polling (Outbound):** Poll the `openclaw_messages` table for `status = 'pending'`, fetch the messages, and send them to the configured Telegram Chat ID using the Telegram Bot API. Then it will mark the messages as `sent` in the database.
2. **Webhook/Listener (Inbound):** Listen for incoming Telegram messages from the Trustee and immediately POST them to the Allio webhooks endpoint `http://localhost:5000/api/webhooks/openclaw` so the Allio agents receive them instantly.

### [Modify] [c:\Users\adminstrators1\Downloads\Allio-v1\ffpma-alliov1\.env](file:///c:/Users/adminstrators1/Downloads/Allio-v1/ffpma-alliov1/.env)
We will need to add the following environment variables.
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID` (The Trustee's Telegram Chat ID)

### Setup Instructions for VPS
I will provide the necessary instructions/scripts to:
1. Install the necessary dependency (`npm install node-telegram-bot-api --no-save` in the workspace).
2. Start the service (e.g., using `pm2` or as a background Node process).

## Verification Plan
### Manual Verification
1. I will provide a utility script (`test-telegram.js`) to test the Bot Token and Chat ID to ensure messages can successfully be delivered to the Trustee.
2. We will restart the Allio server and the new `openclaw-telegram-bot.js` service.
3. We will do a manual test by simulating an agent inserting a message into `openclaw_messages` and verifying it is received on Telegram.
4. The Trustee will reply on Telegram, and we will verify that the Allio Webhook receives it.

## User Review Required
> [!IMPORTANT]
> To proceed, you will need to create a Telegram Bot via BotFather on Telegram to obtain a `TELEGRAM_BOT_TOKEN`, and start a chat with the bot to get your `TELEGRAM_CHAT_ID`. Are you ready to proceed with this plan? If so, please provide the Bot Token and Chat ID securely, or I can write the code first and you can fill them in later.
