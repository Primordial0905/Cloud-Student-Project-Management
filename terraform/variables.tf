
variable "subscription_id" {
  description = "Azure subscription ID used for deployment."
  type        = string
  sensitive   = true
}

variable "location" {
  description = "Azure region for project resources."
  type        = string
  default     = "centralindia"
}

variable "resource_group_name" {
  description = "Resource group for the application."
  type        = string
  default     = "rg-cloud-project-manager"
}

variable "static_web_app_name" {
  description = "Globally unique Azure Static Web App name."
  type        = string
}

variable "static_web_app_location" {
  description = "Supported region for Azure Static Web Apps."
  type        = string
  default     = "eastasia"
}

variable "sql_server_name" {
  description = "Globally unique Azure SQL logical server name."
  type        = string
}

variable "sql_database_name" {
  description = "Azure SQL database name."
  type        = string
  default     = "cloudprojectdb"
}

variable "sql_admin_username" {
  description = "SQL server administrator username."
  type        = string
}

variable "sql_admin_password" {
  description = "SQL server administrator password."
  type        = string
  sensitive   = true
}