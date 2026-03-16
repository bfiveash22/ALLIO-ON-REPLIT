import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function testTelegramBot() {
  console.log('=== Telegram Bot Connectivity Test ===\n');

  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set.');
    process.exit(1);
  }
  console.log('✓ TELEGRAM_BOT_TOKEN is set');

  if (!CHAT_ID) {
    console.error('TELEGRAM_CHAT_ID is not set.');
    process.exit(1);
  }
  console.log('✓ TELEGRAM_CHAT_ID is set:', CHAT_ID);

  const bot = new TelegramBot(BOT_TOKEN, { polling: false });

  try {
    const me = await bot.getMe();
    console.log(`✓ Bot authenticated: @${me.username} (${me.first_name})`);
    console.log(`  Bot ID: ${me.id}`);
  } catch (err) {
    console.error('✗ Bot authentication failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const testMessage = `🧪 Allio Telegram Bot Test\n\nTimestamp: ${new Date().toISOString()}\nThis is a test message from the Allio agent network.`;

  try {
    const sent = await bot.sendMessage(CHAT_ID, testMessage);
    console.log(`✓ Test message sent successfully`);
    console.log(`  Message ID: ${sent.message_id}`);
    console.log(`  Chat ID: ${sent.chat.id}`);
    console.log(`  Date: ${new Date(sent.date * 1000).toISOString()}`);
  } catch (err: any) {
    if (err.response?.statusCode === 403) {
      console.error('✗ Bot cannot send to this chat. Make sure you have started a conversation with the bot first.');
    } else if (err.response?.statusCode === 400) {
      console.error('✗ Invalid chat ID. Check TELEGRAM_CHAT_ID.');
    } else {
      console.error('✗ Failed to send test message:', err.message || err);
    }
    process.exit(1);
  }

  console.log('\n=== All tests passed! ===');
  console.log('The Telegram bot is ready to relay OpenClaw messages.');
}

testTelegramBot().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
