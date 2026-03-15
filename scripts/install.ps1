# DragonClaw — Windows Installer
# Run: irm https://dragonclaw.asia/install.ps1 | iex

$ErrorActionPreference = "Stop"
$REPO = "https://github.com/draguris/dragonclaw.git"
$INSTALL_DIR = "$env:USERPROFILE\.dragonclaw\app"

Write-Host ""
Write-Host "  DragonClaw — Windows Installer"
Write-Host "  ──────────────────────────────────"
Write-Host ""

# ── 1. Check git ──
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: git is not installed."
    Write-Host "  Download from: https://git-scm.com/download/win"
    Write-Host "  Or run: winget install Git.Git"
    exit 1
}

# ── 2. Check Node.js ──
$needNode = $false
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $needNode = $true
} else {
    $ver = (node -v) -replace 'v','' -split '\.'
    if ([int]$ver[0] -lt 20) { $needNode = $true }
}

if ($needNode) {
    Write-Host "  [1/4] Installing Node.js 22..."
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } else {
        Write-Host "  ERROR: Cannot auto-install Node.js."
        Write-Host "  Download from: https://nodejs.org"
        exit 1
    }
} else {
    Write-Host "  [1/4] Node.js $(node -v) found"
}

# ── 3. Clone (always fresh) ──
if (Test-Path $INSTALL_DIR) {
    Write-Host "  [2/4] Updating DragonClaw..."
    Remove-Item -Recurse -Force $INSTALL_DIR
} else {
    Write-Host "  [2/4] Downloading DragonClaw..."
}
$parentDir = Split-Path $INSTALL_DIR -Parent
if (-not (Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
git clone --depth 1 $REPO $INSTALL_DIR 2>$null

# ── 4. Install dependencies ──
Write-Host "  [3/4] Installing dependencies..."
Set-Location $INSTALL_DIR
npm install --production --silent 2>$null

# ── 5. Create batch wrapper ──
Write-Host "  [4/4] Setting up command..."
$binDir = "$env:USERPROFILE\.dragonclaw\bin"
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }

$batchContent = "@echo off`nnode `"$INSTALL_DIR\src\cli.js`" %*"
Set-Content -Path "$binDir\dragonclaw.cmd" -Value $batchContent

# Add to PATH if not there
$userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {
    [System.Environment]::SetEnvironmentVariable("PATH", "$binDir;$userPath", "User")
    $env:PATH = "$binDir;$env:PATH"
    Write-Host "  Added to PATH: $binDir"
    Write-Host "  Restart your terminal for the PATH change to take effect."
}

Write-Host ""
Write-Host "  DragonClaw installed!"
Write-Host ""
Write-Host "  Next:"
Write-Host "    dragonclaw onboard    # setup wizard (pick your LLM, add keys)"
Write-Host "    dragonclaw start      # start the agent"
Write-Host "    dragonclaw chat       # chat in terminal"
Write-Host ""
Write-Host "  Docs: https://docs.dragonclaw.asia"
Write-Host "  GitHub: https://github.com/draguris/dragonclaw"
Write-Host ""
