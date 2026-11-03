---
title: University web team
summary: a London university's web team, given a formal SDLC and CI/CD
order: 4
draft: true
---

**The client.** The web development team at a London university.

**What I did.** At Isotoma, I introduced a formal, streamlined software development lifecycle and CI/CD for the team, and moved their workloads onto Kubernetes on Amazon EKS:

- **GitOps.** Flux keeps each cluster in step with the configuration in Git. When CI publishes a new container image, Flux's image automation commits the new tag to Git and deploys it, so every release is recorded in Git and can be rolled back by reverting it.
- **Helm charts** for the team's applications, deployed to separate non-production and production environments.
- **The edge.** CloudFront in front of the sites, serving files from S3, with AWS WAF and other security controls, and CloudFront Functions and Lambda@Edge rewriting headers by source domain. I also integrated the university's existing proxy services.
- **Observability.** Datadog monitoring, logging, error tracking and APM across the platform.
