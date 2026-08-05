import assert from 'node:assert/strict';
import test from 'node:test';

import {allFusionConfigurations, fusionExportPath} from '../src/configuration.mjs';
import {generateFusionExport} from '../src/fusion.mjs';
import {MARKERS as M, markerIdsInText} from '../src/protocol.mjs';

const matches = (exported, id, text) => exported.filters.find((filter) => {
  const javascriptPattern = filter.pattern.replace(/^\(\?s\)/, '');
  return filter.id === id && new RegExp(javascriptPattern, 'su').test(text);
});

test('generates 1200 uniquely addressed family-aware Fusion exports', () => {
  const configurations = allFusionConfigurations();
  assert.equal(configurations.length, 1200);
  assert.equal(new Set(configurations.map(fusionExportPath)).size, 1200);
});

test('uses compact source artwork only in supported Modern quality placements', () => {
  const base = {badgeFamily: 'modern', languageBadges: false, icon: 'colored', dolbyProfile: 'compact-separate', hdrPolicy: 'show-both', seadexMode: 'split'};
  const quality = generateFusionExport({...base, quality: 'source', sourceBadgeStyle: 'icon-only'});
  assert.match(quality.filters.find(({id}) => id === 'q-r').imageURL, /colored\/source-icons\/remux\.png$/);
  const percentages = generateFusionExport({...base, quality: 'percentages', sourceBadgeStyle: 'icon-only'});
  assert.match(percentages.filters.find(({id}) => id === 'q-w').imageURL, /colored\/source-icons\/web-dl\.png$/);
  const tiers = generateFusionExport({...base, quality: 'tiers', sourceBadgeStyle: 'icon-only'});
  assert.match(tiers.filters.find(({id}) => id === 'q-blu-u').imageURL, /mono\/source-icons\/blu-ray\.png$/);
  assert.doesNotMatch(tiers.filters.find(({id}) => id === 'q-blu-t1').imageURL, /source-icons/);
});

test('generates split, combined, and hidden SeaDex filters', () => {
  const base = {badgeFamily: 'modern', quality: 'tiers', sourceBadgeStyle: 'detailed', languageBadges: false, icon: 'colored', dolbyProfile: 'compact-separate', hdrPolicy: 'show-both'};
  const split = generateFusionExport({...base, seadexMode: 'split'});
  assert.deepEqual(split.filters.filter(({id}) => id.startsWith('v-seadex')).map(({id}) => id), ['v-seadex-best', 'v-seadex-alt']);
  const combined = generateFusionExport({...base, seadexMode: 'combined'});
  assert.deepEqual(combined.filters.filter(({id}) => id.startsWith('v-seadex')).map(({id}) => id), ['v-seadex']);
  assert.match(combined.filters.find(({id}) => id === 'v-seadex').imageURL, /quality\/colored\/sea-dex\.png$/);
  const off = generateFusionExport({...base, seadexMode: 'off'});
  assert.equal(off.filters.some(({id}) => id.startsWith('v-seadex')), false);
});

test('emits the required Fusion filter discriminator and enabled state', () => {
  for (const configuration of allFusionConfigurations()) {
    for (const filter of generateFusionExport(configuration).filters) {
      assert.equal(filter.type, 'filter', `${configuration.badgeFamily}: ${filter.id}`);
      assert.equal(filter.isEnabled, true, `${configuration.badgeFamily}: ${filter.id}`);
    }
  }
});

test('uses marker-only patterns and production badge URLs', () => {
  for (const configuration of allFusionConfigurations()) {
    const exported = generateFusionExport(configuration);
    assert.deepEqual(Object.keys(exported), ['filters', 'groups']);
    for (const filter of exported.filters) {
      assert(markerIdsInText(filter.pattern).length > 0, `${configuration.quality}: ${filter.id}`);
      assert.doesNotMatch(filter.pattern, /BluRay|WEB|Atmos|TrueHD|Asian|webrip/iu);
      if (filter.imageURL) {
        const familyPath = `/assets/badges/${configuration.badgeFamily}/`;
        const modernImaxFallback = configuration.badgeFamily === 'legacy' && ['v-imax', 'v-imax-enhanced'].includes(filter.id);
        if (modernImaxFallback) assert.match(filter.imageURL, /\/assets\/badges\/modern\/visual\/imax/);
        else assert(filter.imageURL.includes(familyPath), `${configuration.badgeFamily}: ${filter.id}`);
        assert.doesNotMatch(filter.imageURL, /coming-soon/iu);
      }
    }
  }
});

test('removes the complete language group when language badges are off', () => {
  const base = {quality: 'source', icon: 'colored', dolbyProfile: 'compact-separate', hdrPolicy: 'suppress-with-dv'};
  const off = generateFusionExport({...base, languageBadges: false});
  const on = generateFusionExport({...base, languageBadges: true});
  assert.equal(off.groups.some((group) => group.id === 'gl'), false);
  assert.equal(off.filters.some((filter) => filter.groupId === 'gl'), false);
  assert.equal(on.groups.some((group) => group.id === 'gl'), true);
  assert.equal(on.filters.filter((filter) => filter.groupId === 'gl').length, 29);
});

test('uses the curated language order with separate Portuguese flags and shared Multi Dual', () => {
  const exported = generateFusionExport({quality: 'source', languageBadges: true, icon: 'colored', dolbyProfile: 'compact-separate', hdrPolicy: 'show-both'});
  const languages = exported.filters.filter((filter) => filter.groupId === 'gl');
  assert.deepEqual(languages.map(({id}) => id), [
    'l-en', 'l-es', 'l-fr', 'l-de', 'l-it', 'l-pt', 'l-pt-br', 'l-ru', 'l-zh', 'l-ja',
    'l-ko', 'l-nl', 'l-sv', 'l-no', 'l-da', 'l-fi', 'l-pl', 'l-ar', 'l-hi', 'l-tr',
    'l-el', 'l-hu', 'l-cs', 'l-uk', 'l-ro', 'l-bg', 'l-vi', 'l-th', 'l-mu',
  ]);
  assert.deepEqual(languages.map(({name}) => name), [
    '🇬🇧', '🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇵🇹', '🇧🇷', '🇷🇺', '🇨🇳', '🇯🇵',
    '🇰🇷', '🇳🇱', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇸🇦', '🇮🇳', '🇹🇷',
    '🇬🇷', '🇭🇺', '🇨🇿', '🇺🇦', '🇷🇴', '🇧🇬', '🇻🇳', '🇹🇭', '🌐',
  ]);
  assert(matches(exported, 'l-pt', M.Portuguese));
  assert(!matches(exported, 'l-pt', M.PortugueseBrazil));
  assert(matches(exported, 'l-pt-br', M.PortugueseBrazil));
  assert(matches(exported, 'l-mu', M.MultiDual));
});

test('styles SeaDex Alt like Good and SeaDex Best like Best in both families', () => {
  for (const badgeFamily of ['modern', 'legacy']) {
    const exported = generateFusionExport({
      badgeFamily,
      quality: 'best-good-ok',
      languageBadges: false,
      icon: 'colored',
      dolbyProfile: 'compact-separate',
      hdrPolicy: 'show-both',
    });
    const styleOf = (id) => {
      const {borderColor, tagColor, textColor} = exported.filters.find((filter) => filter.id === id);
      return {borderColor, tagColor, textColor};
    };
    assert.deepEqual(styleOf('v-seadex-alt'), styleOf('q-gr'));
    assert.deepEqual(styleOf('v-seadex-best'), styleOf('q-br'));
  }
});

test('keeps the uniform historical tag presentation for every Legacy Mono filter', () => {
  const expected = {
    borderColor: '#2EFFFFFF',
    tagColor: '#22000000',
    textColor: '#FFFFFF',
    tagStyle: 'filled and bordered',
  };
  for (const configuration of allFusionConfigurations().filter(({badgeFamily, icon}) => badgeFamily === 'legacy' && icon === 'mono')) {
    for (const filter of generateFusionExport(configuration).filters) {
      assert.deepEqual(
        {
          borderColor: filter.borderColor,
          tagColor: filter.tagColor,
          textColor: filter.textColor,
          tagStyle: filter.tagStyle,
        },
        expected,
        `${configuration.quality}: ${filter.id}`,
      );
    }
  }
});

test('uses full Modern semantic strength only for Legacy Colored semantic pills', () => {
  const base = {
    badgeFamily: 'legacy',
    languageBadges: true,
    icon: 'colored',
    dolbyProfile: 'compact-separate',
    hdrPolicy: 'show-both',
  };
  const historical = {
    borderColor: '#2EFFFFFF',
    tagColor: '#22000000',
    textColor: '#FFFFFF',
    tagStyle: 'filled and bordered',
  };
  const styleOf = (exported, id) => {
    const {borderColor, tagColor, textColor, tagStyle} = exported.filters.find((filter) => filter.id === id);
    return {borderColor, tagColor, textColor, tagStyle};
  };

  const ranked = generateFusionExport({...base, quality: 'best-good-ok'});
  assert.deepEqual(styleOf(ranked, 'q-br'), {
    borderColor: '#FF00FF37', tagColor: '#E600E932', textColor: '#27C04F', tagStyle: 'filled and bordered',
  });
  assert.deepEqual(styleOf(ranked, 'q-gr'), {
    borderColor: '#FF2D9943', tagColor: '#3300E932', textColor: '#27C04F', tagStyle: 'filled and bordered',
  });
  assert.deepEqual(styleOf(ranked, 'v-seadex-best'), styleOf(ranked, 'q-br'));
  assert.deepEqual(styleOf(ranked, 'v-seadex-alt'), styleOf(ranked, 'q-gr'));
  for (const id of ['q-or', 'r-4k', 'v-h10', 'a-at', 'c-51', 'l-en']) {
    assert.deepEqual(styleOf(ranked, id), historical, id);
  }

  const tiers = generateFusionExport({...base, quality: 'tiers'});
  assert.deepEqual(styleOf(tiers, 'q-rmx-t1'), styleOf(ranked, 'q-br'));
  assert.deepEqual(styleOf(tiers, 'q-rmx-u'), historical);

  const source = generateFusionExport({...base, quality: 'source'});
  assert.deepEqual(styleOf(source, 'q-r'), styleOf(ranked, 'q-br'));

  const percentages = generateFusionExport({...base, quality: 'percentages'});
  assert.deepEqual(styleOf(percentages, 'pct-100'), {
    borderColor: '#6600E600', tagColor: '#3300E600', textColor: '#FF00E600', tagStyle: 'filled and bordered',
  });
});

test('uses historical Legacy group colors in the Fusion v2 schema', () => {
  const exported = generateFusionExport({
    badgeFamily: 'legacy',
    quality: 'percentages',
    languageBadges: true,
    icon: 'colored',
    dolbyProfile: 'compact-separate',
    hdrPolicy: 'show-both',
  });
  assert.deepEqual(
    Object.fromEntries(exported.groups.map(({id, color}) => [id, color])),
    {
      gp: '#96CEB4',
      gq: '#96CEB4',
      gr: '#4ECDC4',
      gv: '#FF6B6B',
      ga: '#45B7D1',
      gc: '#FFD700',
      gl: '#FFA07A',
    },
  );
  assert(exported.groups.every(({borderColor}) => borderColor === '#00000000'));
});

test('keeps Modern semantic presentation unchanged', () => {
  const exported = generateFusionExport({
    badgeFamily: 'modern',
    quality: 'best-good-ok',
    languageBadges: true,
    icon: 'colored',
    dolbyProfile: 'compact-separate',
    hdrPolicy: 'show-both',
  });
  const styleOf = (id) => {
    const {borderColor, tagColor, textColor, tagStyle} = exported.filters.find((filter) => filter.id === id);
    return {borderColor, tagColor, textColor, tagStyle};
  };
  assert.deepEqual(styleOf('q-br'), {
    borderColor: '#FF00FF37',
    tagColor: '#E600E932',
    textColor: '#27C04F',
    tagStyle: 'filled and bordered',
  });
  assert.deepEqual(styleOf('q-gr'), {
    borderColor: '#FF2D9943',
    tagColor: '#3300E932',
    textColor: '#27C04F',
    tagStyle: 'filled and bordered',
  });
  assert.deepEqual(styleOf('r-4k'), {
    borderColor: '#FF858283',
    tagColor: '#33FFFFFF',
    textColor: '#FFFFFF',
    tagStyle: 'filled and bordered',
  });
  assert.deepEqual(styleOf('l-en'), {
    borderColor: '#00000000',
    tagColor: '#00000000',
    textColor: '#80FFFFFF',
    tagStyle: 'filled and bordered',
  });
});

test('matches Best Good and OK only with their source marker', () => {
  const exported = generateFusionExport({quality: 'best-good-ok', languageBadges: false, icon: 'colored', dolbyProfile: 'compact-separate', hdrPolicy: 'show-both'});
  assert(matches(exported, 'q-br', M.Remux + M.Best));
  assert(!matches(exported, 'q-br', M.BluRay + M.Best));
  assert(matches(exported, 'q-gw', M.Web + M.Good));
  assert(matches(exported, 'q-ob', M.BluRay + M.OK));
});

test('matches exact percentages without prefix collisions', () => {
  const exported = generateFusionExport({quality: 'percentages', languageBadges: false, icon: 'mono', dolbyProfile: 'compact-separate', hdrPolicy: 'show-both'});
  const score = (value) => M.Score + String(value).split('').map((digit) => M[`Digit${digit}`]).join('');
  assert(matches(exported, 'pct-1', score(1)));
  assert(!matches(exported, 'pct-1', score(10)));
  assert(matches(exported, 'pct-100', score(100)));
});

test('matches the live colored percentage palette and keeps mono neutral', () => {
  const configuration = {quality: 'percentages', languageBadges: false, dolbyProfile: 'compact-separate', hdrPolicy: 'show-both'};
  const colored = generateFusionExport({...configuration, icon: 'colored'});
  const mono = generateFusionExport({...configuration, icon: 'mono'});
  const expected = {
    100: {borderColor: '#6600E600', tagColor: '#3300E600', textColor: '#FF00E600'},
    90: {borderColor: '#662EE600', tagColor: '#332EE600', textColor: '#FF2EE600'},
    50: {borderColor: '#66E6E600', tagColor: '#33E6E600', textColor: '#FFE6E600'},
    1: {borderColor: '#66E60500', tagColor: '#33E60500', textColor: '#FFE60500'},
  };

  for (const [score, style] of Object.entries(expected)) {
    const coloredFilter = colored.filters.find((filter) => filter.id === `pct-${score}`);
    const monoFilter = mono.filters.find((filter) => filter.id === `pct-${score}`);
    assert.deepEqual(
      {borderColor: coloredFilter.borderColor, tagColor: coloredFilter.tagColor, textColor: coloredFilter.textColor},
      style,
    );
    assert.deepEqual(
      {borderColor: monoFilter.borderColor, tagColor: monoFilter.tagColor, textColor: monoFilter.textColor},
      {borderColor: '#FF858283', tagColor: '#33FFFFFF', textColor: '#FFFFFF'},
    );
  }
});

test('implements compact detailed and combined Atmos carrier outcomes', () => {
  const configuration = {quality: 'source', languageBadges: false, icon: 'colored', hdrPolicy: 'show-both'};
  const compact = generateFusionExport({...configuration, dolbyProfile: 'compact-separate'});
  const detailed = generateFusionExport({...configuration, dolbyProfile: 'detailed-separate'});
  const combined = generateFusionExport({...configuration, dolbyProfile: 'audio-combined'});
  const stream = M.Atmos + M.TrueHD;

  assert(matches(compact, 'a-at', stream));
  assert(!matches(compact, 'a-th', stream));
  assert(matches(detailed, 'a-at', stream));
  assert(matches(detailed, 'a-th', stream));
  assert(matches(combined, 'a-th-at', stream));
  assert(!matches(combined, 'a-at', stream));
  assert(!matches(combined, 'a-th', stream));
});

test('supports both approved three-fact pairing outcomes with existing badges', () => {
  const configuration = {quality: 'source', languageBadges: false, icon: 'colored', hdrPolicy: 'show-both'};
  const audioFirst = generateFusionExport({...configuration, dolbyProfile: 'audio-combined'});
  const dvFirst = generateFusionExport({...configuration, dolbyProfile: 'audio-combined-dv-priority'});
  const stream = M.DV + M.Atmos + M.TrueHD;

  assert(matches(audioFirst, 'a-dv', stream));
  assert(matches(audioFirst, 'a-th-at', stream));
  assert(matches(dvFirst, 'a-at-dv', stream));
  assert(matches(dvFirst, 'a-th', stream));
});

test('keeps audio combinations stable when pairing priority is irrelevant', () => {
  const configuration = {quality: 'source', languageBadges: false, icon: 'colored', hdrPolicy: 'show-both'};
  const audioFirst = generateFusionExport({...configuration, dolbyProfile: 'audio-combined'});
  const dvFirst = generateFusionExport({...configuration, dolbyProfile: 'audio-combined-dv-priority'});

  for (const [stream, combinedId, separateIds] of [
    [M.Atmos + M.TrueHD, 'a-th-at', ['a-at', 'a-th']],
    [M.Atmos + M.DDPlus, 'a-dp-at', ['a-at', 'a-dp']],
  ]) {
    for (const exported of [audioFirst, dvFirst]) {
      assert(matches(exported, combinedId, stream));
      for (const id of separateIds) assert(!matches(exported, id, stream));
    }
  }
});

test('orders separate DV before a combined Atmos carrier badge', () => {
  const exported = generateFusionExport({
    quality: 'source', languageBadges: false, icon: 'colored', hdrPolicy: 'show-both', dolbyProfile: 'audio-combined',
  });
  const ids = exported.filters.map((filter) => filter.id);
  assert(ids.indexOf('a-dv') < ids.indexOf('a-th-at'));
  assert(ids.indexOf('a-dv') < ids.indexOf('a-dp-at'));
});

test('preserves HDR, IMAX, DTS, and channel hierarchy exclusions', () => {
  const configuration = {quality: 'source', languageBadges: false, icon: 'colored', dolbyProfile: 'compact-separate'};
  const suppress = generateFusionExport({...configuration, hdrPolicy: 'suppress-with-dv'});
  const both = generateFusionExport({...configuration, hdrPolicy: 'show-both'});
  assert(!matches(suppress, 'v-h10', M.HDR10 + M.DV));
  assert(matches(both, 'v-h10', M.HDR10 + M.DV));
  assert(!matches(both, 'v-imax', M.IMAX + M.IMAXEnhanced));
  assert(!matches(both, 'a-dts', M.DTS + M.DTSHD));
  assert(matches(both, 'v-sdr', M.SDR));
  assert(!matches(both, 'v-sdr', M.SDR + M.HDR));
  assert(!matches(both, 'v-sdr', M.SDR + M.DV));
  assert(matches(both, 'c-61', M.Channels61));
  assert(!matches(both, 'c-61', M.Channels61 + M.Channels71));
  assert(!matches(both, 'c-51', M.Channels51 + M.Channels61));
  assert(!matches(both, 'c-51', M.Channels51 + M.Channels71));
});

test('limits Legacy to standalone Dolby filters and Modern IMAX artwork', () => {
  for (const dolbyProfile of ['compact-separate', 'detailed-separate']) {
    const exported = generateFusionExport({
      badgeFamily: 'legacy',
      quality: 'source',
      languageBadges: false,
      icon: 'colored',
      dolbyProfile,
      hdrPolicy: 'show-both',
    });
    const combinedIds = new Set(['a-at-dv', 'a-th-dv', 'a-dp-dv', 'a-dd-dv', 'a-th-at', 'a-dp-at']);
    assert.equal(exported.filters.some((filter) => combinedIds.has(filter.id)), false);
    assert.match(exported.filters.find((filter) => filter.id === 'v-imax').imageURL, /\/modern\/visual\/imax\.png$/);
    assert.match(exported.filters.find((filter) => filter.id === 'v-imax-enhanced').imageURL, /\/modern\/visual\/imax-enhanced\.png$/);
    assert.match(exported.filters.find((filter) => filter.id === 'v-sdr').imageURL, /\/legacy\/visual\/sdr\.png$/);
    assert.match(exported.filters.find((filter) => filter.id === 'c-61').imageURL, /\/legacy\/channels\/6\.1\.png$/);
  }
});
