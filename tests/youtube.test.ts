import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isoDurationToSecs } from "../lib/youtube";

describe("youtube isoDurationToSecs", () => {
  it("convierte duraciones ISO 8601 a segundos", () => {
    assert.equal(isoDurationToSecs("PT2M5S"), 125);
    assert.equal(isoDurationToSecs("PT1H3M10S"), 3790);
    assert.equal(isoDurationToSecs("PT31S"), 31);
  });

  it("responde 0 ante valores raros", () => {
    assert.equal(isoDurationToSecs(""), 0);
    assert.equal(isoDurationToSecs("P1D"), 0);
  });
});
