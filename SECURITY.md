# Security Policy

## Supported Versions

Teddy Releaser is currently pre-1.0 software. Security fixes are normally made
against the latest released version only.

| Version | Supported |
|---|---|
| Latest release | Yes |
| Older releases | No |

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, please use GitHub's **Private Vulnerability Reporting** feature:

1. Navigate to the **Security** tab of this repository.
2. Click on **Vulnerabilities** under the "Reporting" header.
3. Click **Report a vulnerability** to privately submit your report.

Please include as much detail as possible, including:

- the affected Teddy Releaser version or commit
- the affected file, command-line option, or release workflow step
- steps to reproduce the issue
- the expected and actual behavior
- the absolute path or repository layout used with `--repo`, if relevant
- any proof-of-concept command, `config/release.json` content, or generated artifact

## Scope

Security issues may include, but are not limited to:

- path traversal or unsafe filesystem operations when validating or packaging a Teddy repository
- unsafe deletion, copying, or archive creation under `working/`
- command injection or unsafe shell invocation when running `git`, `npm`, or `gh`
- release validation bypasses that allow dirty trees, invalid versions, or wrong branches to be packaged
- accidental inclusion of sensitive files in release archives
- dependency vulnerabilities that affect Teddy Releaser in practice

## Out of Scope

The following are usually out of scope:

- vulnerabilities in GitHub, Git, npm, or the GitHub CLI themselves
- issues caused by manually modified local release artifacts after they are generated
- denial-of-service reports that require unrealistic local access or intentionally malicious repository control
- vulnerabilities in the target Teddy repository unless Teddy Releaser mishandles that repository in a way that creates a releaser-specific security issue
- vulnerabilities in third-party dependencies that do not affect Teddy Releaser in practice

## Local Secrets and Sensitive Files

Teddy Releaser is intended to run locally on trusted development or release
machines. It may read local filesystem paths, inherit environment variables,
and use authenticated `gh` CLI credentials when `--github-draft-release` is used.

Do **not** commit the following to this repository:

- `.env` files or any file containing API tokens, passwords, or private keys
- `logs/` log files, which may contain absolute filesystem paths and command output
- `working/` release staging output, generated archives, or checksum files
- SSH private keys, GPG private keys, or exported GitHub tokens

These paths are listed in `.gitignore`, but they must also not be force-added
with `git add -f`.

If sensitive material is ever committed by mistake, rotate the affected
credentials immediately and remove the data from git history before continuing.

## Disclosure Process

After receiving a report, I will try to:

1. Acknowledge receipt within 28 days.
2. Investigate and confirm the issue.
3. Prepare a fix where appropriate.
4. Release the fix and document the impact.
5. Credit the reporter if requested.

Please allow reasonable time for investigation and remediation before public disclosure.
