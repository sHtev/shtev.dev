---
title: Defence intelligence APIs and pipelines
summary: an authentication and API layer, and deployment pipelines, for a defence intelligence provider
order: 5
draft: true
---

**The client.** A defence intelligence provider with established enterprise APIs, whose teams used Azure DevOps and deployed to AWS.

**What I did.** At Isotoma, I wrote the authentication and proxy APIs between the client's existing enterprise APIs and its new website, with more granular user access control than those APIs offered. The same layer was pitched to new customers as a replacement way to access them. I also built deployment pipelines connecting Azure DevOps to AWS, with the infrastructure defined in Terraform.
