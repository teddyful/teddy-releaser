# Teddy Release Checklist

Use this checklist before creating and publishing a Teddy release.

## 1. Prepare the Teddy Repository

- [ ] Confirm the Teddy release version is correct in `package.json`.
- [ ] Confirm `package-lock.json` is in sync with `package.json`.
- [ ] Confirm `config/release.json` includes every file and directory that must
      be included in the release archive.
- [ ] Confirm `THIRD_PARTY_NOTICES.md` is up to date if dependencies, bundled
      browser libraries, or bundled fonts changed.
- [ ] Confirm `docs/UPGRADING.md` is up to date if upgrade behavior changed.
- [ ] Confirm any public documentation or README changes for the release are
      complete.

## 2. Prepare the Release Branch

- [ ] Create or check out a branch named `release-x.y.z`, for example
      `release-0.0.15`.
- [ ] Confirm the branch version matches `package.json`.
- [ ] Confirm the Teddy working tree is clean:

```bash
git status --short
```

- [ ] Commit, stash, or remove any local changes before building the release.

## 3. Validate Teddy Locally

From the Teddy repository root:

- [ ] Run the normal test suite:

```bash
npm test
```

- [ ] Run the upgrade test suite:

```bash
npm run test:upgrade
```

- [ ] Build the demo site:

```bash
npm run build:demo
```

## 4. Build the Release

From the `teddy-releaser` repository root:

```bash
npm run build -- --repo /absolute/path/to/teddy
```

The releaser will:

- validate the Teddy repository;
- verify the release branch/version contract;
- verify the Teddy working tree is clean;
- run `npm test`;
- run `npm run test:upgrade`;
- create `.tgz` and `.zip` archives;
- create a SHA-256 checksums file.

Expected output files:

```text
working/releases/<version>/teddy-<version>.tgz
working/releases/<version>/teddy-<version>.zip
working/releases/<version>/teddy-<version>-checksums.txt
```

## 5. Validate Release Artifacts

- [ ] Confirm both archives exist.
- [ ] Confirm the checksums file exists.
- [ ] Confirm the archive root contains Teddy files directly, for example:

```text
package.json
upgrade.js
config/release.json
system/
themes/
```

- [ ] Confirm the archive root does not contain an extra `teddy/` wrapper.
- [ ] Optionally extract the archive into a temporary directory and run:

```bash
npm install
npm test
npm run test:upgrade
```

## 6. Publish the GitHub Release

- [ ] Create a Git tag for the release version.
- [ ] Create or update the GitHub release notes.
- [ ] Upload the generated `.tgz` archive.
- [ ] Upload the generated `.zip` archive.
- [ ] Upload the generated checksums file.
- [ ] Confirm the uploaded asset filenames match the patterns expected by
      Teddy's `config/release.json`.

## 7. Post-Release Verification

- [ ] Test `npm run upgrade -- --dry-run` from a disposable Teddy installation.
- [ ] Test a real upgrade on a disposable Teddy installation or clone.
- [ ] Confirm the upgraded installation can run:

```bash
npm test
npm run test:upgrade
npm run build:demo
```

- [ ] Confirm backups are created under `working/upgrade/backups` during the
      upgrade test.

## Notes

- Do not publish a release if either Teddy test suite fails.
- Do not publish a release if the release archive shape does not match the
  upgrader expectation.
- Keep release backups until the release and upgrade path have been verified.
