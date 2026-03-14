$ErrorActionPreference = "Stop"
$testStateDir = ".wrangler\state\test\v3\kv\EZ_CONTENT\blobs"

# 1. Clean up existing test state for true non-persistence
if (Test-Path -Path $testStateDir) {
    Write-Host "Cleaning up previous test state sector..."
    Remove-Item -Path $testStateDir -Recurse -Force
}

# 2. Start Wrangler in local, non-interactive mode with ephemeral state
# --ip 127.0.0.1 and --host 127.0.0.1 ensure stable local discovery for Playwright
Write-Host "Establishing ephemeral testing environment on port 8788..."
npx wrangler dev --port 8788 --persist-to=".wrangler/state/test" --show-interactive-dev-session=false --ip 127.0.0.1 --host 127.0.0.1
