$root = Split-Path $PSScriptRoot -Parent
$port = 8080
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:${port}/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port"
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    if ($path -eq '/') { $path = '/index.html' }
    $file = Join-Path $root $path.TrimStart('/')
    if (Test-Path $file -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file)
        $ct = switch ($ext) {
            '.html'  { 'text/html; charset=utf-8' }
            '.css'   { 'text/css; charset=utf-8' }
            '.js'    { 'application/javascript; charset=utf-8' }
            '.jpg'   { 'image/jpeg' }
            '.jpeg'  { 'image/jpeg' }
            '.png'   { 'image/png' }
            '.svg'   { 'image/svg+xml' }
            '.mp4'   { 'video/mp4' }
            '.otf'   { 'font/otf' }
            '.woff2' { 'font/woff2' }
            '.json'  { 'application/json' }
            '.ico'   { 'image/x-icon' }
            default  { 'application/octet-stream' }
        }
        $ctx.Response.ContentType = $ct
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
        $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $ctx.Response.Close()
}
