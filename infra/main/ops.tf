# Cost guards: a small monthly budget and anomaly alerts, so a mistake can't quietly run up a bill.

# Lets budgets filter on the Project tag that every resource here carries (default_tags).
# Costs only start being attributed to the tag after it's activated (about 24 hours).
resource "aws_ce_cost_allocation_tag" "project" {
  tag_key = "Project"
  status  = "Active"
}

locals {
  budgets = {
    account = { name = "account-monthly", limit = var.account_budget_usd, filter = null }
    site    = { name = "shtev-dev-monthly", limit = var.site_budget_usd, filter = "user:Project$shtev.dev" }
  }
}

# Alerts at 80% of actual spend and when the forecast passes 100%.
resource "aws_budgets_budget" "monthly" {
  for_each     = local.budgets
  name         = each.value.name
  budget_type  = "COST"
  limit_amount = tostring(each.value.limit)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  dynamic "cost_filter" {
    for_each = each.value.filter == null ? [] : [each.value.filter]
    content {
      name   = "TagKeyValue"
      values = [cost_filter.value]
    }
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "ACTUAL"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.budget_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "FORECASTED"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.budget_email]
  }
}

resource "aws_ce_anomaly_monitor" "services" {
  name              = "shtev-dev-services"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "email" {
  name             = "shtev-dev-anomalies"
  frequency        = "DAILY"
  monitor_arn_list = [aws_ce_anomaly_monitor.services.arn]

  subscriber {
    type    = "EMAIL"
    address = var.budget_email
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = ["1"]
    }
  }
}

# The single budget became the "site" entry of the map above.
moved {
  from = aws_budgets_budget.monthly
  to   = aws_budgets_budget.monthly["site"]
}
