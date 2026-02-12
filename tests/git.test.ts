import { expect, test, describe } from "bun:test";
import { parseConventionalCommit } from "../src/git";

describe("git utilities", () => {
  describe("parseConventionalCommit", () => {
    test("should parse simple feat", () => {
      const result = parseConventionalCommit("feat: add something");
      expect(result.type).toBe("feat");
      expect(result.description).toBe("add something");
      expect(result.scope).toBeUndefined();
    });

    test("should parse feat with scope", () => {
      const result = parseConventionalCommit("feat(api): add something");
      expect(result.type).toBe("feat");
      expect(result.description).toBe("add something");
      expect(result.scope).toBe("api");
    });

    test("should parse fix", () => {
      const result = parseConventionalCommit("fix: bug");
      expect(result.type).toBe("fix");
    });

    test("should handle unknown types as other", () => {
      const result = parseConventionalCommit("unknown: something");
      expect(result.type).toBe("other");
    });

    test("should handle non-conventional commits as other", () => {
      const result = parseConventionalCommit("just a commit message");
      expect(result.type).toBe("other");
      expect(result.description).toBe("just a commit message");
    });
  });
});
