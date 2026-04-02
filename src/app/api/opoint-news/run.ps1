# ================= CONFIG ================= #
$API_KEY = "YOUR_API_KEY_HERE"          # ← Replace with your NewsAPI key
$ENTITY   = "geojit"                    # Change this or make it a parameter
$OUTPUT_FILE = "entity_intelligence_live_results.jsonl"
$REQUEST_DELAY = 1                      # seconds between requests (respect rate limits)
$MAX_PAGES = 5                          # Adjust based on free tier (100 req/day total)
$PAGE_SIZE = 100                        # Max allowed by NewsAPI

# Entity aliases (similar to your Python generate_aliases)
$ALIASES = @(
    $ENTITY.ToLower(),
    "$($ENTITY.ToLower()) ltd",
    "$($ENTITY.ToLower()) limited",
    $ENTITY.ToLower().Split()[0]
)

# Block terms (exact match like your script)
$BLOCK_TERMS = @("icici bank", "icici prudential", "icici lombard", "icici mutual", "icici life")

# Search parameters (global = all languages & regions)
$BASE_URL = "https://newsapi.org/v2/everything"
$FROM_DATE = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")   # Last 1 day; change as needed

# ================= HELPERS ================= #
function Entity-Mentioned {
    param([string]$Text)
    $lower = $Text.ToLower()
    return $ALIASES | Where-Object { $lower -match [regex]::Escape($_) }
}

function Is-Blocked {
    param([string]$Text)
    $lower = $Text.ToLower()
    return $BLOCK_TERMS | Where-Object { $lower -match [regex]::Escape($_) }
}

function Meaningful-Context {
    param([string]$Text)
    return $Text.ToLower() -match $ENTITY.ToLower()
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

# ================= MAIN FETCH LOGIC ================= #
function Fetch-News {
    param([int]$Page = 1)

    $params = @{
        q          = $ENTITY
        from       = $FROM_DATE
        sortBy     = "publishedAt"      # or "relevancy" / "popularity"
        pageSize   = $PAGE_SIZE
        page       = $Page
        language   = $null               # null = ALL languages
        # country  = $null               # omitted = all regions
        apiKey     = $API_KEY
    }

    $queryString = ($params.GetEnumerator() | ForEach-Object {
        if ($null -ne $_.Value) { "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))" }
    }) -join "&"

    $uri = "$BASE_URL`?$queryString"

    Write-Host "🔎 Fetching page $Page from NewsAPI (global/all languages)..."

    try {
        $response = Invoke-RestMethod -Uri $uri -Method Get -ContentType "application/json"

        if ($response.status -ne "ok") {
            Write-Host "❌ Error: $($response.message)" -ForegroundColor Red
            return $false
        }

        $articles = $response.articles
        Write-Host "✅ Found $($articles.Count) articles on page $Page"

        foreach ($article in $articles) {
            $title = $article.title
            $desc  = $article.description
            $combined = "$title $desc"

            if (Is-Blocked $combined) { continue }
            if (-not (Entity-Mentioned $combined)) { continue }
            if (-not (Meaningful-Context $combined)) { continue }

            $keySentences = @($combined -split '[.!?]') | 
                            Where-Object { $_ -match $ENTITY } | 
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
                language         = "multi"   # since we fetch globally
            }

            Write-JsonL $record
            Write-Host "✅ Saved: $title" -ForegroundColor Green
        }

        # Continue to next page if more results exist
        $totalResults = $response.totalResults
        if ($Page * $PAGE_SIZE -lt $totalResults -and $Page -lt $MAX_PAGES) {
            Start-Sleep -Seconds $REQUEST_DELAY
            Fetch-News -Page ($Page + 1)
        }
    }
    catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ================= RUN ================= #
Write-Host "`n🚀 Starting NewsAPI Entity Intelligence for: $ENTITY (ALL languages & regions)`n" -ForegroundColor Cyan

# Clear or create output file
if (Test-Path $OUTPUT_FILE) { Clear-Content $OUTPUT_FILE }

Fetch-News -Page 1

Write-Host "`n✅ NewsAPI collection complete! Results saved to $OUTPUT_FILE" -ForegroundColor Green