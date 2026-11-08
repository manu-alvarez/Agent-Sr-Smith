import { describe, expect, it } from "vitest";
import { decide, DEFAULT_POLICY } from "../../src/governance/policies/index.ts";
import { requestNavigation } from "../../src/tools/browser/index.ts";

describe("security policy", () => {
  it("denies external delete and strict-local browsing", () => {
    expect(decide(DEFAULT_POLICY, "external-delete", "local-runtime").effect).toBe("deny");
    expect(requestNavigation("https://example.test", "strict-local").allowed).toBe(false);
  });
});
