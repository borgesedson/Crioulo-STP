import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

// Debug: what is exported?
console.log('Type:', typeof pdfModule);
console.log('Keys:', Object.keys(pdfModule));
console.log('Is function?', typeof pdfModule === 'function');
if (typeof pdfModule !== 'function') {
  for (const [k, v] of Object.entries(pdfModule)) {
    console.log(`  ${k}: ${typeof v}`);
  }
}

// Try to find the actual parse function
const pdf = typeof pdfModule === 'function' ? pdfModule 
  : typeof pdfModule.default === 'function' ? pdfModule.default
  : typeof pdfModule.parse === 'function' ? pdfModule.parse
  : null;

if (!pdf) {
  console.log('\n❌ Não encontrei função de parse. Tentando abordagem alternativa...');
  
  // Direct file require
  try {
    const pdfDirect = require('pdf-parse/lib/pdf-parse.js');
    console.log('Direct type:', typeof pdfDirect);
  } catch(e) {
    console.log('Direct failed:', e.message);
  }
} else {
  console.log('\n✅ Parse function found! Running...');
  const buffer = fs.readFileSync('C:/Users/Cunae/Downloads/Forro.pdf');
  const data = await pdf(buffer);
  console.log(`Pages: ${data.numpages}`);
  console.log(data.text.substring(0, 2000));
}
