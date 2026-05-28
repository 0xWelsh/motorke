import {
  buildFacebookSharerUrl,
  isMobileShareEnvironment,
  copyTextToClipboardSync,
  shareToFacebookWithCaption,
} from "@/lib/share-helpers";

describe("share-helpers", () => {
  it("builds facebook sharer url", () => {
    const out = buildFacebookSharerUrl("https://welshmotorhub.co.ke/cars/abc");
    expect(out).toContain("facebook.com/sharer/sharer.php");
    expect(out).toContain(encodeURIComponent("https://welshmotorhub.co.ke/cars/abc"));
  });

  it("detects mobile user agents", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
    jest.spyOn(global.navigator, "userAgent", "get").mockReturnValue(ua);
    expect(isMobileShareEnvironment()).toBe(true);
    jest.restoreAllMocks();
  });

  it("sync copy uses execCommand when available", () => {
    document.execCommand = jest.fn(() => true);
    const ok = copyTextToClipboardSync("Test caption\nLine 2");
    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("mobile share copies text before opening facebook", async () => {
    jest.spyOn(global.navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    );
    document.execCommand = jest.fn(() => true);

    const result = await shareToFacebookWithCaption("https://example.com/cars/1", "Caption text");
    expect(result.mobile).toBe(true);
    expect(result.textCopied).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    jest.restoreAllMocks();
  });
});
