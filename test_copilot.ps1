$body = @{
    json = @{
        question = "Quais tabelas contêm dados sensíveis?"
        config = @{
            host = "https://dbc-516436c3-b9dc.cloud.databricks.com"
            token = "dapi3c90775ad1d2ef75fdba80d9a56f59d5"
            catalog = "test_sistema"
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/trpc/copilot.ask" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $content = $response.Content
    
    # Procura por "erro", "Cannot read", "funcionários", "clientes", etc
    if ($content -match "Cannot read") {
        Write-Host "ERRO: Encontrado 'Cannot read' na resposta"
    } elseif ($content -match "\"result\"") {
        Write-Host "SUCESSO: Resposta recebida com resultado"
        Write-Host "Primeiros 500 caracteres:" 
        Write-Host $content.Substring(0, [Math]::Min(500, $content.Length))
    } elseif ($content -match "error") {
        Write-Host "ERRO detectado na resposta"
        # Extrai mensagem de erro
        $errorMatch = [regex]::Match($content, '"message":\s*"([^"]+)"')
        if ($errorMatch.Success) {
            Write-Host "Mensagem: " + $errorMatch.Groups[1].Value
        }
    } else {
        Write-Host "Resposta recebida (primeiros 300 chars):"
        Write-Host $content.Substring(0, [Math]::Min(300, $content.Length))
    }
} catch {
    Write-Host "ERRO na requisição: $_"
}