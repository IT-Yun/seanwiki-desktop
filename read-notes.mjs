import { fileURLToPath } from 'node:url';
import { listWikiPages } from './project-notes.ts';

const sample = fileURLToPath(new URL('./sample-project/', import.meta.url));
for (const page of listWikiPages(sample)) {
  console.log(page.name, page.type);
  console.log(page.preview);
}
