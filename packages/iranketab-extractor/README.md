# IranKetab extractor

Pure Node.js extraction package shared by the Ghafaseh Electron exporter and the future Qafaseh importer.

The package owns URL validation, injectable HTML fetching, HTML parsing, normalization, edition deduplication, cover-candidate discovery, the versioned extraction envelope, and structured extraction errors. It deliberately contains no Electron, filesystem-output, database, Next.js, React, or object-storage code.

## Local dependency strategy

Qafaseh consumes this package through `file:packages/iranketab-extractor`, while the Electron project uses the canonical repository path `file:../multi-project-deploy/ghafaseh/packages/iranketab-extractor`. The package remains inside Qafaseh's Git repository and Docker build context.

## Focused validation

```text
npm run typecheck
npm test
npm run build
```

Tests read the saved HTML fixtures under `fixtures/`; they never access the live IranKetab website.

