import { test } from "node:test";
import assert from "node:assert/strict";
import { YT_ID_RE } from "../src/remark-youtube.mjs";

test("extrae el ID de YouTube de los formatos soportados", () => {
  assert.equal("https://www.youtube.com/watch?v=XDbG9U_apw8".match(YT_ID_RE)?.[1], "XDbG9U_apw8");
  assert.equal("https://www.youtube.com/live/k2FqQvgcDnE?si=abc&t=709".match(YT_ID_RE)?.[1], "k2FqQvgcDnE");
  assert.equal("https://youtu.be/aEm-knp-cL8".match(YT_ID_RE)?.[1], "aEm-knp-cL8");
  assert.equal("https://www.youtube.com/watch?v=_BXLaiX-tV0&list=RD_BXLaiX-tV0".match(YT_ID_RE)?.[1], "_BXLaiX-tV0");
  assert.equal("texto sin video".match(YT_ID_RE), null);
});
