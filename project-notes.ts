import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type WikiPage = {
  name: string;
  path: string;
  type: string;
  preview: string;
};

function parseFrontmatter(body: string): { meta: Record<string, string>; rest: string } {
  if (!body.startsWith("---")) return { meta: {}, rest: body };
  const end = body.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, rest: body };
  const block = body.slice(3, end);
  const rest = body.slice(end + 4);
  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, rest };
}

export function listWikiPages(vaultPath: string): WikiPage[] {
  const dir = join(vaultPath, "wiki");
  if (!existsSync(dir)) return [];
  const out: WikiPage[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const full = join(dir, entry.name);
    try {
      const body = readFileSync(full, "utf-8");
      const { meta, rest } = parseFrontmatter(body);
      out.push({
        name: entry.name,
        path: full,
        type: meta.type ?? "—",
        preview: rest.replace(/^#.*$/m, "").trim().slice(0, 200),
      });
    } catch {
      // skip
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}
