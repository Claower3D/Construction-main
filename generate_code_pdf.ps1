# Uses relative paths from CWD
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web

$descData = Get-Content ".\code_descriptions.json" -Raw -Encoding UTF8 | ConvertFrom-Json

$sb = [System.Text.StringBuilder]::new(3000000)
$totalLines = 0
$fileDatas = @()

foreach ($item in $descData.files) {
    $fullPath = $item.path
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        $lineCount = ($content -split "`n").Count
        $totalLines += $lineCount
        $fileDatas += @{Item=$item; Content=$content; Lines=$lineCount}
        Write-Host "OK: $($item.name) - $lineCount lines"
    } else {
        Write-Host "SKIP: $fullPath"
    }
}

$approxPages = [math]::Ceiling($totalLines / 50)
Write-Host "Total: $totalLines lines, ~$approxPages pages"

# --- HTML ---
[void]$sb.Append(@"
<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<title>$([System.Web.HttpUtility]::HtmlEncode($descData.title))</title>
<style>
@page{size:A4;margin:15mm 12mm 20mm 12mm}
@media print{.pb{display:none!important}.fs{page-break-before:always}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:8.5pt;line-height:1.3;color:#1a1a1a;background:#fff}
.cp{page-break-after:always;display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:92vh;text-align:center;font-family:'Times New Roman',serif}
.cp h1{font-size:20pt;margin-bottom:8mm}
.cp h2{font-size:15pt;margin-bottom:6mm;font-weight:normal}
.cp .s{font-size:11pt;color:#444;margin-bottom:4mm}
.it{margin-top:12mm;font-size:11pt;text-align:left;border-collapse:collapse}
.it td{padding:3px 10px;vertical-align:top}
.it td:first-child{font-weight:bold;white-space:nowrap}
.tp{page-break-after:always;font-family:'Times New Roman',serif;padding-top:8mm}
.tp h2{font-size:15pt;margin-bottom:6mm;text-align:center}
.tt{width:100%;border-collapse:collapse;font-size:10pt}
.tt th{background:#f0f0f0;border:1px solid #ccc;padding:4px 6px;text-align:left;font-weight:bold}
.tt td{border:1px solid #ccc;padding:3px 6px}
.tt tr:nth-child(even){background:#fafafa}
.tn{font-family:'Times New Roman',serif;font-size:10pt;line-height:1.4;margin-top:6mm}
.tn h3{font-size:12pt;margin-bottom:3mm}
.fs{page-break-before:always}
.fh{background:#2c3e50;color:#fff;padding:6px 10px;font-family:Arial,sans-serif;font-size:10pt;margin-bottom:1.5mm;display:flex;justify-content:space-between;align-items:center}
.fh .fn{font-weight:bold;font-size:11pt}
.fh .fm{font-size:8pt;opacity:.8}
.fd{font-family:Arial,sans-serif;font-size:8pt;color:#555;padding:2px 10px;margin-bottom:2mm;border-left:3px solid #3498db;background:#f8f9fa}
.cb{border:1px solid #ddd}
.cl{display:flex;border-bottom:1px solid #f0f0f0}
.cl:last-child{border-bottom:none}
.ln{min-width:38px;padding:0 4px;text-align:right;color:#aaa;background:#f5f5f5;border-right:1px solid #ddd;font-size:7.5pt;user-select:none}
.lc{padding:0 6px;white-space:pre;flex:1;tab-size:4}
.pb{position:fixed;top:12px;right:12px;z-index:9999;background:#2c3e50;color:#fff;border:none;padding:10px 24px;font-size:14px;border-radius:5px;cursor:pointer;font-family:Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.pb:hover{background:#1a252f}
</style></head><body>
"@)

# Print button
[void]$sb.AppendLine("<button class=`"pb`" onclick=`"window.print()`">$([System.Web.HttpUtility]::HtmlEncode($descData.printButton))</button>")

# Cover
$ct = $descData.coverTitle -replace "`n", "<br>"
[void]$sb.AppendLine("<div class=`"cp`"><h1>$ct</h1>")
[void]$sb.AppendLine("<h2>$([System.Web.HttpUtility]::HtmlEncode($descData.coverSubtitle))</h2>")
$cpText = $descData.coverPlatform -replace "`n", "<br>"
[void]$sb.AppendLine("<div class=`"s`">$cpText</div>")
[void]$sb.AppendLine("<div class=`"s`">$([System.Web.HttpUtility]::HtmlEncode($descData.coverVersion))</div>")
[void]$sb.AppendLine("<table class=`"it`">")
foreach ($row in $descData.coverTable) {
    $v = $row.value -replace '\{totalLines\}', "$totalLines"
    [void]$sb.AppendLine("<tr><td>$([System.Web.HttpUtility]::HtmlEncode($row.label))</td><td>$([System.Web.HttpUtility]::HtmlEncode($v))</td></tr>")
}
[void]$sb.AppendLine("</table></div>")

# TOC
[void]$sb.AppendLine("<div class=`"tp`"><h2>$([System.Web.HttpUtility]::HtmlEncode($descData.tocTitle))</h2>")
[void]$sb.AppendLine("<table class=`"tt`"><thead><tr>")
foreach ($h in $descData.tocHeaders) { [void]$sb.AppendLine("<th>$([System.Web.HttpUtility]::HtmlEncode($h))</th>") }
[void]$sb.AppendLine("</tr></thead><tbody>")

$idx = 0
foreach ($fd in $fileDatas) {
    $idx++
    [void]$sb.AppendLine("<tr><td>$idx</td><td>$([System.Web.HttpUtility]::HtmlEncode($fd.Item.name))</td><td>$($fd.Lines)</td><td>$([System.Web.HttpUtility]::HtmlEncode($fd.Item.lang))</td><td>$([System.Web.HttpUtility]::HtmlEncode($fd.Item.desc))</td></tr>")
}

[void]$sb.AppendLine("</tbody><tfoot><tr style=`"font-weight:bold;background:#f0f0f0`"><td colspan=`"2`">$([System.Web.HttpUtility]::HtmlEncode($descData.totalLabel))</td><td>$totalLines</td><td colspan=`"2`">~$approxPages $([System.Web.HttpUtility]::HtmlEncode($descData.pagesLabel))</td></tr></tfoot></table>")
[void]$sb.AppendLine("<div class=`"tn`"><h3>$([System.Web.HttpUtility]::HtmlEncode($descData.noteTitle))</h3><p>$([System.Web.HttpUtility]::HtmlEncode($descData.noteText))</p></div></div>")

# Files
$idx = 0
foreach ($fd in $fileDatas) {
    $idx++
    $item = $fd.Item
    $nameE = [System.Web.HttpUtility]::HtmlEncode($item.name)
    $descE = [System.Web.HttpUtility]::HtmlEncode($item.desc)
    $pathE = [System.Web.HttpUtility]::HtmlEncode($item.path)
    $ml = [System.Web.HttpUtility]::HtmlEncode($descData.moduleLabel)

    [void]$sb.AppendLine("<div class=`"fs`"><div class=`"fh`"><span class=`"fn`">$ml ${idx}: $nameE</span><span class=`"fm`">$($item.lang.ToUpper()) | $($fd.Lines) lines | $pathE</span></div>")
    [void]$sb.AppendLine("<div class=`"fd`">$descE</div><div class=`"cb`">")

    $lines = $fd.Content -split "`n"
    $ln = 0
    foreach ($line in $lines) {
        $ln++
        $le = [System.Web.HttpUtility]::HtmlEncode($line.TrimEnd("`r"))
        [void]$sb.AppendLine("<div class=`"cl`"><span class=`"ln`">$ln</span><span class=`"lc`">$le</span></div>")
    }
    [void]$sb.AppendLine("</div></div>")
    Write-Host "Rendered: $($item.name) ($ln lines)"
}

[void]$sb.AppendLine("</body></html>")

# Write using .NET with explicit path
$outPath = Join-Path (Get-Location).Path "SOURCE_CODE_COPYRIGHT.html"
[System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))

$sz = [math]::Round((Get-Item $outPath).Length / 1MB, 2)
Write-Host ""
Write-Host "=== DONE ==="
Write-Host "Size: $sz MB | Lines: $totalLines | Pages: ~$approxPages"
Write-Host "File: $outPath"
