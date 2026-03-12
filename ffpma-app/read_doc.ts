import fs from 'fs';
import pdfParse from 'pdf-parse';

async function read() {
    try {
        const buf = fs.readFileSync('C:\\Users\\adminstrators1\\Downloads\\HANDOFF_SUMMARY.pdf');
        const data = await pdfParse(buf);
        console.log(data.text);
    } catch (e) {
        console.error("Error reading PDF:", e);
    }
}
read();
