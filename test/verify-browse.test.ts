import { describe, expect, test } from "bun:test";

import { doctorHasNoFailures } from "../src/scripts/verify-browse.js";

describe("verify browse", () => {
  test("accepts doctor output with warnings but no failures", () => {
    expect(
      doctorHasNoFailures("Summary: 7 pass, 1 warn, 0 fail"),
    ).toBeTrue();
  });

  test("rejects doctor output with failures", () => {
    expect(
      doctorHasNoFailures("Summary: 6 pass, 0 warn, 1 fail"),
    ).toBeFalse();
  });

  test("rejects output without summary", () => {
    expect(doctorHasNoFailures("agent-browser doctor")).toBeFalse();
  });
});
