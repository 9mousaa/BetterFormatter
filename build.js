#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const PROJECT_ROOT = __dirname;

function optionValue(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

async function modules() {
  const [configuration, fusion, formatters, protocol] = await Promise.all([
    import('./src/configuration.mjs'),
    import('./src/fusion.mjs'),
    import('./src/formatters.mjs'),
    import('./src/protocol.mjs'),
  ]);
  return {configuration, fusion, formatters, protocol};
}

async function buildExports({
  outputRoot = PROJECT_ROOT,
  assetBase,
} = {}) {
  const {configuration, fusion, formatters, protocol} = await modules();
  const selectedAssetBase = assetBase || fusion.DEFAULT_ASSET_BASE;
  const exportsRoot = path.join(outputRoot, 'exports');
  fs.rmSync(exportsRoot, {recursive: true, force: true});

  const fusionConfigurations = configuration.allFusionConfigurations();
  for (const config of fusionConfigurations) {
    const relativePath = configuration.fusionExportPath(config);
    const destination = path.join(outputRoot, relativePath);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, protocol.stringifyExport(fusion.generateFusionExport(config, {assetBase: selectedAssetBase})));
  }

  const formatterConfigurations = configuration.allFormatterConfigurations();
  for (const config of formatterConfigurations) {
    const relativePath = configuration.formatterExportPath(config);
    const destination = path.join(outputRoot, relativePath);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, protocol.stringifyExport(formatters.generateFormatter(config)));
  }

  return {fusion: fusionConfigurations.length, aiostreams: formatterConfigurations.length};
}

async function main(argv = process.argv.slice(2)) {
  const outputRoot = path.resolve(optionValue(argv, '--output') || PROJECT_ROOT);
  const assetBase = optionValue(argv, '--asset-base');
  const result = await buildExports({outputRoot, assetBase});
  process.stdout.write(`Generated ${result.fusion} Fusion exports and ${result.aiostreams} AIOStreams formatters.\n`);
}

module.exports = {buildExports, main};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
