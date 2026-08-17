param(
    [string]$SubscriptionId,
    [string]$KeyVaultName,
    [string]$SecretName     = 'Databricks-AccessToken',
    [string]$DatabricksHost = 'https://adb-3226187933874518.18.azuredatabricks.net',
    [string]$SecretScope    = 'key-vault-secrets'
)

$ErrorActionPreference = 'Stop'

function Require-AzCli {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        $azPath = 'C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin'
        if (Test-Path $azPath) {
            $env:Path = "$azPath;$env:Path"
        }
    }

    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        throw 'Azure CLI nao encontrado no PATH. Instale com: winget install -e --id Microsoft.AzureCLI'
    }
}

function Run-AzJson([string[]]$AzArgs) {
    $maxAttempts = 5
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $output = az @AzArgs --output json 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $output | ConvertFrom-Json
        }

        $msg = "$output"
        $isTransient = $msg -match 'ConnectionResetError|Connection aborted|temporarily unavailable|timeout|timed out|Too Many Requests|429'
        if (-not $isTransient -or $attempt -eq $maxAttempts) {
            throw "Falha ao executar: az $($AzArgs -join ' ')`n$msg"
        }

        $wait = $attempt * 3
        Write-Warning "Falha transitoria na tentativa $attempt/$maxAttempts para: az $($AzArgs -join ' '). Aguardando ${wait}s..."
        Start-Sleep -Seconds $wait
    }
}

function Run-AzText([string[]]$AzArgs) {
    $maxAttempts = 5
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $output = az @AzArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            return ($output | Out-String).Trim()
        }

        $msg = "$output"
        $isTransient = $msg -match 'ConnectionResetError|Connection aborted|temporarily unavailable|timeout|timed out|Too Many Requests|429'
        if (-not $isTransient -or $attempt -eq $maxAttempts) {
            throw "Falha ao executar: az $($AzArgs -join ' ')`n$msg"
        }

        $wait = $attempt * 3
        Write-Warning "Falha transitoria na tentativa $attempt/$maxAttempts para: az $($AzArgs -join ' '). Aguardando ${wait}s..."
        Start-Sleep -Seconds $wait
    }
}

try {
    Require-AzCli

    az config set extension.use_dynamic_install=yes_without_prompt | Out-Null
    az config set extension.dynamic_install_allow_preview=true | Out-Null

    $account = Run-AzJson -AzArgs @('account', 'show')

    if ($SubscriptionId) {
        az account set --subscription $SubscriptionId | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Nao foi possivel definir a subscription: $SubscriptionId"
        }
        $account = Run-AzJson -AzArgs @('account', 'show')
    }

    # Garante o comando Databricks sem prompt interativo.
    az extension add --name databricks --upgrade | Out-Null

    $resourceGroups = @()
    $resourceGroupsWarning = $null
    try {
        $resourceGroups = Run-AzJson -AzArgs @('group', 'list')
    }
    catch {
        $resourceGroupsWarning = $_.Exception.Message
    }

    $workspaces = @()
    $workspaceLookupWarning = $null
    try {
        $workspaces = Run-AzJson -AzArgs @('databricks', 'workspace', 'list')
    }
    catch {
        $workspaceLookupWarning = $_.Exception.Message
    }

    Write-Host '=== Contexto Azure ===' -ForegroundColor Cyan
    Write-Host ("Subscription: {0} ({1})" -f $account.name, $account.id)
    Write-Host ("Tenant: {0}" -f $account.tenantId)
    Write-Host ("Usuario: {0}" -f $account.user.name)

    Write-Host ''
    Write-Host '=== Resource Groups ===' -ForegroundColor Cyan
    if ($resourceGroupsWarning) {
        Write-Host 'Nao foi possivel listar Resource Groups (erro transitorio de rede).' -ForegroundColor Yellow
    }
    else {
        Write-Host ("Total: {0}" -f $resourceGroups.Count)
        if ($resourceGroups.Count -gt 0) {
            $resourceGroups |
                Select-Object name, location, provisioningState |
                Format-Table -AutoSize
        }
    }

    Write-Host ''
    Write-Host '=== Databricks Workspaces ===' -ForegroundColor Cyan
    if ($workspaceLookupWarning) {
        Write-Host 'Nao foi possivel consultar workspaces Databricks neste momento.' -ForegroundColor Yellow
        Write-Host $workspaceLookupWarning -ForegroundColor Yellow
    }
    else {
        Write-Host ("Total: {0}" -f $workspaces.Count)
    }
    if (-not $workspaceLookupWarning -and $workspaces.Count -gt 0) {
        $workspaces |
            Select-Object name, location, resourceGroup, sku |
            Format-Table -AutoSize
    }

    if ($KeyVaultName) {
        Write-Host ''
        Write-Host '=== Key Vault ===' -ForegroundColor Cyan
        Write-Host ("Vault: {0}" -f $KeyVaultName)
        Write-Host ("Secret: {0}" -f $SecretName)

        $secretValue = Run-AzText -AzArgs @(
            'keyvault', 'secret', 'show',
            '--vault-name', $KeyVaultName,
            '--name', $SecretName,
            '--query', 'value',
            '-o', 'tsv'
        )

        if ([string]::IsNullOrWhiteSpace($secretValue)) {
            throw 'O segredo foi encontrado, mas o valor retornou vazio.'
        }

        Write-Host 'Segredo recuperado com sucesso. Valor mascarado abaixo:' -ForegroundColor Green
        if ($secretValue.Length -gt 8) {
            Write-Host (($secretValue.Substring(0, 4) + '...' + $secretValue.Substring($secretValue.Length - 4)))
        }
        else {
            Write-Host '***'
        }
    }

    # === Acesso ao Databricks via Azure AD token (sem Key Vault publico) ===
    Write-Host ''
    Write-Host '=== Databricks via Azure AD Token ===' -ForegroundColor Cyan
    Write-Host ("Workspace: {0}" -f $DatabricksHost)

    $aadToken = Run-AzText -AzArgs @(
        'account', 'get-access-token',
        '--resource', '2ff814a6-3304-4ab8-85cb-cd0e6f879c1d',
        '--query', 'accessToken', '-o', 'tsv'
    )

    $dbxHeaders = @{
        Authorization  = "Bearer $aadToken"
        'Content-Type' = 'application/json'
    }

    # Testar warehouses
    $wh = Invoke-RestMethod -Uri "$DatabricksHost/api/2.0/sql/warehouses" -Headers $dbxHeaders
    Write-Host ("SQL Warehouses: {0}" -f $wh.warehouses.Count) -ForegroundColor Green
    if ($wh.warehouses.Count -gt 0) {
        $wh.warehouses | Select-Object id, name, state | Format-Table -AutoSize
    }

    # Listar secret scopes
    $scopes = Invoke-RestMethod -Uri "$DatabricksHost/api/2.0/secrets/scopes/list" -Headers $dbxHeaders
    Write-Host ("Secret Scopes disponiveis: {0}" -f $scopes.scopes.Count)
    $match = $scopes.scopes | Where-Object { $_.name -eq $SecretScope }
    if ($match) {
        Write-Host ("Scope '{0}' encontrado (backend: {1})" -f $match.name, $match.backend_type) -ForegroundColor Green
    }
    else {
        Write-Host ("Scope '{0}' NAO encontrado. Scopes: {1}" -f $SecretScope, ($scopes.scopes.name -join ', ')) -ForegroundColor Yellow
    }

    # Listar catalogs Unity Catalog
    $cats = Invoke-RestMethod -Uri "$DatabricksHost/api/2.1/unity-catalog/catalogs" -Headers $dbxHeaders
    Write-Host ("Catalogs Unity Catalog: {0}" -f $cats.catalogs.Count) -ForegroundColor Green
    if ($cats.catalogs.Count -gt 0) {
        $cats.catalogs | Select-Object name | Format-Table -AutoSize
    }

    Write-Host ''
    Write-Host 'Diagnostico concluido com sucesso.' -ForegroundColor Green
}
catch {
    Write-Host ''
    Write-Host 'Diagnostico falhou:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
