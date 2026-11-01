# shtev.dev

Steve Gilroy's personal site: a retro terminal built with Astro, hosted on AWS (S3 + CloudFront), defined in Terraform and deployed by GitHub Actions.

- Design: `docs/superpowers/specs/2026-10-31-shtev-dev-design.md`
- Plan: `docs/superpowers/plans/2026-11-01-shtev-dev.md`

## Site

```sh
cd site
npm ci
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run test:e2e   # browser tests against the production build (Playwright)
npm run check      # type checks
```

## Infrastructure

All AWS resources are in Steve's personal account, defined in Terraform under `infra/`.
Use the personal SSO profiles only (never the Isotoma ones): `aws sso login --sso-session shtev`,
then `AWS_PROFILE=shtev` (read-only) or `AWS_PROFILE=shtev-admin`.

```sh
cd infra/main
cp terraform.tfvars.example terraform.tfvars   # set budget_email and contact_email (git-ignored)
(cd ../../lambda/contact && npm ci && npm run build)   # terraform zips lambda/contact/dist
AWS_PROFILE=shtev-admin terraform init && AWS_PROFILE=shtev-admin terraform plan
```

Linters: `tflint --recursive --config "$PWD/.tflint.hcl"` (from `infra/`),
`checkov -d infra --config-file infra/.checkov.yaml` (pip install checkov — skips are explained in that file),
`actionlint .github/workflows/*.yml`.

### One-off manual steps

- [x] Bootstrap state bucket (`infra/bootstrap`, applied by hand; its state lives in the bucket).
- [ ] Confirm the SNS email subscription (AWS emails a link to the contact address).
- [x] Upload the public CV: `AWS_PROFILE=shtev-admin PRIVATE_ASSETS_BUCKET=shtev-dev-private-REDACTED tools/upload-cv.sh ~/Documents/CVs/CV-I-2026-SWG-Web.pdf`
- [ ] GitHub repo `sHtev/shtev.dev`, with an environment `production` limited to the `main` branch,
      and secrets `TF_VAR_BUDGET_EMAIL` / `TF_VAR_CONTACT_EMAIL`.
- [ ] Go-live: content approved, then Porkbun nameservers → the Route 53 zone (`terraform output route53_nameservers`).

### Account check (2026-11-01, before the first apply)

No existing GitHub OIDC provider, budgets or anomaly monitors. Existing, untouched: Route 53 zone
`REDACTED.net`, one CloudFront distribution (REDACTED), seven S3 buckets, SNS topic `dynamodb`.
