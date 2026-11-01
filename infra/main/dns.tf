# Created now so its nameservers are known; it only goes live when Porkbun delegates to it (Task 14).
resource "aws_route53_zone" "site" {
  name    = var.domain
  comment = "shtev.dev (delegated from Porkbun)"
}
