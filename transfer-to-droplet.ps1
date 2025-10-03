# PowerShell script to transfer CrowdEval files to DigitalOcean droplet
# Usage: .\transfer-to-droplet.ps1 -DropletIP "142.93.221.12"

param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "root"
)

Write-Host "Packaging CrowdEval files to droplet at $DropletIP..." -ForegroundColor Green

# Define the source directory (current directory)
$SourceDir = Get-Location
Write-Host "Source directory: $SourceDir" -ForegroundColor Cyan

# Create a temporary archive of the project files
$TempArchive = "$env:TEMP\CrowdEval-deployment.zip"
Write-Host "Creating archive at $TempArchive..." -ForegroundColor Cyan

# Get all files except node_modules, .git, and other unnecessary files
$ExcludeDirs = @("node_modules", ".git", "dist", ".next")
$FilesToArchive = Get-ChildItem -Path $SourceDir -Recurse -File | Where-Object {
    $Path = $_.FullName
    $Exclude = $false
    foreach ($ExcludeDir in $ExcludeDirs) {
        if ($Path -like "*\$ExcludeDir\*") {
            $Exclude = $true
            break
        }
    }
    # Also exclude common unnecessary files
    $ExcludeFileTypes = @("*.log", "*.tmp", "*.bak")
    foreach ($ExcludeType in $ExcludeFileTypes) {
        if ($Path -like $ExcludeType) {
            $Exclude = $true
            break
        }
    }
    return -not $Exclude
}

# Create the archive
Compress-Archive -Path $FilesToArchive.FullName -DestinationPath $TempArchive -Force
Write-Host "Archive created successfully!" -ForegroundColor Green

# Transfer the archive to the droplet
$DestinationPath = "/tmp/CrowdEval-deployment.zip"
Write-Host "Transferring archive to droplet..." -ForegroundColor Cyan
scp $TempArchive "$Username@$DropletIP`:$DestinationPath"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Archive transferred successfully!" -ForegroundColor Green
    
    # Extract and set up on the droplet
    Write-Host "Extracting and setting up on droplet..." -ForegroundColor Cyan
    ssh $Username@$DropletIP @"
        sudo mkdir -p /opt/crowdeval
        sudo unzip $DestinationPath -d /opt/crowdeval
        sudo chown -R root:root /opt/crowdeval
        sudo chmod +x /opt/crowdeval/deploy.sh
        rm $DestinationPath
"@
    
    Write-Host "Files transferred and extracted successfully!" -ForegroundColor Green
    Write-Host "You can now SSH into your droplet and run the deployment script:" -ForegroundColor Yellow
    Write-Host "   ssh $Username@$DropletIP" -ForegroundColor White
    Write-Host "   cd /opt/crowdeval" -ForegroundColor White
    Write-Host "   ./deploy.sh" -ForegroundColor White
} else {
    Write-Host "Failed to transfer archive to droplet" -ForegroundColor Red
}

# Clean up the temporary archive
Remove-Item $TempArchive -Force
Write-Host "Cleaned up temporary archive" -ForegroundColor Cyan