# ================= CONFIG ================= #
$API_KEY = "nm_AhM0-IlZ9YasN9znZTX4yigDe93vfC5iHSgkOE_TnrI"   # ← Replace with your real NewsMesh key
$ENTITY   = "geojit"
$OUTPUT_FILE = "entity_intelligence_live_results.jsonl"
$REQUEST_DELAY = 1
$MAX_PAGES = 5          # Safety limit
$PAGE_SIZE = 50         # NewsMesh default/recommended limit (adjust as per your plan)

# Aliases for better matching
$ALIASES = @(
    $ENTITY.ToLower(),
    "$($ENTITY.ToLower()) ltd",
    "$($ENTITY.ToLower()) limited",
    ($ENTITY.ToLower() -split ' ')[0]
)

$BLOCK_TERMS = @("icici bank", "icici prudential", "icici lombard", "icici mutual", "icici life")

# ================= HELPERS ================= #
function Entity-Mentioned {
    param([string]$Text)
    $lower = $Text.ToLower()
    foreach ($alias in $ALIASES) {
        if ($lower -match [regex]::Escape($alias)) { return $true }
    }
    return $false
}

function Is-Blocked {
    param([string]$Text)
    $lower = $Text.ToLower()
    foreach ($term in $BLOCK_TERMS) {
        if ($lower -match [regex]::Escape($term)) { return $true }
    }
    return $false
}

function Meaningful-Context {
    param([string]$Text)
    return $Text.ToLower() -match [regex]::Escape($ENTITY.ToLower())
}

function Classify-Article {
    param([string]$Title, [string]$Description)
    $text = "$Title $Description".ToLower()
    if ($text -match "stocks to buy|top picks") { return "broker_recommendation" }
    if ($text -match "rating|target price|upside|coverage") { return "broker_opinion" }
    if ($text -match "says|said|according to|as per") { return "broker_quote" }
    return "broker_mention"
}

function Write-JsonL {
    param($Record)
    $Record | ConvertTo-Json -Compress -Depth 10 | Out-File -FilePath $OUTPUT_FILE -Append -Encoding utf8
}

# ================= MAIN FETCH (using /search for date + keyword) ================= #
function Fetch-News {
    param([string]$Cursor = $null, [int]$Page = 1)

    $params = @{
        q       = $ENTITY
        limit   = $PAGE_SIZE
        apiKey  = $API_KEY
    }

    # Add from date (last 1 day) - use /search for better control
    $fromDate = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
    $params.from = $fromDate

    if ($Cursor) {
        $params.cursor = $Cursor
    }

    $queryString = ($params.GetEnumerator() | ForEach-Object {
        "$($_.Key)=$([System.Uri]::EscapeDataString($_.Value))"
    }) -join "&"

    $uri = "https://api.newsmesh.co/v1/search?$queryString"

    Write-Host "Fetching page $Page (cursor: $(if($Cursor){'yes'}else{'no'})) from NewsMesh..." -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Uri $uri -Method Get -ContentType "application/json" -TimeoutSec 30

        $articles = $response.articles  # Adjust if the root field is different (check docs/response)

        Write-Host "Found $($articles.Count) articles" -ForegroundColor Green

        foreach ($article in $articles) {
            $title = $article.title
            $desc  = if ($article.description) { $article.description } else { "" }
            $combined = "$title $desc"

            if (Is-Blocked $combined) { continue }
            if (-not (Entity-Mentioned $combined)) { continue }
            if (-not (Meaningful-Context $combined)) { continue }

            $keySentences = @($combined -split '[.!?]') | 
                            Where-Object { $_.Trim() -ne "" -and $_ -match [regex]::Escape($ENTITY) } | 
                            Select-Object -First 3

            $record = [PSCustomObject]@{
                entity           = $ENTITY
                headline         = $title
                publication      = $article.source.name
                article_type     = Classify-Article $title $desc
                content_quality  = if ($article.content) { "full" } else { "description" }
                key_sentences    = $keySentences
                url              = $article.url
                publishedAt      = $article.publishedAt
                collected_at     = (Get-Date).ToUniversalTime().ToString("o")
                author           = $article.author
                language         = $article.language  # NewsMesh often includes this
                category         = $article.category  # ML-enriched if available
            }

            Write-JsonL $record
            Write-Host "Saved: $title" -ForegroundColor Green
        }

        # Cursor-based pagination (preferred in NewsMesh)
        if ($response.nextCursor -and $Page -lt $MAX_PAGES) {
            Start-Sleep -Seconds $REQUEST_DELAY
            Fetch-News -Cursor $response.nextCursor -Page ($Page + 1)
        }
        elseif ($Page -lt $MAX_PAGES) {
            # Fallback if no cursor or still results
            Write-Host "No more cursor or reached limit." -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    }
}

# ================= RUN ================= #
Write-Host "`nStarting NewsMesh Entity Intelligence for: $ENTITY`n" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($API_KEY) -or $API_KEY -like "*YOUR*KEY*") {
    Write-Host "ERROR: Please replace with your actual NewsMesh API key!" -ForegroundColor Red
    Write-Host "Get one at: https://newsmesh.co/signup" -ForegroundColor Yellow
    exit
}

if (Test-Path $OUTPUT_FILE) { 
    Clear-Content $OUTPUT_FILE -Force 
} else { 
    New-Item -Path $OUTPUT_FILE -ItemType File -Force | Out-Null 
}

Fetch-News -Page 1

Write-Host "`nNewsMesh collection complete! Results saved to: $OUTPUT_FILE" -ForegroundColor Green