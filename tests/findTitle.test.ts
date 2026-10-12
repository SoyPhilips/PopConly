import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findTitle, searchTitles } from "../lib/findTitle";

describe("findTitle", () => {
  it("coincidencia difusa: dos puntos, guiones y mayúsculas", () => {
    const t = findTitle("daredevil born again");
    assert.ok(t, "debería resolver sin los dos puntos");
  });

  it("Toy Story 5 y Spider-Man están en el catálogo unificado", () => {
    assert.equal(findTitle("Toy Story 5")?.title, "Toy Story 5");
    assert.ok(findTitle("spider-man brand new day"));
  });

  it("searchTitles encuentra por género y es insensible a tildes", () => {
    const r = searchTitles("accion");
    assert.ok(r.length > 10);
  });

  it("título inexistente devuelve null", () => {
    assert.equal(findTitle("Esta Película No Existe XYZ"), null);
    assert.deepEqual(searchTitles(""), []);
  });
});
