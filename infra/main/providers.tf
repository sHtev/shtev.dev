provider "aws" {
  region = "eu-west-2"
  default_tags {
    tags = { Project = "shtev.dev", ManagedBy = "terraform" }
  }
}

data "aws_caller_identity" "current" {}
