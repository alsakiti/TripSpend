import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const config = JSON.parse(await readFile("capacitor.config.json", "utf8"));
const release = JSON.parse(await readFile("version.json", "utf8"));

assert.equal(config.appId, "com.tripspend.app");
assert.equal(config.appName, "TripSpend");
assert.equal(config.webDir, "dist");
assert.equal(pkg.version, release.version);

for (const path of [
  "dist/index.html",
  "dist/enhancements-v710.js",
  "dist/ai-intelligence-v720.js",
  "dist/receipt-ai-v700.js",
  "dist/icons/icon-512.png"
]) {
  await access(path);
}

const icon = await readFile("icons/icon-512.png");
assert.equal(icon.toString("hex", 0, 8), "89504e470d0a1a0a", "icon must be a PNG");
assert.equal(icon.readUInt32BE(16), 512, "source icon width must be 512px");
assert.equal(icon.readUInt32BE(20), 512, "source icon height must be 512px");
assert.equal(icon[25], 2, "iOS icon must be RGB without alpha");

console.log("TripSpend iOS package contract passed");
