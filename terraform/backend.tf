terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "tfstatecloudmgr45062"
    container_name       = "tfstate"
    key                  = "cloud-student-manager.tfstate"
    use_azuread_auth     = true
  }
}

