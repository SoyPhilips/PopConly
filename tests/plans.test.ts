import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PLANS, formatCOP, getPlan } from "../lib/plans";

describe("plans", () => {
  it("formatCOP en formato colombiano", () => {
    assert.equal(formatCOP(19900), "$19.900");
    assert.equal(formatCOP(52900), "$52.900");
  });

  it("los 3 planes existen con COP positivo", () => {
    assert.equal(PLANS.length, 3);
    for (const p of PLANS) assert.ok(p.cop > 0);
  });

  it("getPlan cae a plus con id inválido", () => {
    assert.equal(getPlan("no-existe").id, "plus");
    assert.equal(getPlan(null).id, "plus");
    assert.equal(getPlan("ultra").id, "ultra");
  });
});
