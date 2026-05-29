# Run this from: c:\Users\USER\FluxPay
# Installs Foundry (forge) for Windows by downloading the official GitHub release binary

Write-Host "`n=== Installing Foundry for Windows ===" -ForegroundColor Cyan

$installDir = "$env:USERPROFILE\.foundry\bin"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Write-Host "Fetching latest Foundry release..."

try {
    $releases = Invoke-RestMethod "https://api.github.com/repos/foundry-rs/foundry/releases"
    $latest   = $releases | Where-Object { -not $_.prerelease } | Select-Object -First 1
    if (-not $latest) { $latest = $releases[0] }

    $asset = $latest.assets | Where-Object { $_.name -like "*win32_amd64*" }
    if (-not $asset) {
        Write-Host "Could not find Windows asset in release. Trying nightly..." -ForegroundColor Yellow
        $nightly = Invoke-RestMethod "https://api.github.com/repos/foundry-rs/foundry/releases/tags/nightly"
        $asset   = $nightly.assets | Where-Object { $_.name -like "*win32_amd64*" }
    }

    if (-not $asset) {
        throw "No Windows binary found in releases."
    }

    Write-Host "Downloading $($asset.name)..."
    $zipPath = "$env:TEMP\foundry-windows.zip"
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing

    Write-Host "Extracting to $installDir..."
    Expand-Archive -Path $zipPath -DestinationPath $installDir -Force

    # Add to user PATH permanently
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($userPath -notlike "*\.foundry\bin*") {
        [Environment]::SetEnvironmentVariable("PATH", "$userPath;$installDir", "User")
        Write-Host "Added $installDir to your PATH." -ForegroundColor Green
    }

    # Add to current session PATH so forge works right now
    $env:PATH += ";$installDir"

    Write-Host "`nFoundry installed!" -ForegroundColor Green
    forge --version

} catch {
    Write-Host "`nAuto-install failed: $_" -ForegroundColor Red
    Write-Host @"

Manual install:
  1. Go to: https://github.com/foundry-rs/foundry/releases
  2. Download the file ending in win32_amd64.zip
  3. Extract forge.exe, cast.exe, anvil.exe to: $installDir
  4. Add $installDir to your system PATH
  5. Restart PowerShell and run: forge --version
"@ -ForegroundColor Yellow
}
