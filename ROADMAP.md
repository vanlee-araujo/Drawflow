# Roadmap

What is decided and being built, by stage. Each stage ends with a tag and an entry in the [changelog](CHANGELOG.md), where the delivered stages are.
Ideas still under discussion are in [PROPOSALS.md](PROPOSALS.md); the issue numbers refer to the
[original project](https://github.com/jerosoler/Drawflow).

Legend: `[ ]` planned · `[~]` in progress · `[x]` done in the stage

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

- [ ] Publish on npm under a scoped name, so that `npm i` installs this project
- [ ] DefinitelyTyped: only what is missing for the original 0.0.60 (`removeConnection`, `createCurvature`,
  `removeListener`, `dispatch`, events `mouseUp` and `rerouteMoved`); the API of this project ships in `types/`
- [ ] Review the remaining pull requests of the original: start a connection from an input (#925), node content as
  an element (#932), Vue props (#486), port data types (#448)
- [ ] **Real sub-flows**: ports mapped to inner start and end nodes, only if an application needs it
