# Simple PowerShell script to transfer CrowdEval files to DigitalOcean droplet
# Usage: .\simple-transfer.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP = "143.110.246.108",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "root"
)

Write-Host "Packaging CrowdEval files to droplet at $DropletIP..." -ForegroundColor Green

# Define paths
$SourceDir = "d:\CrowdEval-main\CrowdEval-main"
$TempArchive = "d:\CrowdEval-main\crowdeval-deployment.zip"
$DestinationPath = "/tmp/crowdeval-deployment.zip"

Write-Host "Source directory: $SourceDir" -ForegroundColor Cyan
Write-Host "Creating archive at $TempArchive..." -ForegroundColor Cyan

# Remove existing archive if it exists
if (Test-Path $TempArchive) {
    Remove-Item $TempArchive -Force
    Write-Host "Removed existing archive" -ForegroundColor Yellow
}

# Create a simple archive of the entire directory
Compress-Archive -Path "$SourceDir\*" -DestinationPath $TempArchive -Force
Write-Host "Archive created successfully!" -ForegroundColor Green

Write-Host "Now please manually transfer the file using:" -ForegroundColor Yellow
Write-Host "scp d:\CrowdEval-main\crowdeval-deployment.zip root@$DropletIP`:$DestinationPath" -ForegroundColor White
Write-Host "Password: Jupiter123@Ai" -ForegroundColor Yellow

Write-Host ""
Write-Host "Then SSH into your droplet:" -ForegroundColor Yellow
Write-Host "ssh root@$DropletIP" -ForegroundColor White
Write-Host "Password: Jupiter123@Ai" -ForegroundColor Yellow

Write-Host ""
Write-Host "Once connected to the droplet, run these commands:" -ForegroundColor Yellow
Write-Host "sudo mkdir -p /opt/crowdeval" -ForegroundColor White
Write-Host "sudo unzip $DestinationPath -d /opt/crowdeval" -ForegroundColor White
Write-Host "sudo chown -R root:root /opt/crowdeval" -ForegroundColor White
Write-Host "sudo chmod +x /opt/crowdeval/deploy.sh" -ForegroundColor White
Write-Host "rm $DestinationPath" -ForegroundColor White
Write-Host "cd /opt/crowdeval" -ForegroundColor White
Write-Host "Follow the remaining steps in MANUAL-DEPLOYMENT-INSTRUCTIONS.md" -ForegroundColor White