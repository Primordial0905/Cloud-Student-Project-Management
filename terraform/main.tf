
data "http" "my_ip" {
  url = "https://api.ipify.org"
}

locals {
  my_ip = chomp(data.http.my_ip.response_body)
}

resource "azurerm_mssql_firewall_rule" "my_ip" {
  name             = "terraform-runner"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = local.my_ip
  end_ip_address   = local.my_ip
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_static_web_app" "main" {
  name                = var.static_web_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = var.static_web_app_location
  sku_tier            = "Free"
  sku_size            = "Free"

    app_settings = {
    SQL_Server   = azurerm_mssql_server.main.fully_qualified_domain_name
    SQL_Database     = azurerm_mssql_database.main.name
    SQL_User     = var.sql_admin_username
    SQL_Password = var.sql_admin_password
  }
}

resource "azurerm_mssql_server" "main" {
  name                         = var.sql_server_name
  resource_group_name          = azurerm_resource_group.main.name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"

  public_network_access_enabled = true
}
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_mssql_database" "main" {
  name      = var.sql_database_name
  server_id = azurerm_mssql_server.main.id

  sku_name                    = "GP_S_Gen5_2"
  min_capacity                = 0.5
  auto_pause_delay_in_minutes = 15
  max_size_gb                 = 32
}
resource "terraform_data" "schema" {
  triggers_replace = filesha256("${path.module}/schema.sql")

  provisioner "local-exec" {
    command = "sqlcmd -S ${azurerm_mssql_server.main.fully_qualified_domain_name} -d ${azurerm_mssql_database.main.name} -U ${var.sql_admin_username} -i \"${path.module}/schema.sql\" -b"
    environment = {
      SQLCMDPASSWORD = var.sql_admin_password
    }
  }

  depends_on = [
    azurerm_mssql_database.main,
    azurerm_mssql_firewall_rule.my_ip,
  ]
}
resource "github_actions_secret" "swa_token" {
  repository      = var.github_repo
  secret_name     = "AZURE_STATIC_WEB_APPS_API_TOKEN_WHITE_GRASS_023B8E400"
  plaintext_value = azurerm_static_web_app.main.api_key
}