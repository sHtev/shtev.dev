provider "aws" {
  region = "eu-west-2"
  default_tags {
    tags = { Project = "shtev.dev", ManagedBy = "terraform" }
  }
}

# CloudFront only accepts ACM certificates from us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = { Project = "shtev.dev", ManagedBy = "terraform" }
  }
}

data "aws_caller_identity" "current" {}
