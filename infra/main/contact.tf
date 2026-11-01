# Contact form back-end: CloudFront /api/* -> Lambda Function URL -> DynamoDB + SNS email.
# The Function URL is public (OAC can't sign no-JS form posts), so CloudFront adds a secret
# header the Lambda checks, and reserved concurrency caps cost if the URL is ever found.

variable "contact_email" {
  description = "Where contact-form messages are emailed (SNS subscription). Private tfvars only."
  type        = string
  sensitive   = true
}

locals {
  contact_name = "shtev-dev-contact"
}

resource "aws_dynamodb_table" "contact" {
  name         = local.contact_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  attribute {
    name = "pk"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  server_side_encryption { enabled = true }
}

resource "aws_sns_topic" "contact" {
  name = local.contact_name
}

resource "aws_sns_topic_subscription" "contact_email" {
  topic_arn = aws_sns_topic.contact.arn
  protocol  = "email"
  endpoint  = var.contact_email
}

resource "random_password" "origin_secret" {
  length  = 48
  special = false
}

resource "aws_ssm_parameter" "origin_secret" {
  name  = "/shtev-dev/origin-secret"
  type  = "SecureString"
  value = random_password.origin_secret.result
}

data "archive_file" "contact" {
  type        = "zip"
  source_file = "${path.module}/../../lambda/contact/dist/index.mjs"
  output_path = "${path.module}/.build/contact.zip"
}

resource "aws_iam_role" "contact" {
  name = local.contact_name
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "contact" {
  name = local.contact_name
  role = aws_iam_role.contact.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["dynamodb:PutItem", "dynamodb:UpdateItem"], Resource = aws_dynamodb_table.contact.arn },
      { Effect = "Allow", Action = "sns:Publish", Resource = aws_sns_topic.contact.arn },
      { Effect = "Allow", Action = "ssm:GetParameter", Resource = aws_ssm_parameter.origin_secret.arn },
      { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.contact.arn}:*" },
    ]
  })
}

resource "aws_cloudwatch_log_group" "contact" {
  name              = "/aws/lambda/${local.contact_name}"
  retention_in_days = 14
}

resource "aws_lambda_function" "contact" {
  function_name                  = local.contact_name
  role                           = aws_iam_role.contact.arn
  runtime                        = "nodejs24.x"
  architectures                  = ["arm64"]
  handler                        = "index.handler"
  filename                       = data.archive_file.contact.output_path
  source_code_hash               = data.archive_file.contact.output_base64sha256
  memory_size                    = 128
  timeout                        = 5
  reserved_concurrent_executions = 2

  environment {
    variables = {
      TABLE_NAME          = aws_dynamodb_table.contact.name
      TOPIC_ARN           = aws_sns_topic.contact.arn
      ORIGIN_SECRET_PARAM = aws_ssm_parameter.origin_secret.name
      RATE_LIMIT_PER_HOUR = "5"
    }
  }

  depends_on = [aws_cloudwatch_log_group.contact]
}

resource "aws_lambda_function_url" "contact" {
  function_name      = aws_lambda_function.contact.function_name
  authorization_type = "NONE"
}

# Public Function URLs need both permissions; the second only allows invocation via the URL.
resource "aws_lambda_permission" "contact_url" {
  statement_id           = "FunctionUrlPublic"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.contact.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "contact_invoke_via_url" {
  statement_id             = "InvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.contact.function_name
  principal                = "*"
  invoked_via_function_url = true
}

# Forward only what the Lambda reads. Not the Host header (Function URLs reject a foreign Host),
# but CloudFront-Viewer-Address so rate limiting sees the visitor, not CloudFront.
resource "aws_cloudfront_origin_request_policy" "contact" {
  name = "shtev-dev-contact"
  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["Accept", "Content-Type", "CloudFront-Viewer-Address"]
    }
  }
  cookies_config { cookie_behavior = "none" }
  query_strings_config { query_string_behavior = "none" }
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}
