# Third-Party Notices

This file lists third-party software directly declared or used by Teddy Releaser.

Teddy Releaser itself is licensed under the GNU General Public License, version 3. See [`LICENSE`](./LICENSE).

This file is provided for attribution and notice purposes. Third-party software remains copyright of its respective authors and is licensed under its own terms.

## Direct npm Dependencies

These packages are declared directly in [`package.json`](./package.json).

| Package | Version | Used For | Copyright / Author | License | Project |
|---|---:|---|---|---|---|
| commander | 15.0.0 | CLI option parsing | TJ Holowaychuk | MIT | [github.com/tj/commander.js](https://github.com/tj/commander.js) |
| current-git-branch | 2.0.2 | Current Git branch detection for release validation | Jan Peer Stöcklmair | MIT | [github.com/JPeer264/node-current-git-branch](https://github.com/JPeer264/node-current-git-branch) |
| del | 8.0.1 | File and directory deletion | Sindre Sorhus | MIT | [github.com/sindresorhus/del](https://github.com/sindresorhus/del) |
| semver | 7.8.5 | Semantic version validation | GitHub Inc. | ISC | [github.com/npm/node-semver](https://github.com/npm/node-semver) |
| sha256-file | 1.0.0 | SHA-256 checksum generation for release archives | Souta Ozaki | MIT | [github.com/so-ta/sha256-file](https://github.com/so-ta/sha256-file) |
| vitest | 4.1.9 | Test runner | Anthony Fu and contributors | MIT | [vitest.dev](https://vitest.dev/) |
| winston | 3.19.0 | Logging | Charlie Robbins | MIT | [github.com/winstonjs/winston](https://github.com/winstonjs/winston) |
| winston-daily-rotate-file | 5.0.0 | Rotating file transport for Winston | Charlie Robbins | MIT | [github.com/winstonjs/winston-daily-rotate-file](https://github.com/winstonjs/winston-daily-rotate-file) |
| zip-a-folder | 6.1.1 | ZIP and TAR archive creation | Marius Augenstein | MIT | [github.com/maugenst/zip-a-folder](https://github.com/maugenst/zip-a-folder) |

## Transitive npm Dependencies

Teddy Releaser's direct npm dependencies may install additional transitive dependencies. The exact resolved dependency tree is recorded in [`package-lock.json`](./package-lock.json).

For release audits, regenerate a complete transitive dependency license report from the lockfile or installed `node_modules` tree before publishing a distribution package.

## License Texts

Teddy Releaser does not bundle third-party libraries directly in this repository. When dependencies are installed with npm, their license texts are available in the corresponding package directories under `node_modules/`.

## Notes

This notice file is not a replacement for the license texts of the third-party packages. If there is any inconsistency between this file and a third-party package's own license file or package metadata, the third-party package's own license terms control.
