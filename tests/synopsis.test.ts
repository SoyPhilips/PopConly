import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isGenericSynopsis, synopsisFor } from "../lib/synopsis";

describe("synopsis", () => {
  it("es determinista por título", () => {
    const a = synopsisFor("Fallout", "Acción", "2024", "Serie");
    const b = synopsisFor("Fallout", "Acción", "2024", "Serie");
    assert.equal(a, b);
    assert.ok(a.includes("Fallout"));
    assert.ok(a.includes("2024"));
  });

  it("varía entre títulos distintos", () => {
    const set = new Set(
      ["Fallout", "Gladiator II", "Ballerina", "F1", "Countdown"].map((t) =>
        synopsisFor(t, "Acción", "2024", "Película")
      )
    );
    assert.ok(set.size > 1);
  });

  it("detecta textos genéricos repetidos", () => {
    assert.equal(isGenericSynopsis("Adrenalina pura: misiones imposibles"), true);
    assert.equal(isGenericSynopsis("Una historia original y cuidada."), false);
    assert.equal(isGenericSynopsis(undefined), true);
  });
});
