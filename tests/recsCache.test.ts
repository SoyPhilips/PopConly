import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readRecsCache, sameRecs, todayDay } from "../lib/recsCache";

describe("recsCache", () => {
  it("todayDay es un entero estable hoy", () => {
    assert.ok(Number.isInteger(todayDay()) && todayDay() > 20000);
  });

  it("sameRecs compara por título y largo", () => {
    const a = [{ title: "X" }, { title: "Y" }];
    assert.equal(sameRecs(a as never[], a as never[]), true);
    assert.equal(sameRecs(a as never[], [{ title: "X" }] as never[]), false);
    assert.equal(sameRecs(a as never[], [{ title: "X" }, { title: "Z" }] as never[]), false);
  });

  it("sin window no hay caché (SSR seguro)", () => {
    assert.equal(readRecsCache(), null);
  });
});
