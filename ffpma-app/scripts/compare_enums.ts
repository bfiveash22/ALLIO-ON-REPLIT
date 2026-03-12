import * as fs from 'fs';

try {
    const schemaText = fs.readFileSync('shared/schema.ts', 'utf8');
    const dbEnums = JSON.parse(fs.readFileSync('enums_clean.json', 'utf8'));

    const regex = /pgEnum\(\s*['"]([^'"]+)['"]\s*,\s*\[(.*?)\]\s*\)/g;
    let match;
    while ((match = regex.exec(schemaText)) !== null) {
        const enumName = match[1];
        const valuesStr = match[2];
        const codeValues = valuesStr.match(/['"]([^'"]+)['"]/g)?.map(v => v.replace(/['"]/g, '')) || [];

        const dbValues = dbEnums[enumName];
        if (!dbValues) {
            console.log('Missing enum entirely in DB:', enumName);
            continue;
        }
        const missingInDb = codeValues.filter((v: string) => !dbValues.includes(v));
        const extraInDb = dbValues.filter((v: string) => !codeValues.includes(v));
        if (missingInDb.length > 0 || extraInDb.length > 0) {
            console.log('Mismatch for enum:', enumName);
            console.log(' - Needs to be added to DB:', missingInDb);
            console.log(' - In DB but not in code:', extraInDb);
        }
    }
} catch (e) {
    console.error(e);
}
