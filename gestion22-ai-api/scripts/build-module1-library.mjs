import {readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createCanvas} from '@napi-rs/canvas';
import {createWorker} from 'tesseract.js';
import spanish from '@tesseract.js-data/spa';

const directory = new URL('../../public/local/gestion22tutor/pdf/', import.meta.url);
const output = new URL('../data/module1-library.json', import.meta.url);
const imagesOnly = process.argv.includes('--images-only');
const documents = imagesOnly ? JSON.parse(readFileSync(output, 'utf8')).documents.filter(d => d.file.endsWith('.pdf')) : [];
const worker = await createWorker('spa', 1, {langPath: spanish.langPath, gzip: true, cacheMethod: 'none'});
for (const file of readdirSync(directory).filter(name => !imagesOnly && name.endsWith('.pdf')).sort()) {
  const bytes = readFileSync(new URL(encodeURIComponent(file), directory));
  const loading = getDocument({data: new Uint8Array(bytes), useSystemFonts: true});
  const pdf = await loading.promise;
  const pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    let text = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('')
      .replace(/[ \t]+/g, ' ').trim();
    if (text.length < 200) {
      const viewport = page.getViewport({scale: 2});
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({canvasContext: canvas.getContext('2d'), viewport, canvas}).promise;
      const result = await worker.recognize(canvas.toBuffer('image/png'));
      if (result.data.text.trim().length > text.length) text = result.data.text.trim();
    }
    if (text) pages.push({page: number, text});
  }
  documents.push({title: file.replace(/\.pdf$/i, ''), file, sha256: createHash('sha256').update(bytes).digest('hex'),
    totalPages: pdf.numPages, pages});
  console.log(`${file}: ${pages.length}/${pdf.numPages} pages with text`);
  await loading.destroy();
}
const images = new URL('../../public/local/gestion22tutor/images/', import.meta.url);
for (const file of ['anatomia-piel.png', 'Checklist de evaluación de la piel.png',
  'Prevención desde el ingreso del paciente.png', 'Tabla Resumen_ Factores que afectan la integridad Cutánea.png']) {
  const bytes = readFileSync(new URL(encodeURIComponent(file), images));
  const result = await worker.recognize(bytes);
  documents.push({title: file.replace(/\.png$/, '').replace('anatomia-piel', 'Anatomía de la piel'), file,
    sha256: createHash('sha256').update(bytes).digest('hex'), totalPages: 1,
    pages: result.data.text.trim() ? [{page: 1, text: result.data.text.trim()}] : []});
  console.log(`${file}: OCR complete`);
}
await worker.terminate();
writeFileSync(output, JSON.stringify({schemaVersion: 1,
  contextId: 'gestion22-heridas-avanzadas', documents}, null, 2) + '\n');
