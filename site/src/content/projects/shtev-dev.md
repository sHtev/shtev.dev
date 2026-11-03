---
title: shtev.dev
summary: this site, as infrastructure code
order: 1
draft: false
---

This site: an Astro static site on AWS S3 and CloudFront, with a serverless contact form (Lambda, DynamoDB and SNS). Everything is defined in Terraform and deployed by GitHub Actions using OIDC, so there are no long-lived AWS keys.
