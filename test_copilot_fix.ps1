# Test Copilot after fixes
$uri = "http://localhost:3000/api/trpc/copilot.ask"

$body = @{
    "0" = @{
        "json" = @{
            "host" = "https://dbc-516436c3-b9dc.cloud.databricks.com"
            "token" = "dapi3c90775ad1d2ef75fdba80d9a56f59d5"
            "catalog" = "test_sistema"
            "question" = "Quais tabelas contêm dados sensíveis?"
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "Enviando pergunta ao Copilot..."
Write-Host "Corpo da requisição:"
Write-Host $body

try {
    $response = Invoke-WebRequest -Uri $uri `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -Headers @{
            "Content-Type" = "application/json"
        }
    
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Resposta:"
    Write-Host $response.Content
} catch {
    Write-Host "Erro: $_"
    Write-Host "Status: $($_.Exception.Response.StatusCode)"
    Write-Host "Conteúdo:" 
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $streamReader.ReadToEnd()
}
