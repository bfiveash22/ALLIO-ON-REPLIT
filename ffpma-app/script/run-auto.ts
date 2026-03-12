import { autoImplementer } from '../server/services/auto-implementer';

async function run() {
    console.log('Starting Auto-Implementor Pipeline...');
    await autoImplementer.runRetroactiveProcessing();
    console.log('Done!');
    process.exit(0);
}

run().catch(console.error);
