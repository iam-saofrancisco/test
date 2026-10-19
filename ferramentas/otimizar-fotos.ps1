# ============================================================
#  Otimiza as fotos do album (gera versoes reduzidas e miniaturas)
#  - NAO altera os arquivos originais
#  - Cria:  midia\fotos\<aba>\otimizadas\  (max 1920px, JPEG)
#           midia\fotos\<aba>\minis\       (max 600px, JPEG)
#  Depois, peca ao assistente para atualizar o js/dados.js
#  Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File ferramentas\otimizar-fotos.ps1
# ============================================================
param(
    [int]$LarguraMax    = 1920,
    [int]$MiniaturaMax  = 600,
    [int]$Qualidade     = 85,
    [int]$QualidadeMini = 78
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$pastaFotos = Join-Path $raiz "midia\fotos"
if (-not (Test-Path $pastaFotos)) { throw "Pasta nao encontrada: $pastaFotos" }

$codecJpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }

function Salvar-Jpeg($bitmap, $caminho, $qualidade) {
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [long]$qualidade)
    $bitmap.Save($caminho, $codecJpeg, $params)
}

function Gerar-Versao($origem, $destino, $maxLado, $qualidade) {
    $img = [System.Drawing.Image]::FromFile($origem)
    try {
        $escala  = [Math]::Min(1.0, $maxLado / [Math]::Max($img.Width, $img.Height))
        $largura = [int][Math]::Round($img.Width * $escala)
        $altura  = [int][Math]::Round($img.Height * $escala)

        $bmp = New-Object System.Drawing.Bitmap($largura, $altura)
        try {
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            try {
                $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $g.DrawImage($img, 0, 0, $largura, $altura)
            } finally { $g.Dispose() }
            Salvar-Jpeg $bmp $destino $qualidade
        } finally { $bmp.Dispose() }
    } finally { $img.Dispose() }
}

$extensoes = @(".jpg", ".jpeg", ".png", ".bmp")
$total = 0

foreach ($aba in (Get-ChildItem -Path $pastaFotos -Directory)) {
    $dirOtim = Join-Path $aba.FullName "otimizadas"
    $dirMini = Join-Path $aba.FullName "minis"

    $arquivos = Get-ChildItem -Path $aba.FullName -File |
        Where-Object { $extensoes -contains $_.Extension.ToLower() }
    if (-not $arquivos) { continue }

    New-Item -ItemType Directory -Force -Path $dirOtim | Out-Null
    New-Item -ItemType Directory -Force -Path $dirMini | Out-Null

    foreach ($arquivo in $arquivos) {
        $nome = [System.IO.Path]::GetFileNameWithoutExtension($arquivo.Name) + ".jpg"
        Gerar-Versao $arquivo.FullName (Join-Path $dirOtim $nome) $LarguraMax   $Qualidade
        Gerar-Versao $arquivo.FullName (Join-Path $dirMini $nome) $MiniaturaMax $QualidadeMini
        $total++
        Write-Host ("OK  " + $aba.Name + " / " + $arquivo.Name)
    }
}

Write-Host ""
Write-Host ("Fotos otimizadas: " + $total)
Write-Host "Originais preservados. Agora peca ao assistente para atualizar o js/dados.js"
