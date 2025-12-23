$ErrorActionPreference = 'Stop'

try {
    Write-Host "1. Registering User..."
    $regBody = @{
        email = "test_final@example.com"
        password = "password123"
        name = "Test User"
    } | ConvertTo-Json
    $reg = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/register" -Body $regBody -ContentType "application/json"
    Write-Host "Register OK: $($reg.id)"

    Write-Host "2. Logging In..."
    $loginBody = @{
        email = "test_final@example.com"
        password = "password123"
    } | ConvertTo-Json
    $login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/login" -Body $loginBody -ContentType "application/json"
    $token = $login.accessToken
    Write-Host "Login OK. Token received."

    $headers = @{
        Authorization = "Bearer $token"
    }

    Write-Host "3. Creating Category..."
    $catBody = @{
        name = "Food"
        icon = "FOO"
        color = "#FF0000"
    } | ConvertTo-Json
    $cat = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/categories" -Body $catBody -ContentType "application/json" -Headers $headers
    Write-Host "Category OK: $($cat.id)"

    Write-Host "4. Creating Transaction..."
    $txBody = @{
        amount = 50.50
        type = "EXPENSE"
        date = "2025-12-01T12:00:00Z"
        categoryId = $cat.id
        note = "Lunch"
    } | ConvertTo-Json
    $tx = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/transactions" -Body $txBody -ContentType "application/json" -Headers $headers
    Write-Host "Transaction OK: $($tx.id)"

    Write-Host "5. Getting Monthly Report..."
    $report = Invoke-RestMethod -Method Get -Uri "http://localhost:3000/reports/monthly-summary?month=2025-12" -Headers $headers
    Write-Host "Report OK. Expense Total: $($report.expenseTotal)"

    Write-Host "VERIFICATION SUCCESSFUL"
} catch {
    Write-Error "Verification Failed: $_"
    exit 1
}
