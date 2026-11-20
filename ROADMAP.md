# Roadmap

What is decided and being built, by stage. Each stage ends with a tag and an entry in the [changelog](CHANGELOG.md).
Ideas still under discussion are in [PROPOSALS.md](PROPOSALS.md); the issue numbers refer to the
[original project](https://github.com/jerosoler/Drawflow).

Legend: `[ ]` planned · `[~]` in progress · `[x]` done in the stage

## Stage 1 - 0.3.0: project and documentation

- [~] Documentation split by subject: README as the entry page, [API reference](docs/API.md), [manual](docs/MANUAL.md),
  [architecture](ARCHITECTURE.md), changelog, roadmap and proposals
- [x] Build and tests with Docker Compose (`Dockerfile`, `docker-compose.yml`); the CI workflow is unchanged
- [~] Project metadata of the fork (`package.json` repository, issues and home page)
- [ ] Publish on npm under a scoped name, so that `npm i` installs this project
- [ ] Send the types to DefinitelyTyped (`@types/drawflow`), for users of the original (#640, #804)
- [ ] Pull requests of the `pr/*` branches opened in the fork, one subject each

## Stage 2 - 0.4.0: performance and ports

- [ ] **Faster import** of large flows (#927, #825, #879, #672)
- [ ] **Labels on inputs and outputs** (#785, #323)
- [ ] **Delete button position on touch screens** (#407, #801)
- [ ] **Context menu event on connections**, with the connection data (#858, #843)

## Stage 3 - 0.5.0: editing

- [ ] **Copy and paste** of the selected nodes (ideas from the brneas fork)
- [ ] **Theme generator** aware of the new classes and variables
- [ ] Reroute points from the dagre routes in `autoLayout`

## Later

- [ ] Review the remaining pull requests of the original: start a connection from an input (#925), node content as
  an element (#932), Vue props (#486), port data types (#448)
- [ ] **Real sub-flows**: ports mapped to inner start and end nodes, only if an application needs it
