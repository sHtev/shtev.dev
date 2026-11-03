# shtev.dev

Steve Gilroy's personal site: a retro terminal built with Astro, hosted on AWS (S3 + CloudFront), defined in Terraform and deployed by GitHub Actions.

## Site

```sh
cd site
npm ci
npm run dev        # local dev server
npm test           # unit tests (Vitest); private-term checks need tests/private-terms.txt (git-ignored)
npm run test:e2e   # browser tests against the production build (Playwright)
npm run check      # type checks
```

## Infrastructure

All AWS resources are in Steve's personal account, defined in Terraform under `infra/`.
Use the personal SSO profiles only: `aws sso login --sso-session shtev`,
then `AWS_PROFILE=shtev` (read-only) or `AWS_PROFILE=shtev-admin`.

```sh
cd infra/main
cp terraform.tfvars.example terraform.tfvars   # set budget_email and contact_email (git-ignored)
(cd ../../lambda/contact && npm ci && npm run build)   # terraform zips lambda/contact/dist
echo "bucket = \"shtev-dev-tfstate-<account id>\"" > ../backend.hcl   # git-ignored
AWS_PROFILE=shtev-admin terraform init -backend-config=../backend.hcl && AWS_PROFILE=shtev-admin terraform plan
```

Linters: `tflint --recursive --config "$PWD/.tflint.hcl"` (from `infra/`),
`checkov -d infra --config-file infra/.checkov.yaml` (pip install checkov — skips are explained in that file),
`actionlint .github/workflows/*.yml`.

### One-off manual steps

- [x] Bootstrap state bucket (`infra/bootstrap`, applied by hand; its state lives in the bucket).
- [ ] Confirm the SNS email subscription (AWS emails a link to the contact address).
- [x] Upload the public CV: `AWS_PROFILE=shtev-admin PRIVATE_ASSETS_BUCKET=$(terraform -chdir=infra/main output -raw private_assets_bucket) tools/upload-cv.sh ~/Documents/CVs/CV-I-2026-SWG-Web.pdf`
- [ ] GitHub repo `sHtev/shtev.dev`, with an environment `production` limited to the `main` branch,
      and repo secrets `AWS_ACCOUNT_ID`, `TF_VAR_BUDGET_EMAIL` and `TF_VAR_CONTACT_EMAIL`.
- [ ] Go-live: content approved, then Porkbun nameservers → the Route 53 zone (`terraform output route53_nameservers`).
