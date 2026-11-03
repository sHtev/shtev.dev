# Created now so its nameservers are known; it only goes live when Porkbun delegates to it (Task 14).
resource "aws_route53_zone" "site" {
  name    = var.domain
  comment = "shtev.dev (delegated from Porkbun)"
}

# Go-live: certificate for the apex and www, validated through this zone.
resource "aws_acm_certificate" "site" {
  count                     = var.custom_domain_enabled ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.domain
  subject_alternative_names = ["www.${var.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.custom_domain_enabled ? {
    for o in aws_acm_certificate.site[0].domain_validation_options : o.domain_name => o
  } : {}

  zone_id         = aws_route53_zone.site.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  count                   = var.custom_domain_enabled ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# Apex and www point at CloudFront (the viewer-request function redirects www to the apex).
resource "aws_route53_record" "site" {
  for_each = {
    for pair in setproduct(local.aliases, ["A", "AAAA"]) : "${pair[0]}-${pair[1]}" => { name = pair[0], type = pair[1] }
  }

  zone_id = aws_route53_zone.site.zone_id
  name    = each.value.name
  type    = each.value.type

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
