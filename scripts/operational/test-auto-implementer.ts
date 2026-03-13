import { autoImplementer } from '../../artifacts/api-server/src/services/auto-implementer';

async function main() {
    console.log('Testing Auto-Implementer Pipeline...');
    try {
        await autoImplementer.runRetroactiveProcessing();
        console.log('Auto-Implementer Pipeline finished successfully.');
    } catch (error) {
        console.error('Test Failed:', error);
    }
    process.exit(0);
}

main();
