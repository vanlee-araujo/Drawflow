# Security policy

## Supported versions

Only the latest release receives security fixes. See the [releases](https://github.com/vanlee-araujo/Drawflow/releases).

## Reporting a vulnerability

Please do not open a public issue. Report it privately on GitHub: **Security → Report a vulnerability** in this
repository. Include the version, the steps to reproduce and, if possible, a flow (JSON) or a page that shows the
problem.

You will get an answer within a few days. Once the fix is released, the report is published with credit to you,
unless you prefer otherwise.

## Scope

Drawflow runs in the browser of the application that uses it. The main risk is the HTML of nodes: it is written
into the page as HTML, so a flow from an untrusted source can carry scripts. Applications that import such flows
should set `sanitize_html` (see the [manual](docs/MANUAL.md#security-node-html)).

Vulnerabilities of the development tools (`devDependencies`) are tracked in [PROPOSALS.md](PROPOSALS.md) when
they do not reach the library.
