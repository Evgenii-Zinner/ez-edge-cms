import pkg from "../package.json";
import { $ } from "bun";

const type = Bun.argv[2] || "patch";
const customMessage = Bun.argv[3] || "Maintenance release";
const [major, minor, patch] = pkg.version.split(".").map(Number);

let newVersion = "";
if (type === "major") newVersion = `${major + 1}.0.0`;
else if (type === "minor") newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

console.log(`🚀 Bumping version: ${pkg.version} -> ${newVersion}`);
console.log(`📝 Message: ${customMessage}`);

// 1. Update package.json
const newPkg = { ...pkg, version: newVersion };
await Bun.write("package.json", JSON.stringify(newPkg, null, 2) + "\n");

// 2. Append to CHANGELOG.md
const date = new Date().toISOString().split("T")[0];
const entry = `\n## [${newVersion}] - ${date}\n- ${customMessage}\n`;
const changelogFile = Bun.file("CHANGELOG.md");
const existing = (await changelogFile.exists())
  ? await changelogFile.text()
  : "# Changelog\n";
await Bun.write("CHANGELOG.md", existing + entry);

// 3. Prettify
console.log("🧹 Running Prettier...");
await $`bunx prettier --write .`;

// 4. Git operations
console.log("📦 Committing and tagging...");
const commitMsg = `chore(release): ${newVersion} - ${customMessage}`;
await $`git add .`;
await $`git commit -m ${commitMsg}`;
await $`git tag -a v${newVersion} -m "Release v${newVersion}"`;

console.log(`✅ Released v${newVersion}`);
