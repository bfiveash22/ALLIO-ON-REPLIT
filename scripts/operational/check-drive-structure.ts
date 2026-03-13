import { getAllioStructure } from '../../artifacts/api-server/src/services/drive';

async function main() {
    console.log('Fetching Drive structure...');
    try {
        const structure = await getAllioStructure();
        console.log(JSON.stringify(structure, null, 2));
    } catch (error) {
        console.error('Failed:', error);
    }
    process.exit(0);
}

main();
