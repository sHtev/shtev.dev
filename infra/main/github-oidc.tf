# GitHub Actions logs in to AWS with OIDC: short-lived credentials, no stored AWS keys.

variable "github_subject" {
  description = "OIDC subject prefix for the repository: GitHub's immutable form, owner@id/name@id."
  type        = string
  default     = "repo:sHtev@5445348/shtev.dev@1444334250"
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

locals {
  github_principal = { Federated = aws_iam_openid_connect_provider.github.arn }
  github_audience  = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
  state_bucket_arn = "arn:aws:s3:::shtev-dev-tfstate-${data.aws_caller_identity.current.account_id}"
}

# Pull requests: read-only, to run `terraform plan`.
resource "aws_iam_role" "github_plan" {
  name                 = "shtev-dev-github-plan"
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = local.github_principal
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = merge(local.github_audience, {
          "token.actions.githubusercontent.com:sub" = "${var.github_subject}:pull_request"
        })
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "github_plan_readonly" {
  role       = aws_iam_role.github_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Plan also needs to take the state lock and read the SecureString origin secret.
resource "aws_iam_role_policy" "github_plan_extras" {
  name = "terraform-plan-extras"
  role = aws_iam_role.github_plan.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject"]
        Resource = "${local.state_bucket_arn}/*.tflock"
      },
      {
        Effect    = "Allow"
        Action    = "kms:Decrypt"
        Resource  = "*"
        Condition = { StringEquals = { "kms:ViaService" = "ssm.eu-west-2.amazonaws.com" } }
      },
    ]
  })
}

# Deploys: only jobs in the GitHub "production" environment (restricted to main) can assume this.
# Administrator because Terraform manages IAM, Lambda, CloudFront, DNS and budgets here; a tighter
# policy would be long and brittle, and Terraform can edit its own role regardless.
resource "aws_iam_role" "github_deploy" {
  name                 = "shtev-dev-github-deploy"
  max_session_duration = 3600
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = local.github_principal
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = merge(local.github_audience, {
          "token.actions.githubusercontent.com:sub" = "${var.github_subject}:environment:production"
        })
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "github_deploy_admin" {
  role       = aws_iam_role.github_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

output "plan_role_arn" {
  value = aws_iam_role.github_plan.arn
}

output "deploy_role_arn" {
  value = aws_iam_role.github_deploy.arn
}
