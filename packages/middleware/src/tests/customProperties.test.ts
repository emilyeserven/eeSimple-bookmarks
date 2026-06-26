import assert from "node:assert/strict";
import { test } from "node:test";
import { sumOperands } from "@/services/bookmarkWrites";
import { buildInsertValues, buildUpdatePatch } from "@/services/customProperties";

test("sumOperands adds the operand values, treating a missing value as 0", () => {
  const values = new Map([
    ["a", 8],
    ["b", 3],
  ]);
  assert.equal(sumOperands(values, ["a", "b"]), 11);
  assert.equal(sumOperands(values, ["a", "missing"]), 8);
  assert.equal(sumOperands(values, []), 0);
});

// buildUpdatePatch is a pure mapper: every field the client sends is copied to the column patch,
// fields it omits are left out (so the UPDATE never clears them), and the slug rides along only on
// a rename. These tests pin that contract before the branch-per-field body is data-driven.

test("buildUpdatePatch omits fields the input does not set", () => {
  const patch = buildUpdatePatch({}, undefined);
  assert.deepEqual(patch, {});
});

test("buildUpdatePatch copies every provided field, preserving explicit null", () => {
  const patch = buildUpdatePatch(
    {
      name: "Priority",
      numberMin: 0,
      numberMax: 10,
      description: null,
      unitSingular: "point",
      showInForm: true,
      hiddenFromForm: false,
      showInListings: true,
      showInGallery: false,
      showInDetails: false,
      allCategories: false,
      enabled: true,
      allowDefault: false,
      propertyGroupId: null,
      numberFormat: "duration",
      booleanLabelPreset: "custom",
      booleanTrueLabel: "Read",
      booleanFalseLabel: null,
    },
    undefined,
  );
  assert.deepEqual(patch, {
    name: "Priority",
    numberMin: 0,
    numberMax: 10,
    description: null,
    unitSingular: "point",
    showInForm: true,
    hiddenFromForm: false,
    showInListings: true,
    showInGallery: false,
    showInDetails: false,
    allCategories: false,
    enabled: true,
    allowDefault: false,
    propertyGroupId: null,
    numberFormat: "duration",
    booleanLabelPreset: "custom",
    booleanTrueLabel: "Read",
    booleanFalseLabel: null,
  });
});

test("buildUpdatePatch writes the slug only when a rename produced one", () => {
  assert.equal(buildUpdatePatch({
    name: "New",
  }, undefined).slug, undefined);
  assert.equal(buildUpdatePatch({
    name: "New",
  }, "new").slug, "new");
});

test("buildUpdatePatch never includes relation fields (handled separately)", () => {
  const patch = buildUpdatePatch(
    {
      name: "X",
      categoryIds: ["a"],
      mediaTypeIds: ["b"],
      operandPropertyIds: ["c", "d"],
    },
    undefined,
  );
  assert.deepEqual(Object.keys(patch), ["name"]);
});

// buildInsertValues assembles the create-time insert row. It reuses buildUpdatePatch for the plain
// mirror columns (so unprovided ones are omitted and fall back to the Drizzle column default) and
// adds the required identity columns plus the type-gated columns. These tests pin that contract.

test("buildInsertValues always sets the identity columns and omits unprovided plain columns", () => {
  const values = buildInsertValues({
    name: "Priority",
    type: "number",
  }, "priority");
  assert.equal(values.name, "Priority");
  assert.equal(values.slug, "priority");
  assert.equal(values.type, "number");
  // Unprovided plain columns are absent so the DB default applies (not forced into the row).
  assert.equal("showInListings" in values, false);
  assert.equal("enabled" in values, false);
  assert.equal("description" in values, false);
});

test("buildInsertValues copies provided plain columns, preserving explicit null", () => {
  const values = buildInsertValues(
    {
      name: "Priority",
      type: "number",
      numberMin: 0,
      numberMax: 10,
      description: null,
      showInListings: false,
      enabled: false,
      numberFormat: "duration",
    },
    "priority",
  );
  assert.equal(values.numberMin, 0);
  assert.equal(values.numberMax, 10);
  assert.equal(values.description, null);
  assert.equal(values.showInListings, false);
  assert.equal(values.enabled, false);
  assert.equal(values.numberFormat, "duration");
});

test("buildInsertValues gates dateTimeFormat on the datetime type", () => {
  // Non-datetime types always store null, even if a format slips through the input.
  assert.equal(
    buildInsertValues({
      name: "Made",
      type: "number",
      dateTimeFormat: "time",
    }, "made").dateTimeFormat,
    null,
  );
  // datetime types default to "date" when no format is provided, else copy the provided format.
  assert.equal(
    buildInsertValues({
      name: "Made",
      type: "datetime",
    }, "made").dateTimeFormat,
    "date",
  );
  assert.equal(
    buildInsertValues({
      name: "Made",
      type: "datetime",
      dateTimeFormat: "time",
    }, "made").dateTimeFormat,
    "time",
  );
});

test("buildInsertValues gates the rating columns on the ratingScale type", () => {
  // Non-rating types force every rating column to null.
  const nonRating = buildInsertValues({
    name: "Score",
    type: "number",
    ratingMax: 5,
    ratingAllowZero: true,
  }, "score");
  assert.equal(nonRating.ratingMax, null);
  assert.equal(nonRating.ratingAllowZero, null);
  assert.equal(nonRating.ratingAllowHalf, null);
  assert.equal(nonRating.ratingShowLabel, null);
  assert.equal(nonRating.ratingLabel, null);
  // Rating types normalize ratingMax and copy the rest.
  const rating = buildInsertValues({
    name: "Score",
    type: "ratingScale",
    ratingMax: 3,
    ratingAllowZero: true,
    ratingLabel: "stars",
  }, "score");
  assert.equal(rating.ratingMax, 3);
  assert.equal(rating.ratingAllowZero, true);
  assert.equal(rating.ratingLabel, "stars");
  // A rating type with no ratingMax normalizes to the default of 5.
  assert.equal(buildInsertValues({
    name: "Score",
    type: "ratingScale",
  }, "score").ratingMax, 5);
});
