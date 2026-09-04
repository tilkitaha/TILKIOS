import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("defines the Turkish TILKI OS workspace shell", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const [layout, dashboard] = await Promise.all([
    readFile(`${root}/app/layout.tsx`, "utf8"),
    readFile(`${root}/app/tilki-dashboard.tsx`, "utf8"),
  ]);
  assert.match(layout, /<html lang="tr">/);
  assert.match(layout, /TILKI OS — AI İşletme Yönetimi/);
  assert.match(dashboard, /Kontrol merkezi/);
  assert.match(dashboard, /AI BUSINESS SYSTEM/);
});
