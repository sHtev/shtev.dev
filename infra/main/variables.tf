variable "domain" {
  description = "Apex domain for the site."
  type        = string
  default     = "shtev.dev"
}

variable "custom_domain_enabled" {
  description = "Attach shtev.dev to CloudFront. Leave false until the Porkbun nameservers point at Route 53 (go-live)."
  type        = bool
  default     = false
}

variable "budget_email" {
  description = "Where budget and cost-anomaly alerts go. Set in a private terraform.tfvars, never committed."
  type        = string
  sensitive   = true
}

variable "monthly_budget_usd" {
  description = "Monthly cost budget; alerts at 80% actual and 100% forecast."
  type        = number
  default     = 2
}
