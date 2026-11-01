output "site_bucket" {
  value = aws_s3_bucket.site.bucket
}

output "private_assets_bucket" {
  value = aws_s3_bucket.private_assets.bucket
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "distribution_domain" {
  description = "Preview address until go-live."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "route53_nameservers" {
  description = "Set these at Porkbun at go-live."
  value       = aws_route53_zone.site.name_servers
}
