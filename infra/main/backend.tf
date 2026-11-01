terraform {
  required_version = ">= 1.10"

  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.0" }
    random  = { source = "hashicorp/random", version = "~> 3.6" }
    archive = { source = "hashicorp/archive", version = "~> 2.6" }
  }

  # Bucket created by ../bootstrap. use_lockfile = S3-native state locking (no DynamoDB table).
  backend "s3" {
    bucket       = "shtev-dev-tfstate-REDACTED"
    key          = "main/terraform.tfstate"
    region       = "eu-west-2"
    encrypt      = true
    use_lockfile = true
  }
}
