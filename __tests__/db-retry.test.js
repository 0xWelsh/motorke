import { isTransientDbError, withDbRetry } from "@/lib/db-retry";

describe("isTransientDbError", () => {
  it("detects Prisma P1001", () => {
    expect(isTransientDbError({ code: "P1001", message: "Can't reach database server" })).toBe(true);
  });

  it("detects message-only connection errors", () => {
    expect(isTransientDbError({ message: "Can't reach database server at host:6543" })).toBe(true);
  });

  it("ignores validation errors", () => {
    expect(isTransientDbError({ code: "P2002", message: "Unique constraint" })).toBe(false);
  });
});

describe("withDbRetry", () => {
  it("retries transient failures then succeeds", async () => {
    let calls = 0;
    const result = await withDbRetry(
      async () => {
        calls += 1;
        if (calls < 2) throw { code: "P1001", message: "Can't reach database" };
        return "ok";
      },
      { retries: 2, baseDelayMs: 1 }
    );
    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  it("does not retry non-transient errors", async () => {
    let calls = 0;
    await expect(
      withDbRetry(async () => {
        calls += 1;
        throw { code: "P2002", message: "Unique constraint" };
      })
    ).rejects.toMatchObject({ code: "P2002" });
    expect(calls).toBe(1);
  });
});
