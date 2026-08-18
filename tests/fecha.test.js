import { test } from "node:test";
import assert from "node:assert/strict";
import { formatFecha } from "../src/lib/shared.js";

test("formatFecha no se corre un día por la zona horaria", () => {
  assert.equal(formatFecha("2026-08-16"), "16 de agosto de 2026");
  assert.equal(formatFecha("2026-08-01"), "1 de agosto de 2026");
  assert.equal(formatFecha("2026-12-31"), "31 de diciembre de 2026");
});
