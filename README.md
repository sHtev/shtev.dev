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
