import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slugify, norm } from "../lib/slugs";

describe("slugs", () => {
  it("slugify: minúsculas, sin tildes ni signos", () => {
    assert.equal(slugify("Spider-Man: Brand New Day"), "spider-man-brand-new-day");
    assert.equal(slugify("3 Body Problem"), "3-body-problem");
    assert.equal(slugify("  Acción!! "), "accion");
  });

  it("norm: compara sin importar acentos", () => {
    assert.equal(norm("Acción"), norm("accion"));
    assert.equal(norm("Ciencia Ficción"), norm("ciencia ficcion"));
  });
});
