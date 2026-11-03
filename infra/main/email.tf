# Mail for cv@ and hello@ is forwarded by ImprovMX; the aliases and destination live in its dashboard.
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.site.zone_id
  name    = var.domain
  type    = "MX"
  ttl     = 3600
  records = ["10 mx1.improvmx.com", "20 mx2.improvmx.com"]
}

resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.site.zone_id
  name    = var.domain
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 include:spf.improvmx.com ~all"]
}
