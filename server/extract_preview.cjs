const fs = require('fs');
const path = require('path');

async function extractPDF(filePath, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📄 ${label}`);
  console.log('='.repeat(60));

  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;

  console.log(`Páginas: ${doc.numPages}`);

  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ');
    fullText += text + '\n';
  }

  console.log(`Chars: ${fullText.length}`);
  console.log('\n--- PRIMEIROS 3000 CHARS ---\n');
  console.log(fullText.substring(0, 3000));
  console.log('\n--- ÚLTIMOS 1500 CHARS ---\n');
  console.log(fullText.substring(fullText.length - 1500));

  // Save raw text for analysis
  const outFile = path.join(__dirname, `${label.replace(/'/g, '')}_raw.txt`);
  fs.writeFileSync(outFile, fullText, 'utf8');
  console.log(`\n💾 Texto salvo em: ${outFile}`);
}

async function main() {
  await extractPDF('C:/Users/Cunae/Downloads/Forro.pdf', 'FORRO');
  await extractPDF("C:/Users/Cunae/Downloads/Lungui'ie.pdf", "LUNGIE");
}

main().catch(console.error);
