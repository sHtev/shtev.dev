---
title: NHS Injectable Medicines Guide
summary: the guide every nurse checks before an injection, moved into the cloud
order: 3
draft: true
---

**The client.** The NHS Injectable Medicines Guide is a clinical reference used by healthcare professionals across the NHS.

**What I did.** At Isotoma, I looked after both the existing site and its replacement:

- **Lift and shift.** I moved the existing site from on-premises Windows servers to AWS, keeping IIS and SQL Server, on custom-built server images.
- **Keeping it updated.** I set up a development lifecycle and deployments for the existing development team, so they could keep the old site up to date while its replacement was built.
- **The new site.** I built the infrastructure for the replacement, a Django and Wagtail site running on Amazon ECS.
- **Switchover.** I facilitated testing of the new site and the switchover from the old one.
