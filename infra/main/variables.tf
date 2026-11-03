variable "domain" {
  description = "Apex domain for the site."
  type        = string
  default     = "shtev.dev"
}

variable "custom_domain_enabled" {
  description = "Attach shtev.dev to CloudFront. Needs the Porkbun nameservers pointing at Route 53."
  type        = bool
  default     = true
}

variable "budget_email" {
  description = "Where budget and cost-anomaly alerts go. Set in a private terraform.tfvars, never committed."
  type        = string
  sensitive   = true
}

variable "account_budget_usd" {
  description = "Whole-account monthly budget (the account already runs ~$3.30/month of other things)."
  type        = number
  default     = 8
}

variable "site_budget_usd" {
  description = "Monthly budget for resources tagged Project = shtev.dev."
  type        = number
  default     = 2
}
