const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/focus.js', 'utf8');
const pureFunctions = source.slice(source.indexOf('  function getNForLevel('), source.indexOf('  function renderNBackFlow('));
const context = { module: { exports: {} } };
vm.runInNewContext(pureFunctions + '\nmodule.exports = { getNForLevel, getNBackConfig, ICONS_POOL: NBACK_ICONS, isStimulusEqual, isNBackGroupEqual, generateNBackSequence, generateNBackDistraction };', context);
module.exports = context.module.exports;
