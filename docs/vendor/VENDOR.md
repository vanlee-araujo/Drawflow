# Vendored libraries

Third-party files used only by the example pages (`index.html`, `docs/index.html`, `docs/playground.html`), kept in
the project so that the pages work without a CDN. The library itself (`dist/`) has no dependency.

| Library | Version | License | Origin | Files | SHA-256 |
|---|---|---|---|---|---|
| Font Awesome Free | 5.13.0 | Icons CC BY 4.0, fonts OFL 1.1, code MIT ([LICENSE.txt](fontawesome/LICENSE.txt)) | npm `@fortawesome/fontawesome-free` | `fontawesome/all.min.js` (SVG icons, no web fonts) | `2b36622b2d03598b27c0c17e5f50ef427810dbf17117b305dc57fbd97729b8fb` |
| SweetAlert2 | 9.17.4 | MIT ([LICENSE](sweetalert2/LICENSE)) | npm `sweetalert2` | `sweetalert2/sweetalert2.all.min.js` (with its CSS) | `1cea8f5e200fcfc0e1d1b0797151f138faa548d850f9dde66a43424eb93f9450` |
| Micromodal | 0.7.0 | ISC (declared in its `package.json`; the package has no license file) | npm `micromodal` | `micromodal/micromodal.min.js` | `ee64250ea37468c2f4e1c2904a660faf5e4ce19e5df2b1294af590fa58a1a095` |
| dagre | 1.1.4 | MIT ([LICENSE](dagre/LICENSE)) | npm `@dagrejs/dagre` | `dagre/dagre.min.js` | `2cde82baf0b9232c00aa13932945ff92a17fb08c6885a635592330a4c2c567c5` |
| Roboto (400, latin) | @fontsource/roboto 5.3.0 | OFL 1.1 ([LICENSE](roboto/LICENSE)) | npm `@fontsource/roboto` | `roboto/roboto.css`, `roboto/roboto-latin-400-normal.woff2`, `.woff` | `425c0713a8176f92273d378599c7eac57de7fafabd4bd0ed457b70eb8f80d371` (woff2) |

Notes:
- Font Awesome is the same file the pages loaded from cdnjs (its SRI hash
  `sha256-KzZiKy0DWYsnwMF+X1DvQngQ2/FxF7MF3Ff72XcpuPs=` matches). The SVG version draws the icons by itself, so the
  `all.min.css` and the web fonts are not needed.
- SweetAlert2 9.17.4 and Micromodal 0.7.0 are the versions the CDN links (`sweetalert2@9`, `micromodal` latest)
  resolved to on 2026-11-20.
- To update a library: download the package from npm, replace the files, and update this table.
