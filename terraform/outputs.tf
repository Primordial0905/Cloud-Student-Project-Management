
output "resource_group_name" {
  description = "Name of the application resource group."
  value       = azurerm_resource_group.main.name
}

output "static_web_app_name" {
  description = "Name of the Static Web App."
  value       = azurerm_static_web_app.main.name
}

output "static_web_app_default_host_name" {
  description = "Default hostname of the Static Web App."
  value       = azurerm_static_web_app.main.default_host_name
}

output "sql_server_fqdn" {
  description = "Fully qualified domain name of the SQL server."
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "Name of the SQL database."
  value       = azurerm_mssql_database.main.name
}
