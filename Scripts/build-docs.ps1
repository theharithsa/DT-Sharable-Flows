<#
.SYNOPSIS
  Generates a static .html page next to every .md doc in the repo.
  The markdown source is embedded in the page (no fetch), so pages work
  from file:// as well as GitHub Pages. Re-run after editing any .md.

  Usage:  powershell -ExecutionPolicy Bypass -File Scripts/build-docs.ps1
#>

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

# Docs to publish: repo .md files, excluding root README (index.html covers it)
$docs = Get-ChildItem -Path $repo -Recurse -Filter *.md |
  Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.FullName -ne (Join-Path $repo 'README.md') }

$template = Get-Content -Raw -Encoding UTF8 (Join-Path $repo 'assets\doc-template.html')

foreach ($doc in $docs) {
  $md = Get-Content -Raw -Encoding UTF8 $doc.FullName

  # Relative path from doc folder back to repo root (for assets/font refs)
  $relDir = $doc.DirectoryName.Substring($repo.Length).TrimStart('\')
  $depth = if ($relDir) { ($relDir -split '\\').Count } else { 0 }
  $root = if ($depth -gt 0) { ('../' * $depth) } else { './' }

  $relPath = ($doc.FullName.Substring($repo.Length).TrimStart('\')) -replace '\\', '/'

  # First H1 as title
  $title = 'Documentation'
  if ($md -match '(?m)^#\s+(.+)$') { $title = $Matches[1].Trim(' *#') }

  # Embed markdown safely inside <script type="text/markdown">
  $safeMd = $md -replace '</script', '<\/script'

  $html = $template.
    Replace('{{TITLE}}', $title).
    Replace('{{ROOT}}', $root).
    Replace('{{DOC_PATH}}', $relPath).
    Replace('{{DOC_FILE}}', $doc.Name).
    Replace('{{MARKDOWN}}', $safeMd)

  $out = [System.IO.Path]::ChangeExtension($doc.FullName, '.html')
  [System.IO.File]::WriteAllText($out, $html, (New-Object System.Text.UTF8Encoding $false))
  Write-Host "built: $($out.Substring($repo.Length).TrimStart('\'))"
}
Write-Host "`nDone. $($docs.Count) doc page(s) generated."
