// Browser hints describe the device running Studio; they can be absent.
export function detectPlatform(nav) {
  const hint = nav?.userAgentData?.platform;
  const reported = hint || nav?.platform || "";
  const ua = hint ? "" : nav?.userAgent || "";
  if (/mac|ios|ipad|iphone|ipod/i.test(reported) || /Macintosh|iPad|iPhone|iPod/.test(nav?.userAgent || ""))
    return { label: "Apple", legends: "mac", mode: "mac" };
  if (/^win/i.test(reported) || /Windows NT/.test(ua))
    return { label: "Windows", legends: "windows", mode: "standard" };
  if (/android/i.test(reported) || /Android/.test(ua))
    return { label: "Android", legends: "standard", mode: "standard" };
  if (/chrome os|chromium os|cros/i.test(reported) || /CrOS/.test(ua))
    return { label: "ChromeOS", legends: "standard", mode: "standard" };
  if (/linux/i.test(reported) || /Linux/.test(ua))
    return { label: "Linux", legends: "linux", mode: "standard" };
  return null;
}
export function legendPlatform(hostMode, client, detected) {
  const browser = detected?.legends ?? "standard";
  if (!hostMode || hostMode === "default") {
    if (!client?.hostModeSupported) return browser;
    hostMode = client.defaultMac ? "mac" : "standard";
  }
  if (hostMode === "mac") return "mac";
  return browser === "mac" ? "standard" : browser;
}
