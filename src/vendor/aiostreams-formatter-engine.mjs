/** AIOStreams formatter engine 2.32.0, commit 57f5a3e323dd491d93af704594ac9e3d04b039d6. Bundled and browser-adapted for BetterFormatter from Viren070/AIOStreams. */

// packages/core/src/formatters/engine/ast.ts
function rawText(text) {
  return { kind: "raw", text };
}

// packages/core/src/formatters/engine/fields.ts
var FIELD_REGISTRY = {
  config: ["addonName"],
  stream: [
    "filename",
    "folderName",
    "size",
    "bitrate",
    "folderSize",
    "library",
    "quality",
    "resolution",
    "subbed",
    "dubbed",
    "languages",
    "uLanguages",
    "subtitles",
    "uSubtitles",
    "languageEmojis",
    "uLanguageEmojis",
    "subtitleEmojis",
    "uSubtitleEmojis",
    "languageCodes",
    "uLanguageCodes",
    "subtitleCodes",
    "uSubtitleCodes",
    "smallLanguageCodes",
    "uSmallLanguageCodes",
    "smallSubtitleCodes",
    "uSmallSubtitleCodes",
    "wedontknowwhatakilometeris",
    "uWedontknowwhatakilometeris",
    "visualTags",
    "audioTags",
    "releaseGroup",
    "regexMatched",
    "rankedRegexMatched",
    "regexScore",
    "nRegexScore",
    "encode",
    "audioChannels",
    "edition",
    "editions",
    "remastered",
    "regraded",
    "repack",
    "proper",
    "uncensored",
    "unrated",
    "upscaled",
    "hasChapters",
    "network",
    "container",
    "extension",
    "indexer",
    "year",
    "title",
    "country",
    "episodeTitle",
    "date",
    "folderSeasons",
    "formattedFolderSeasons",
    "seasons",
    "season",
    "formattedSeasons",
    "episodes",
    "episode",
    "formattedEpisodes",
    "folderEpisodes",
    "formattedFolderEpisodes",
    "seasonEpisode",
    "seasonPack",
    "seeders",
    "private",
    "freeleech",
    "age",
    "ageHours",
    "duration",
    "infoHash",
    "type",
    "message",
    "proxied",
    "seadex",
    "seadexBest",
    "seScore",
    "nSeScore",
    "seMatched",
    "rseMatched",
    "preloading",
    "idMatched"
  ],
  metadata: [
    "queryType",
    "type",
    "isAnime",
    "title",
    "titles",
    "year",
    "yearEnd",
    "runtime",
    "episodeRuntime",
    "genres",
    "originalLanguage",
    "country",
    "season",
    "episode",
    "absoluteEpisode",
    "relativeAbsoluteEpisode",
    "episodeTitle",
    "episodeTitles",
    "latestSeason",
    "daysSinceRelease",
    "daysSinceFirstAired",
    "daysSinceLastAired",
    "hasNextEpisode",
    "daysUntilNextEpisode",
    "anilistId",
    "malId",
    "hasSeaDex"
  ],
  service: ["id", "shortName", "name", "cached"],
  addon: ["name", "presetId", "manifestUrl"],
  debug: ["json", "jsonf"]
};
var CANONICAL_FIELDS = new Map(
  Object.entries(FIELD_REGISTRY).flatMap(
    ([section, properties]) => properties.map(
      (property) => [`${section}.${property}`.toLowerCase(), [section, property]]
    )
  )
);
function canonicaliseField(section, property) {
  return CANONICAL_FIELDS.get(`${section}.${property}`.toLowerCase());
}
var PROPERTY_INDEX = (() => {
  const index = /* @__PURE__ */ new Map();
  for (const [section, properties] of Object.entries(FIELD_REGISTRY)) {
    for (const property of properties) {
      const key = property.toLowerCase();
      const existing = index.get(key);
      if (existing) existing.push(`${section}.${property}`);
      else index.set(key, [`${section}.${property}`]);
    }
  }
  return index;
})();
function distanceAtMost(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return void 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      best = Math.min(best, current[j]);
    }
    if (best > max) return void 0;
    previous = current;
  }
  const distance = previous[b.length];
  return distance <= max ? distance : void 0;
}
function budget(word) {
  return Math.min(2, Math.floor(word.length / 3));
}
function nearestName(word, candidates) {
  return nearest(word, candidates)[0];
}
function nearest(word, candidates) {
  const max = budget(word);
  if (max < 1) return [];
  const lower = word.toLowerCase();
  let best = max + 1;
  let matches = [];
  for (const candidate of candidates) {
    const distance = distanceAtMost(lower, candidate.toLowerCase(), max);
    if (distance === void 0 || distance > best) continue;
    if (distance < best) {
      best = distance;
      matches = [];
    }
    matches.push(candidate);
  }
  return matches;
}
function suggestField(section, property) {
  const elsewhere = PROPERTY_INDEX.get(property.toLowerCase());
  if (elsewhere) return [...elsewhere];
  const sections = Object.keys(FIELD_REGISTRY);
  const canonicalSection = sections.find(
    (name) => name.toLowerCase() === section.toLowerCase()
  );
  if (canonicalSection) {
    const properties = FIELD_REGISTRY[canonicalSection];
    return nearest(property, properties).map(
      (name) => `${canonicalSection}.${name}`
    );
  }
  return nearest(section, sections).map((name) => canonicaliseField(name, property)).filter((field) => field !== void 0).map(([s, p]) => `${s}.${p}`);
}

// packages/core/src/formatters/utils.ts
function formatBytes(bytes, k, round = false) {
  if (bytes === 0) return "0 B";
  const sizes = k === 1024 ? ["B", "KiB", "MiB", "GiB", "TiB"] : ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  let value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  if (round) {
    value = Math.round(value);
  }
  return value + " " + sizes[i];
}
function formatSmartBytes(bytes, k) {
  if (bytes === 0) return "0 B";
  const sizes = k === 1024 ? ["B", "KiB", "MiB", "GiB", "TiB"] : ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const rawValue = bytes / Math.pow(k, i);
  const integerPart = Math.floor(rawValue);
  let value;
  let formattedValue;
  if (integerPart >= 100) {
    value = Math.round(rawValue);
    formattedValue = value.toString();
  } else if (integerPart >= 10) {
    value = parseFloat(rawValue.toFixed(1));
    formattedValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  } else {
    value = parseFloat(rawValue.toFixed(2));
    formattedValue = value.toString();
  }
  return formattedValue + " " + sizes[i];
}
function formatBitrate(bitrate, round = false) {
  if (!Number.isFinite(bitrate) || bitrate <= 0) return "0 bps";
  const k = 1e3;
  const sizes = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  const i = Math.min(
    sizes.length - 1,
    Math.max(0, Math.floor(Math.log(bitrate) / Math.log(k)))
  );
  let value = bitrate / Math.pow(k, i);
  value = round ? Math.round(value) : parseFloat(value.toFixed(2));
  return `${value} ${sizes[i]}`;
}
function formatSmartBitrate(bitrate) {
  if (!Number.isFinite(bitrate) || bitrate <= 0) return "0 bps";
  const k = 1e3;
  const sizes = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  const i = Math.min(
    sizes.length - 1,
    Math.max(0, Math.floor(Math.log(bitrate) / Math.log(k)))
  );
  const rawValue = bitrate / Math.pow(k, i);
  const integerPart = Math.floor(rawValue);
  let value;
  let formattedValue;
  if (integerPart >= 100) {
    value = Math.round(rawValue);
    formattedValue = value.toString();
  } else if (integerPart >= 10) {
    value = parseFloat(rawValue.toFixed(1));
    formattedValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  } else {
    value = parseFloat(rawValue.toFixed(2));
    formattedValue = value.toString();
  }
  return `${formattedValue} ${sizes[i]}`;
}
function formatDuration(durationInMs) {
  const seconds = Math.floor(durationInMs / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const formattedSeconds = seconds % 60;
  const formattedMinutes = minutes % 60;
  if (hours > 0) {
    return `${hours}h:${formattedMinutes}m:${formattedSeconds}s`;
  } else if (formattedSeconds > 0) {
    return `${formattedMinutes}m:${formattedSeconds}s`;
  } else {
    return `${formattedMinutes}m`;
  }
}
function renderPattern(pattern, resolve) {
  const stack = [{ text: "", zero: true, sawToken: false }];
  const closeGroup = () => {
    const group = stack.pop();
    const parent = stack[stack.length - 1];
    if (!group.sawToken || !group.zero) {
      parent.text += group.text;
      parent.sawToken ||= group.sawToken;
      if (!group.zero) parent.zero = false;
    }
  };
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const top = stack[stack.length - 1];
    if (char === "%") {
      const next = pattern[i + 1];
      if (next === void 0) {
        top.text += "%";
        break;
      }
      if (next === "%" || next === "[" || next === "]") {
        top.text += next;
        i += 1;
        continue;
      }
      const token = next === "-" ? pattern.slice(i + 1, i + 3) : next;
      const resolved = resolve(token);
      if (resolved === void 0) {
        top.text += `%${token}`;
      } else {
        top.text += resolved.text;
        top.sawToken = true;
        if (!resolved.zero) top.zero = false;
      }
      i += token.length;
      continue;
    }
    if (char === "[") {
      stack.push({ text: "", zero: true, sawToken: false });
      continue;
    }
    if (char === "]" && stack.length > 1) {
      closeGroup();
      continue;
    }
    top.text += char;
  }
  while (stack.length > 1) closeGroup();
  return stack[0].text;
}
var DURATION_UNITS = ["H", "M", "S"];
function normaliseDuration(duration) {
  if (duration < 0) {
    return 0;
  }
  if (duration < 1e3) {
    return duration * 60 * 1e3;
  }
  return duration;
}
function formatDurationPattern(durationInMs, pattern) {
  const units = /* @__PURE__ */ new Set();
  renderPattern(pattern, (token) => {
    const unit = token.startsWith("-") ? token.slice(1) : token;
    if (!DURATION_UNITS.includes(unit)) {
      return void 0;
    }
    units.add(unit);
    return { text: "" };
  });
  const totalSeconds = Math.max(0, Math.floor(durationInMs / 1e3));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const values = {
    H: Math.floor(totalSeconds / 3600),
    M: units.has("H") ? totalMinutes % 60 : totalMinutes,
    S: units.has("H") || units.has("M") ? totalSeconds % 60 : totalSeconds
  };
  return renderPattern(pattern, (token) => {
    const padded = !token.startsWith("-");
    const value = values[padded ? token : token.slice(1)];
    if (value === void 0) return void 0;
    return {
      text: padded ? String(value).padStart(2, "0") : String(value),
      zero: value === 0
    };
  });
}
var MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
var DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
function ordinalise(day) {
  const teens = day % 100;
  if (teens >= 11 && teens <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
function formatDatePattern(value, pattern) {
  const parts = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value.trim());
  if (!parts) return value;
  const [year, month, day] = [
    Number(parts[1]),
    Number(parts[2]) - 1,
    Number(parts[3])
  ];
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return value;
  }
  const tokens = {
    Y: String(year),
    y: String(year % 100).padStart(2, "0"),
    m: String(month + 1).padStart(2, "0"),
    "-m": String(month + 1),
    d: String(day).padStart(2, "0"),
    "-d": String(day),
    o: ordinalise(day),
    B: MONTH_NAMES[month],
    b: MONTH_NAMES[month].slice(0, 3),
    A: DAY_NAMES[date.getUTCDay()],
    a: DAY_NAMES[date.getUTCDay()].slice(0, 3)
  };
  return renderPattern(
    pattern,
    (token) => tokens[token] !== void 0 ? { text: tokens[token] } : void 0
  );
}
function makeSmall(code) {
  return code.split("").map((char) => SMALL_CAPS_MAP[char.toUpperCase()] || char).join("");
}
var SMALL_CAPS_MAP = {
  A: "\u1D00",
  // U+1D00
  B: "\u0299",
  // U+0299
  C: "\u1D04",
  // U+1D04
  D: "\u1D05",
  // U+1D05
  E: "\u1D07",
  // U+1D07
  F: "\u0493",
  // U+0493
  G: "\u0262",
  // U+0262
  H: "\u029C",
  // U+029C
  I: "\u026A",
  // U+026A
  J: "\u1D0A",
  // U+1D0A
  K: "\u1D0B",
  // U+1D0B
  L: "\u029F",
  // U+029F
  M: "\u1D0D",
  // U+1D0D
  N: "\u0274",
  // U+0274
  O: "\u1D0F",
  // U+1D0F
  P: "\u1D18",
  // U+1D18
  Q: "\u01EB",
  // U+01EB
  R: "\u0280",
  // U+0280
  S: "\uA731",
  // U+A731
  T: "\u1D1B",
  // U+1D1B
  U: "\u1D1C",
  // U+1D1C
  V: "\u1D20",
  // U+1D20
  W: "\u1D21",
  // U+1D21
  // There is no widely supported small-cap X; fall back to "x".
  X: "x",
  Y: "\u028F",
  // U+028F
  Z: "\u1D22"
  // U+1D22
};

// packages/core/src/utils/language-list.ts
var FULL_LANGUAGE_MAPPING = [
  // A
  {
    iso_639_1: "aa",
    iso_639_2: "aar",
    iso_3166_1: "ET",
    flag: "\u{1F1EA}\u{1F1F9}",
    english_name: "Afar",
    name: "Qaf\xE1r af"
  },
  {
    iso_639_1: "ab",
    iso_639_2: "abk",
    iso_3166_1: "GE",
    flag: "\u{1F1EC}\u{1F1EA}",
    english_name: "Abkhazian",
    name: "\u0410\u04A7\u0441\u0443\u0430 \u0431\u044B\u0437\u0448\u04D9\u0430"
  },
  {
    iso_639_1: "ae",
    iso_639_2: "ave",
    iso_3166_1: "IR",
    flag: "\u{1F1EE}\u{1F1F7}",
    english_name: "Avestan",
    name: "Avesta"
  },
  {
    iso_639_1: "af",
    iso_639_2: "afr",
    iso_3166_1: "ZA",
    flag: "\u{1F1FF}\u{1F1E6}",
    english_name: "Afrikaans",
    name: "Afrikaans"
  },
  {
    iso_639_1: "ak",
    iso_639_2: "aka",
    iso_3166_1: "GH",
    flag: "\u{1F1EC}\u{1F1ED}",
    english_name: "Akan",
    name: "Akan"
  },
  {
    iso_639_1: "am",
    iso_639_2: "amh",
    iso_3166_1: "ET",
    flag: "\u{1F1EA}\u{1F1F9}",
    english_name: "Amharic",
    name: "\u12A0\u121B\u122D\u129B"
  },
  {
    iso_639_1: "an",
    iso_639_2: "arg",
    iso_3166_1: "ES",
    flag: "\u{1F1EA}\u{1F1F8}",
    english_name: "Aragonese",
    name: "Aragon\xE9s"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "SA",
    flag: "\u{1F1F8}\u{1F1E6}",
    flag_priority: true,
    english_name: "Arabic",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "AE",
    flag: "\u{1F1E6}\u{1F1EA}",
    english_name: "Arabic (UAE)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "EG",
    flag: "\u{1F1EA}\u{1F1EC}",
    english_name: "Arabic (Egypt)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "as",
    iso_639_2: "asm",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Assamese",
    name: "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE"
  },
  {
    iso_639_1: "av",
    iso_639_2: "ava",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Avaric",
    name: "\u0410\u0432\u0430\u0440 \u043C\u0430\u0446\u04C0"
  },
  {
    iso_639_1: "ay",
    iso_639_2: "aym",
    iso_3166_1: "BO",
    flag: "\u{1F1E7}\u{1F1F4}",
    english_name: "Aymara",
    name: "Aymar aru"
  },
  {
    iso_639_1: "az",
    iso_639_2: "aze",
    iso_3166_1: "AZ",
    flag: "\u{1F1E6}\u{1F1FF}",
    english_name: "Azerbaijani",
    name: "Az\u0259rbaycan"
  },
  // B
  {
    iso_639_1: "ba",
    iso_639_2: "bak",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Bashkir",
    name: "\u0411\u0430\u0448\u04A1\u043E\u0440\u0442 \u0442\u0435\u043B\u0435"
  },
  {
    iso_639_1: "be",
    iso_639_2: "bel",
    iso_3166_1: "BY",
    flag: "\u{1F1E7}\u{1F1FE}",
    english_name: "Belarusian",
    name: "\u0411\u0435\u043B\u0430\u0440\u0443\u0441\u043A\u0430\u044F \u043C\u043E\u0432\u0430"
  },
  {
    iso_639_1: "bg",
    iso_639_2: "bul",
    iso_3166_1: "BG",
    flag: "\u{1F1E7}\u{1F1EC}",
    english_name: "Bulgarian",
    name: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438 \u0435\u0437\u0438\u043A"
  },
  {
    iso_639_1: "bi",
    iso_639_2: "bis",
    iso_3166_1: "VU",
    flag: "\u{1F1FB}\u{1F1FA}",
    english_name: "Bislama",
    name: "Bislama"
  },
  {
    iso_639_1: "bm",
    iso_639_2: "bam",
    iso_3166_1: "ML",
    flag: "\u{1F1F2}\u{1F1F1}",
    english_name: "Bambara",
    name: "Bamanankan"
  },
  {
    iso_639_1: "bn",
    iso_639_2: "ben",
    iso_3166_1: "BD",
    flag: "\u{1F1E7}\u{1F1E9}",
    flag_priority: true,
    english_name: "Bengali",
    name: "\u09AC\u09BE\u0982\u09B2\u09BE"
  },
  {
    iso_639_1: "bo",
    iso_639_2: "bod",
    iso_3166_1: "CN",
    flag: "\u{1F1E8}\u{1F1F3}",
    english_name: "Tibetan",
    name: "\u0F56\u0F7C\u0F51\u0F0B\u0F61\u0F72\u0F42"
  },
  {
    iso_639_1: "br",
    iso_639_2: "bre",
    iso_3166_1: "FR",
    flag: "\u{1F1EB}\u{1F1F7}",
    english_name: "Breton",
    name: "Brezhoneg"
  },
  {
    iso_639_1: "bs",
    iso_639_2: "bos",
    iso_3166_1: "BA",
    flag: "\u{1F1E7}\u{1F1E6}",
    english_name: "Bosnian",
    name: "Bosanski"
  },
  // C
  {
    iso_639_1: "ca",
    iso_639_2: "cat",
    iso_3166_1: "ES",
    flag: "\u{1F1EA}\u{1F1F8}",
    english_name: "Catalan",
    name: "Catal\xE0"
  },
  {
    iso_639_1: "ce",
    iso_639_2: "che",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Chechen",
    name: "\u041D\u043E\u0445\u0447\u0438\u0439\u043D \u043C\u043E\u0442\u0442"
  },
  {
    iso_639_1: "ch",
    iso_639_2: "cha",
    iso_3166_1: "MP",
    flag: "\u{1F1F2}\u{1F1F5}",
    english_name: "Chamorro",
    name: "Finu' Chamorro"
  },
  {
    iso_639_1: "co",
    iso_639_2: "cos",
    iso_3166_1: "FR",
    flag: "\u{1F1EB}\u{1F1F7}",
    english_name: "Corsican",
    name: "Corsu"
  },
  {
    iso_639_1: "cr",
    iso_639_2: "cre",
    iso_3166_1: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    english_name: "Cree",
    name: "\u14C0\u1426\u1403\u152D\u140D\u140F\u1423"
  },
  {
    iso_639_1: "cs",
    iso_639_2: "ces",
    iso_3166_1: "CZ",
    flag: "\u{1F1E8}\u{1F1FF}",
    english_name: "Czech",
    name: "\u010Cesk\xFD"
  },
  {
    iso_639_1: "cu",
    iso_639_2: "chu",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Church Slavic",
    name: "\u0421\u043B\u043E\u0432\u0463\u043D\u044C\u0441\u043A\u044A"
  },
  {
    iso_639_1: "cv",
    iso_639_2: "chv",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Chuvash",
    name: "\u0427\u04D1\u0432\u0430\u0448 \u0447\u04D7\u043B\u0445\u0438"
  },
  {
    iso_639_1: "cy",
    iso_639_2: "cym",
    iso_3166_1: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    english_name: "Welsh",
    name: "Cymraeg"
  },
  // D
  {
    iso_639_1: "da",
    iso_639_2: "dan",
    iso_3166_1: "DK",
    flag: "\u{1F1E9}\u{1F1F0}",
    flag_priority: true,
    english_name: "Danish",
    name: "Dansk"
  },
  {
    iso_639_1: "de",
    iso_639_2: "deu",
    iso_3166_1: "DE",
    flag: "\u{1F1E9}\u{1F1EA}",
    flag_priority: true,
    english_name: "German",
    name: "Deutsch"
  },
  {
    iso_639_1: "dv",
    iso_639_2: "div",
    iso_3166_1: "MV",
    flag: "\u{1F1F2}\u{1F1FB}",
    english_name: "Divehi",
    name: "\u078B\u07A8\u0788\u07AC\u0780\u07A8"
  },
  {
    iso_639_1: "dz",
    iso_639_2: "dzo",
    iso_3166_1: "BT",
    flag: "\u{1F1E7}\u{1F1F9}",
    english_name: "Dzongkha",
    name: "\u0F62\u0FAB\u0F7C\u0F44\u0F0B\u0F41"
  },
  // E
  {
    iso_639_1: "ee",
    iso_639_2: "ewe",
    iso_3166_1: "GH",
    flag: "\u{1F1EC}\u{1F1ED}",
    english_name: "Ewe",
    name: "\xC8\u028Begbe"
  },
  {
    iso_639_1: "el",
    iso_639_2: "ell",
    iso_3166_1: "GR",
    flag: "\u{1F1EC}\u{1F1F7}",
    english_name: "Greek",
    name: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC"
  },
  {
    iso_639_1: "en",
    iso_639_2: "eng",
    iso_3166_1: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    flag_priority: true,
    english_name: "English (UK)",
    name: "English"
  },
  {
    iso_639_1: "en",
    iso_639_2: "eng",
    iso_3166_1: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    english_name: "English (US)",
    name: "English"
  },
  {
    iso_639_1: "en",
    iso_639_2: "eng",
    iso_3166_1: "AU",
    flag: "\u{1F1E6}\u{1F1FA}",
    english_name: "English (Australia)",
    name: "English"
  },
  {
    iso_639_1: "en",
    iso_639_2: "eng",
    iso_3166_1: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    english_name: "English (Canada)",
    name: "English"
  },
  {
    iso_639_1: "en",
    iso_639_2: "eng",
    iso_3166_1: "IE",
    flag: "\u{1F1EE}\u{1F1EA}",
    english_name: "English (Ireland)",
    name: "English"
  },
  {
    iso_639_1: "en",
    iso_639_2: "eng",
    iso_3166_1: "NZ",
    flag: "\u{1F1F3}\u{1F1FF}",
    english_name: "English (New Zealand)",
    name: "English"
  },
  {
    iso_639_1: "eo",
    iso_639_2: "epo",
    iso_3166_1: null,
    flag: "\u{1F310}",
    english_name: "Esperanto",
    name: "Esperanto"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "ES",
    flag: "\u{1F1EA}\u{1F1F8}",
    flag_priority: true,
    english_name: "Spanish",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "et",
    iso_639_2: "est",
    iso_3166_1: "EE",
    flag: "\u{1F1EA}\u{1F1EA}",
    english_name: "Estonian",
    name: "Eesti"
  },
  {
    iso_639_1: "eu",
    iso_639_2: "eus",
    iso_3166_1: "ES",
    flag: "\u{1F3F4}",
    english_name: "Basque",
    name: "Euskera"
  },
  // F
  {
    iso_639_1: "fa",
    iso_639_2: "fas",
    iso_3166_1: "IR",
    flag: "\u{1F1EE}\u{1F1F7}",
    english_name: "Persian",
    name: "\u0641\u0627\u0631\u0633\u06CC"
  },
  {
    iso_639_1: "ff",
    iso_639_2: "ful",
    iso_3166_1: "SN",
    flag: "\u{1F1F8}\u{1F1F3}",
    english_name: "Fulah",
    name: "Fulfulde"
  },
  {
    iso_639_1: "fi",
    iso_639_2: "fin",
    iso_3166_1: "FI",
    flag: "\u{1F1EB}\u{1F1EE}",
    english_name: "Finnish",
    name: "Suomi"
  },
  {
    iso_639_1: "fj",
    iso_639_2: "fij",
    iso_3166_1: "FJ",
    flag: "\u{1F1EB}\u{1F1EF}",
    english_name: "Fijian",
    name: "Vosa Vakaviti"
  },
  {
    iso_639_1: "fo",
    iso_639_2: "fao",
    iso_3166_1: "FO",
    flag: "\u{1F1EB}\u{1F1F4}",
    english_name: "Faroese",
    name: "F\xF8royskt"
  },
  {
    iso_639_1: "fr",
    iso_639_2: "fra",
    iso_3166_1: "FR",
    flag: "\u{1F1EB}\u{1F1F7}",
    flag_priority: true,
    english_name: "French",
    name: "Fran\xE7ais"
  },
  {
    iso_639_1: "fy",
    iso_639_2: "fry",
    iso_3166_1: "NL",
    flag: "\u{1F1F3}\u{1F1F1}",
    english_name: "Western Frisian",
    name: "Frysk"
  },
  // G
  {
    iso_639_1: "ga",
    iso_639_2: "gle",
    iso_3166_1: "IE",
    flag: "\u{1F1EE}\u{1F1EA}",
    english_name: "Irish",
    name: "Gaeilge"
  },
  {
    iso_639_1: "gd",
    iso_639_2: "gla",
    iso_3166_1: "GB",
    flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    english_name: "Scottish Gaelic",
    name: "G\xE0idhlig"
  },
  {
    iso_639_1: "gl",
    iso_639_2: "glg",
    iso_3166_1: "ES",
    flag: "\u{1F1EA}\u{1F1F8}",
    english_name: "Galician",
    name: "Galego"
  },
  {
    iso_639_1: "gn",
    iso_639_2: "grn",
    iso_3166_1: "PY",
    flag: "\u{1F1F5}\u{1F1FE}",
    english_name: "Guarani",
    name: "Ava\xF1e'\u1EBD"
  },
  {
    iso_639_1: "gu",
    iso_639_2: "guj",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Gujarati",
    name: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0"
  },
  {
    iso_639_1: "gv",
    iso_639_2: "glv",
    iso_3166_1: "IM",
    flag: "\u{1F1EE}\u{1F1F2}",
    english_name: "Manx",
    name: "Gaelg"
  },
  // H
  {
    iso_639_1: "ha",
    iso_639_2: "hau",
    iso_3166_1: "NG",
    flag: "\u{1F1F3}\u{1F1EC}",
    english_name: "Hausa",
    name: "Hausa"
  },
  {
    iso_639_1: "he",
    iso_639_2: "heb",
    iso_3166_1: "IL",
    flag: "\u{1F1EE}\u{1F1F1}",
    flag_priority: true,
    english_name: "Hebrew",
    name: "\u05E2\u05B4\u05D1\u05B0\u05E8\u05B4\u05D9\u05EA"
  },
  {
    iso_639_1: "hi",
    iso_639_2: "hin",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    flag_priority: true,
    english_name: "Hindi",
    name: "\u0939\u093F\u0928\u094D\u0926\u0940"
  },
  {
    iso_639_1: "ho",
    iso_639_2: "hmo",
    iso_3166_1: "PG",
    flag: "\u{1F1F5}\u{1F1EC}",
    english_name: "Hiri Motu",
    name: "Hiri Motu"
  },
  {
    iso_639_1: "hr",
    iso_639_2: "hrv",
    iso_3166_1: "HR",
    flag: "\u{1F1ED}\u{1F1F7}",
    english_name: "Croatian",
    name: "Hrvatski"
  },
  {
    iso_639_1: "ht",
    iso_639_2: "hat",
    iso_3166_1: "HT",
    flag: "\u{1F1ED}\u{1F1F9}",
    english_name: "Haitian; Haitian Creole",
    name: "Krey\xF2l ayisyen"
  },
  {
    iso_639_1: "hu",
    iso_639_2: "hun",
    iso_3166_1: "HU",
    flag: "\u{1F1ED}\u{1F1FA}",
    english_name: "Hungarian",
    name: "Magyar"
  },
  {
    iso_639_1: "hy",
    iso_639_2: "hye",
    iso_3166_1: "AM",
    flag: "\u{1F1E6}\u{1F1F2}",
    english_name: "Armenian",
    name: "\u0540\u0561\u0575\u0565\u0580\u0565\u0576"
  },
  {
    iso_639_1: "hz",
    iso_639_2: "her",
    iso_3166_1: "NA",
    flag: "\u{1F1F3}\u{1F1E6}",
    english_name: "Herero",
    name: "Otjiherero"
  },
  // I
  {
    iso_639_1: "ia",
    iso_639_2: "ina",
    iso_3166_1: null,
    flag: "\u{1F310}",
    english_name: "Interlingua",
    name: "Interlingua"
  },
  {
    iso_639_1: "id",
    iso_639_2: "ind",
    iso_3166_1: "ID",
    flag: "\u{1F1EE}\u{1F1E9}",
    flag_priority: true,
    english_name: "Indonesian",
    name: "Bahasa Indonesia"
  },
  {
    iso_639_1: "ie",
    iso_639_2: "ile",
    iso_3166_1: null,
    flag: "\u{1F310}",
    english_name: "Interlingue",
    name: "Interlingue"
  },
  {
    iso_639_1: "ig",
    iso_639_2: "ibo",
    iso_3166_1: "NG",
    flag: "\u{1F1F3}\u{1F1EC}",
    english_name: "Igbo",
    name: "As\u1EE5s\u1EE5 Igbo"
  },
  {
    iso_639_1: "ii",
    iso_639_2: "iii",
    iso_3166_1: "CN",
    flag: "\u{1F1E8}\u{1F1F3}",
    english_name: "Sichuan Yi; Nuosu",
    name: "\uA188\uA320\uA259"
  },
  {
    iso_639_1: "ik",
    iso_639_2: "ipk",
    iso_3166_1: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    english_name: "Inupiaq",
    name: "I\xF1upiaq"
  },
  {
    iso_639_1: "io",
    iso_639_2: "ido",
    iso_3166_1: null,
    flag: "\u{1F310}",
    english_name: "Ido",
    name: "Ido"
  },
  {
    iso_639_1: "is",
    iso_639_2: "isl",
    iso_3166_1: "IS",
    flag: "\u{1F1EE}\u{1F1F8}",
    english_name: "Icelandic",
    name: "\xCDslenska"
  },
  {
    iso_639_1: "it",
    iso_639_2: "ita",
    iso_3166_1: "IT",
    flag: "\u{1F1EE}\u{1F1F9}",
    flag_priority: true,
    english_name: "Italian",
    name: "Italiano"
  },
  {
    iso_639_1: "iu",
    iso_639_2: "iku",
    iso_3166_1: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    english_name: "Inuktitut",
    name: "\u1403\u14C4\u1483\u144E\u1450\u1466"
  },
  // J
  {
    iso_639_1: "ja",
    iso_639_2: "jpn",
    iso_3166_1: "JP",
    flag: "\u{1F1EF}\u{1F1F5}",
    english_name: "Japanese",
    name: "\u65E5\u672C\u8A9E"
  },
  {
    iso_639_1: "jv",
    iso_639_2: "jav",
    iso_3166_1: "ID",
    flag: "\u{1F1EE}\u{1F1E9}",
    english_name: "Javanese",
    name: "Basa Jawa"
  },
  // K
  {
    iso_639_1: "ka",
    iso_639_2: "kat",
    iso_3166_1: "GE",
    flag: "\u{1F1EC}\u{1F1EA}",
    english_name: "Georgian",
    name: "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8"
  },
  {
    iso_639_1: "kg",
    iso_639_2: "kon",
    iso_3166_1: "CD",
    flag: "\u{1F1E8}\u{1F1E9}",
    english_name: "Kongo",
    name: "KiKongo"
  },
  {
    iso_639_1: "ki",
    iso_639_2: "kik",
    iso_3166_1: "KE",
    flag: "\u{1F1F0}\u{1F1EA}",
    english_name: "Kikuyu; Gikuyu",
    name: "G\u0129k\u0169y\u0169"
  },
  {
    iso_639_1: "kj",
    iso_639_2: "kua",
    iso_3166_1: "AO",
    flag: "\u{1F1E6}\u{1F1F4}",
    english_name: "Kuanyama; Kwanyama",
    name: "Kuanyama"
  },
  {
    iso_639_1: "kk",
    iso_639_2: "kaz",
    iso_3166_1: "KZ",
    flag: "\u{1F1F0}\u{1F1FF}",
    english_name: "Kazakh",
    name: "\u049A\u0430\u0437\u0430\u049B"
  },
  {
    iso_639_1: "kl",
    iso_639_2: "kal",
    iso_3166_1: "GL",
    flag: "\u{1F1EC}\u{1F1F1}",
    english_name: "Kalaallisut; Greenlandic",
    name: "Kalaallisut"
  },
  {
    iso_639_1: "km",
    iso_639_2: "khm",
    iso_3166_1: "KH",
    flag: "\u{1F1F0}\u{1F1ED}",
    english_name: "Central Khmer",
    name: "\u1797\u17B6\u179F\u17B6\u1781\u17D2\u1798\u17C2\u179A"
  },
  {
    iso_639_1: "kn",
    iso_639_2: "kan",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Kannada",
    name: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1"
  },
  {
    iso_639_1: "ko",
    iso_639_2: "kor",
    iso_3166_1: "KR",
    flag: "\u{1F1F0}\u{1F1F7}",
    english_name: "Korean",
    name: "\uD55C\uAD6D\uC5B4/\uC870\uC120\uB9D0"
  },
  {
    iso_639_1: "kr",
    iso_639_2: "kau",
    iso_3166_1: "NE",
    flag: "\u{1F1F3}\u{1F1EA}",
    english_name: "Kanuri",
    name: "Kanuri"
  },
  {
    iso_639_1: "ks",
    iso_639_2: "kas",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Kashmiri",
    name: "\u0915\u0936\u094D\u092E\u0940\u0930\u0940"
  },
  {
    iso_639_1: "ku",
    iso_639_2: "kur",
    iso_3166_1: "TR",
    flag: "\u{1F1F9}\u{1F1F7}",
    english_name: "Kurdish",
    name: "Kurd\xEE"
  },
  {
    iso_639_1: "kv",
    iso_639_2: "kom",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Komi",
    name: "\u041A\u043E\u043C\u0438 \u043A\u044B\u0432"
  },
  {
    iso_639_1: "kw",
    iso_639_2: "cor",
    iso_3166_1: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    english_name: "Cornish",
    name: "Kernewek"
  },
  {
    iso_639_1: "ky",
    iso_639_2: "kir",
    iso_3166_1: "KG",
    flag: "\u{1F1F0}\u{1F1EC}",
    english_name: "Kirghiz; Kyrgyz",
    name: "\u041A\u044B\u0440\u0433\u044B\u0437\u0447\u0430"
  },
  // L
  {
    iso_639_1: "la",
    iso_639_2: "lat",
    iso_3166_1: "VA",
    flag: "\u{1F1FB}\u{1F1E6}",
    english_name: "Latin",
    name: "Latine"
  },
  {
    iso_639_1: "lb",
    iso_639_2: "ltz",
    iso_3166_1: "LU",
    flag: "\u{1F1F1}\u{1F1FA}",
    english_name: "Luxembourgish; Letzeburgesch",
    name: "L\xEBtzebuergesch"
  },
  {
    iso_639_1: "lg",
    iso_639_2: "lug",
    iso_3166_1: "UG",
    flag: "\u{1F1FA}\u{1F1EC}",
    english_name: "Ganda",
    name: "Luganda"
  },
  {
    iso_639_1: "li",
    iso_639_2: "lim",
    iso_3166_1: "NL",
    flag: "\u{1F1F3}\u{1F1F1}",
    english_name: "Limburgan; Limburger; Limburgish",
    name: "Limburgs"
  },
  {
    iso_639_1: "ln",
    iso_639_2: "lin",
    iso_3166_1: "CD",
    flag: "\u{1F1E8}\u{1F1E9}",
    english_name: "Lingala",
    name: "Ling\xE1la"
  },
  {
    iso_639_1: "lo",
    iso_639_2: "lao",
    iso_3166_1: "LA",
    flag: "\u{1F1F1}\u{1F1E6}",
    english_name: "Lao",
    name: "\u0E9E\u0EB2\u0EAA\u0EB2\u0EA5\u0EB2\u0EA7"
  },
  {
    iso_639_1: "lt",
    iso_639_2: "lit",
    iso_3166_1: "LT",
    flag: "\u{1F1F1}\u{1F1F9}",
    english_name: "Lithuanian",
    name: "Lietuvi\u0173"
  },
  {
    iso_639_1: "lu",
    iso_639_2: "lub",
    iso_3166_1: "CD",
    flag: "\u{1F1E8}\u{1F1E9}",
    english_name: "Luba-Katanga",
    name: "Tshiluba"
  },
  {
    iso_639_1: "lv",
    iso_639_2: "lav",
    iso_3166_1: "LV",
    flag: "\u{1F1F1}\u{1F1FB}",
    english_name: "Latvian",
    name: "Latvie\u0161u"
  },
  // M
  {
    iso_639_1: "mg",
    iso_639_2: "mlg",
    iso_3166_1: "MG",
    flag: "\u{1F1F2}\u{1F1EC}",
    english_name: "Malagasy",
    name: "Malagasy"
  },
  {
    iso_639_1: "mh",
    iso_639_2: "mah",
    iso_3166_1: "MH",
    flag: "\u{1F1F2}\u{1F1ED}",
    english_name: "Marshallese",
    name: "Kajin M\u0327aje\u013C"
  },
  {
    iso_639_1: "mi",
    iso_639_2: "mri",
    iso_3166_1: "NZ",
    flag: "\u{1F1F3}\u{1F1FF}",
    english_name: "Maori",
    name: "Te Reo M\u0101ori"
  },
  {
    iso_639_1: "mk",
    iso_639_2: "mkd",
    iso_3166_1: "MK",
    flag: "\u{1F1F2}\u{1F1F0}",
    english_name: "Macedonian",
    name: "\u041C\u0430\u043A\u0435\u0434\u043E\u043D\u0441\u043A\u0438 \u0458\u0430\u0437\u0438\u043A"
  },
  {
    iso_639_1: "ml",
    iso_639_2: "mal",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Malayalam",
    name: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02"
  },
  {
    iso_639_1: "mn",
    iso_639_2: "mon",
    iso_3166_1: "MN",
    flag: "\u{1F1F2}\u{1F1F3}",
    english_name: "Mongolian",
    name: "\u041C\u043E\u043D\u0433\u043E\u043B"
  },
  {
    iso_639_1: "mr",
    iso_639_2: "mar",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Marathi",
    name: "\u092E\u0930\u093E\u0920\u0940"
  },
  {
    iso_639_1: "ms",
    iso_639_2: "msa",
    iso_3166_1: "MY",
    flag: "\u{1F1F2}\u{1F1FE}",
    english_name: "Malay",
    name: "Bahasa Melayu"
  },
  {
    iso_639_1: "mt",
    iso_639_2: "mlt",
    iso_3166_1: "MT",
    flag: "\u{1F1F2}\u{1F1F9}",
    english_name: "Maltese",
    name: "Malti"
  },
  {
    iso_639_1: "my",
    iso_639_2: "mya",
    iso_3166_1: "MM",
    flag: "\u{1F1F2}\u{1F1F2}",
    english_name: "Burmese",
    name: "\u1017\u1019\u102C\u1005\u102C"
  },
  // N
  {
    iso_639_1: "na",
    iso_639_2: "nau",
    iso_3166_1: "NR",
    flag: "\u{1F1F3}\u{1F1F7}",
    english_name: "Nauru",
    name: "Dorerin Naoero"
  },
  {
    iso_639_1: "nb",
    iso_639_2: "nob",
    iso_3166_1: "NO",
    flag: "\u{1F1F3}\u{1F1F4}",
    english_name: "Bokm\xE5l, Norwegian; Norwegian Bokm\xE5l",
    name: "Bokm\xE5l"
  },
  {
    iso_639_1: "nd",
    iso_639_2: "nde",
    iso_3166_1: "ZW",
    flag: "\u{1F1FF}\u{1F1FC}",
    english_name: "Ndebele, North; North Ndebele",
    name: "IsiNdebele"
  },
  {
    iso_639_1: "ne",
    iso_639_2: "nep",
    iso_3166_1: "NP",
    flag: "\u{1F1F3}\u{1F1F5}",
    english_name: "Nepali",
    name: "\u0928\u0947\u092A\u093E\u0932\u0940"
  },
  {
    iso_639_1: "ng",
    iso_639_2: "ndo",
    iso_3166_1: "NA",
    flag: "\u{1F1F3}\u{1F1E6}",
    english_name: "Ndonga",
    name: "Owambo"
  },
  {
    iso_639_1: "nl",
    iso_639_2: "nld",
    iso_3166_1: "NL",
    flag: "\u{1F1F3}\u{1F1F1}",
    flag_priority: true,
    english_name: "Dutch; Flemish",
    name: "Nederlands"
  },
  {
    iso_639_1: "nn",
    iso_639_2: "nno",
    iso_3166_1: "NO",
    flag: "\u{1F1F3}\u{1F1F4}",
    english_name: "Norwegian Nynorsk; Nynorsk, Norwegian",
    name: "Nynorsk"
  },
  {
    iso_639_1: "no",
    iso_639_2: "nor",
    iso_3166_1: "NO",
    flag: "\u{1F1F3}\u{1F1F4}",
    flag_priority: true,
    english_name: "Norwegian",
    name: "Norsk"
  },
  {
    iso_639_1: "nr",
    iso_639_2: "nbl",
    iso_3166_1: "ZA",
    flag: "\u{1F1FF}\u{1F1E6}",
    english_name: "Ndebele, South; South Ndebele",
    name: "IsiNdebele"
  },
  {
    iso_639_1: "nv",
    iso_639_2: "nav",
    iso_3166_1: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    english_name: "Navajo; Navaho",
    name: "Din\xE9 bizaad"
  },
  {
    iso_639_1: "ny",
    iso_639_2: "nya",
    iso_3166_1: "MW",
    flag: "\u{1F1F2}\u{1F1FC}",
    english_name: "Chichewa; Chewa; Nyanja",
    name: "ChiChe\u0175a"
  },
  // O
  {
    iso_639_1: "oc",
    iso_639_2: "oci",
    iso_3166_1: "FR",
    flag: "\u{1F1EB}\u{1F1F7}",
    english_name: "Occitan (post 1500)",
    name: "Occitan"
  },
  {
    iso_639_1: "oj",
    iso_639_2: "oji",
    iso_3166_1: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    english_name: "Ojibwa",
    name: "\u140A\u14C2\u1511\u14C8\u142F\u14A7\u140E\u14D0"
  },
  {
    iso_639_1: "om",
    iso_639_2: "orm",
    iso_3166_1: "ET",
    flag: "\u{1F1EA}\u{1F1F9}",
    english_name: "Oromo",
    name: "Afaan Oromoo"
  },
  {
    iso_639_1: "or",
    iso_639_2: "ori",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Oriya",
    name: "\u0B13\u0B21\u0B3C\u0B3F\u0B06"
  },
  {
    iso_639_1: "os",
    iso_639_2: "oss",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Ossetian; Ossetic",
    name: "\u0418\u0440\u043E\u043D \xE6\u0432\u0437\u0430\u0433"
  },
  // P
  {
    iso_639_1: "pa",
    iso_639_2: "pan",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Panjabi; Punjabi",
    name: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40"
  },
  {
    iso_639_1: "pi",
    iso_639_2: "pli",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Pali",
    name: "\u092A\u093E\u0934\u093F"
  },
  {
    iso_639_1: "pl",
    iso_639_2: "pol",
    iso_3166_1: "PL",
    flag: "\u{1F1F5}\u{1F1F1}",
    english_name: "Polish",
    name: "Polski"
  },
  {
    iso_639_1: "ps",
    iso_639_2: "pus",
    iso_3166_1: "AF",
    flag: "\u{1F1E6}\u{1F1EB}",
    english_name: "Pushto; Pashto",
    name: "\u067E\u069A\u062A\u0648"
  },
  {
    iso_639_1: "pt",
    iso_639_2: "por",
    iso_3166_1: "PT",
    flag: "\u{1F1F5}\u{1F1F9}",
    flag_priority: true,
    english_name: "Portuguese",
    name: "Portugu\xEAs"
  },
  {
    iso_639_1: "pt",
    iso_639_2: "por",
    iso_3166_1: "BR",
    flag: "\u{1F1E7}\u{1F1F7}",
    english_name: "Portuguese (Brazil)",
    internal_english_name: "Portuguese (Brazil)",
    name: "Portugu\xEAs"
  },
  // Q
  {
    iso_639_1: "qu",
    iso_639_2: "que",
    iso_3166_1: "PE",
    flag: "\u{1F1F5}\u{1F1EA}",
    english_name: "Quechua",
    name: "Runa Simi"
  },
  // R
  {
    iso_639_1: "rm",
    iso_639_2: "roh",
    iso_3166_1: "CH",
    flag: "\u{1F1E8}\u{1F1ED}",
    english_name: "Romansh",
    name: "Rumantsch grischun"
  },
  {
    iso_639_1: "rn",
    iso_639_2: "run",
    iso_3166_1: "BI",
    flag: "\u{1F1E7}\u{1F1EE}",
    english_name: "Rundi",
    name: "Kirundi"
  },
  {
    iso_639_1: "ro",
    iso_639_2: "ron",
    iso_3166_1: "RO",
    flag: "\u{1F1F7}\u{1F1F4}",
    english_name: "Romanian",
    name: "Rom\xE2n\u0103"
  },
  {
    iso_639_1: "ru",
    iso_639_2: "rus",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    flag_priority: true,
    english_name: "Russian",
    name: "P\u0443\u0441\u0441\u043A\u0438\u0439"
  },
  {
    iso_639_1: "rw",
    iso_639_2: "kin",
    iso_3166_1: "RW",
    flag: "\u{1F1F7}\u{1F1FC}",
    english_name: "Kinyarwanda",
    name: "Ikinyarwanda"
  },
  // S
  {
    iso_639_1: "sa",
    iso_639_2: "san",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Sanskrit",
    name: "\u0938\u0902\u0938\u094D\u0915\u0943\u0924\u092E\u094D"
  },
  {
    iso_639_1: "sc",
    iso_639_2: "srd",
    iso_3166_1: "IT",
    flag: "\u{1F1EE}\u{1F1F9}",
    english_name: "Sardinian",
    name: "Sardu"
  },
  {
    iso_639_1: "sd",
    iso_639_2: "snd",
    iso_3166_1: "PK",
    flag: "\u{1F1F5}\u{1F1F0}",
    english_name: "Sindhi",
    name: "\u0938\u093F\u0928\u094D\u0927\u0940"
  },
  {
    iso_639_1: "se",
    iso_639_2: "sme",
    iso_3166_1: "NO",
    flag: "\u{1F1F3}\u{1F1F4}",
    english_name: "Northern Sami",
    name: "Davvis\xE1megiella"
  },
  {
    iso_639_1: "sg",
    iso_639_2: "sag",
    iso_3166_1: "CF",
    flag: "\u{1F1E8}\u{1F1EB}",
    english_name: "Sango",
    name: "Y\xE2ng\xE2 t\xEE s\xE4ng\xF6"
  },
  {
    iso_639_1: "sh",
    iso_639_2: "hbs",
    iso_3166_1: "RS",
    flag: "\u{1F1F7}\u{1F1F8}",
    english_name: "Serbo-Croatian",
    name: "Srpskohrvatski"
  },
  {
    iso_639_1: "si",
    iso_639_2: "sin",
    iso_3166_1: "LK",
    flag: "\u{1F1F1}\u{1F1F0}",
    english_name: "Sinhala; Sinhalese",
    name: "\u0DC3\u0DD2\u0D82\u0DC4\u0DBD"
  },
  {
    iso_639_1: "sk",
    iso_639_2: "slk",
    iso_3166_1: "SK",
    flag: "\u{1F1F8}\u{1F1F0}",
    flag_priority: true,
    english_name: "Slovak",
    name: "Sloven\u010Dina"
  },
  {
    iso_639_1: "sl",
    iso_639_2: "slv",
    iso_3166_1: "SI",
    flag: "\u{1F1F8}\u{1F1EE}",
    english_name: "Slovenian",
    name: "Sloven\u0161\u010Dina"
  },
  {
    iso_639_1: "sm",
    iso_639_2: "smo",
    iso_3166_1: "WS",
    flag: "\u{1F1FC}\u{1F1F8}",
    english_name: "Samoan",
    name: "Gagana fa'a Samoa"
  },
  {
    iso_639_1: "sn",
    iso_639_2: "sna",
    iso_3166_1: "ZW",
    flag: "\u{1F1FF}\u{1F1FC}",
    english_name: "Shona",
    name: "ChiShona"
  },
  {
    iso_639_1: "so",
    iso_639_2: "som",
    iso_3166_1: "SO",
    flag: "\u{1F1F8}\u{1F1F4}",
    english_name: "Somali",
    name: "Af Soomaali"
  },
  {
    iso_639_1: "sq",
    iso_639_2: "sqi",
    iso_3166_1: "AL",
    flag: "\u{1F1E6}\u{1F1F1}",
    english_name: "Albanian",
    name: "Shqip"
  },
  {
    iso_639_1: "sr",
    iso_639_2: "srp",
    iso_3166_1: "RS",
    flag: "\u{1F1F7}\u{1F1F8}",
    flag_priority: true,
    english_name: "Serbian",
    name: "Srpski"
  },
  {
    iso_639_1: "ss",
    iso_639_2: "ssw",
    iso_3166_1: "SZ",
    flag: "\u{1F1F8}\u{1F1FF}",
    english_name: "Swati",
    name: "SiSwati"
  },
  {
    iso_639_1: "st",
    iso_639_2: "sot",
    iso_3166_1: "LS",
    flag: "\u{1F1F1}\u{1F1F8}",
    english_name: "Sotho, Southern",
    name: "Sesotho"
  },
  {
    iso_639_1: "su",
    iso_639_2: "sun",
    iso_3166_1: "ID",
    flag: "\u{1F1EE}\u{1F1E9}",
    english_name: "Sundanese",
    name: "Basa Sunda"
  },
  {
    iso_639_1: "sv",
    iso_639_2: "swe",
    iso_3166_1: "SE",
    flag: "\u{1F1F8}\u{1F1EA}",
    english_name: "Swedish",
    name: "Svenska"
  },
  {
    iso_639_1: "sw",
    iso_639_2: "swa",
    iso_3166_1: "KE",
    flag: "\u{1F1F0}\u{1F1EA}",
    english_name: "Swahili",
    name: "Kiswahili"
  },
  // T
  {
    iso_639_1: "ta",
    iso_639_2: "tam",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Tamil",
    name: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD"
  },
  {
    iso_639_1: "te",
    iso_639_2: "tel",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Telugu",
    name: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41"
  },
  {
    iso_639_1: "tg",
    iso_639_2: "tgk",
    iso_3166_1: "TJ",
    flag: "\u{1F1F9}\u{1F1EF}",
    english_name: "Tajik",
    name: "\u0442\u043E\u04B7\u0438\u043A\u04E3"
  },
  {
    iso_639_1: "th",
    iso_639_2: "tha",
    iso_3166_1: "TH",
    flag: "\u{1F1F9}\u{1F1ED}",
    english_name: "Thai",
    name: "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22"
  },
  {
    iso_639_1: "ti",
    iso_639_2: "tir",
    iso_3166_1: "ER",
    flag: "\u{1F1EA}\u{1F1F7}",
    english_name: "Tigrinya",
    name: "\u1275\u130D\u122D\u129B"
  },
  {
    iso_639_1: "tk",
    iso_639_2: "tuk",
    iso_3166_1: "TM",
    flag: "\u{1F1F9}\u{1F1F2}",
    english_name: "Turkmen",
    name: "T\xFCrkmen"
  },
  {
    iso_639_1: "tl",
    iso_639_2: "tgl",
    iso_3166_1: "PH",
    flag: "\u{1F1F5}\u{1F1ED}",
    english_name: "Tagalog",
    name: "Wikang Tagalog"
  },
  {
    iso_639_1: "tn",
    iso_639_2: "tsn",
    iso_3166_1: "BW",
    flag: "\u{1F1E7}\u{1F1FC}",
    english_name: "Tswana",
    name: "Setswana"
  },
  {
    iso_639_1: "to",
    iso_639_2: "ton",
    iso_3166_1: "TO",
    flag: "\u{1F1F9}\u{1F1F4}",
    english_name: "Tonga (Tonga Islands)",
    name: "Faka Tonga"
  },
  {
    iso_639_1: "tr",
    iso_639_2: "tur",
    iso_3166_1: "TR",
    flag: "\u{1F1F9}\u{1F1F7}",
    english_name: "Turkish",
    name: "T\xFCrk\xE7e"
  },
  {
    iso_639_1: "ts",
    iso_639_2: "tso",
    iso_3166_1: "ZA",
    flag: "\u{1F1FF}\u{1F1E6}",
    english_name: "Tsonga",
    name: "Xitsonga"
  },
  {
    iso_639_1: "tt",
    iso_639_2: "tat",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Tatar",
    name: "\u0422\u0430\u0442\u0430\u0440 \u0442\u0435\u043B\u0435"
  },
  {
    iso_639_1: "tw",
    iso_639_2: "twi",
    iso_3166_1: "GH",
    flag: "\u{1F1EC}\u{1F1ED}",
    english_name: "Twi",
    name: "Twi"
  },
  {
    iso_639_1: "ty",
    iso_639_2: "tah",
    iso_3166_1: "PF",
    flag: "\u{1F1F5}\u{1F1EB}",
    english_name: "Tahitian",
    name: "Reo Tahiti"
  },
  // U
  {
    iso_639_1: "ug",
    iso_639_2: "uig",
    iso_3166_1: "CN",
    flag: "\u{1F1E8}\u{1F1F3}",
    english_name: "Uighur; Uyghur",
    name: "Uy\u01A3urq\u0259"
  },
  {
    iso_639_1: "uk",
    iso_639_2: "ukr",
    iso_3166_1: "UA",
    flag: "\u{1F1FA}\u{1F1E6}",
    english_name: "Ukrainian",
    name: "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0438\u0439"
  },
  {
    iso_639_1: "ur",
    iso_639_2: "urd",
    iso_3166_1: "PK",
    flag: "\u{1F1F5}\u{1F1F0}",
    english_name: "Urdu",
    name: "\u0627\u0631\u062F\u0648"
  },
  {
    iso_639_1: "uz",
    iso_639_2: "uzb",
    iso_3166_1: "UZ",
    flag: "\u{1F1FA}\u{1F1FF}",
    english_name: "Uzbek",
    name: "O\u02BBzbek"
  },
  // V
  {
    iso_639_1: "ve",
    iso_639_2: "ven",
    iso_3166_1: "ZA",
    flag: "\u{1F1FF}\u{1F1E6}",
    english_name: "Venda",
    name: "Tshiven\u1E13a"
  },
  {
    iso_639_1: "vi",
    iso_639_2: "vie",
    iso_3166_1: "VN",
    flag: "\u{1F1FB}\u{1F1F3}",
    english_name: "Vietnamese",
    name: "Ti\u1EBFng Vi\u1EC7t"
  },
  {
    iso_639_1: "vo",
    iso_639_2: "vol",
    iso_3166_1: null,
    flag: "\u{1F310}",
    english_name: "Volap\xFCk",
    name: "Volap\xFCk"
  },
  // W
  {
    iso_639_1: "wa",
    iso_639_2: "wln",
    iso_3166_1: "BE",
    flag: "\u{1F1E7}\u{1F1EA}",
    english_name: "Walloon",
    name: "Walon"
  },
  {
    iso_639_1: "wo",
    iso_639_2: "wol",
    iso_3166_1: "SN",
    flag: "\u{1F1F8}\u{1F1F3}",
    english_name: "Wolof",
    name: "Wolof"
  },
  // X
  {
    iso_639_1: "xh",
    iso_639_2: "xho",
    iso_3166_1: "ZA",
    flag: "\u{1F1FF}\u{1F1E6}",
    english_name: "Xhosa",
    name: "IsiXhosa"
  },
  // Y
  {
    iso_639_1: "yi",
    iso_639_2: "yid",
    iso_3166_1: "IL",
    flag: "\u{1F1EE}\u{1F1F1}",
    english_name: "Yiddish",
    name: "\u05D9\u05D9\u05B4\u05D3\u05D9\u05E9"
  },
  {
    iso_639_1: "yo",
    iso_639_2: "yor",
    iso_3166_1: "NG",
    flag: "\u{1F1F3}\u{1F1EC}",
    english_name: "Yoruba",
    name: "\xC8d\xE8 Yor\xF9b\xE1"
  },
  // Z
  {
    iso_639_1: "za",
    iso_639_2: "zha",
    iso_3166_1: "CN",
    flag: "\u{1F1E8}\u{1F1F3}",
    english_name: "Zhuang; Chuang",
    name: "Sa\u026F cue\u014B\u0185"
  },
  {
    iso_639_1: "zh",
    iso_639_2: "zho",
    iso_3166_1: "CN",
    flag: "\u{1F1E8}\u{1F1F3}",
    flag_priority: true,
    english_name: "Chinese (Simplified)",
    name: "\u4E2D\u6587 (\u7B80\u4F53)"
  },
  {
    iso_639_1: "zh",
    iso_639_2: "zho",
    iso_3166_1: "TW",
    flag: "\u{1F1F9}\u{1F1FC}",
    english_name: "Chinese (Traditional)",
    name: "\u4E2D\u6587 (\u7E41\u9AD4)"
  },
  {
    iso_639_1: "zh",
    iso_639_2: "zho",
    iso_3166_1: "HK",
    flag: "\u{1F1ED}\u{1F1F0}",
    english_name: "Chinese (Hong Kong)",
    name: "\u4E2D\u6587 (\u9999\u6E2F)"
  },
  {
    iso_639_1: "zh",
    iso_639_2: "zho",
    iso_3166_1: "SG",
    flag: "\u{1F1F8}\u{1F1EC}",
    english_name: "Chinese (Singapore)",
    name: "\u4E2D\u6587 (\u65B0\u52A0\u5761)"
  },
  {
    iso_639_1: "zu",
    iso_639_2: "zul",
    iso_3166_1: "ZA",
    flag: "\u{1F1FF}\u{1F1E6}",
    english_name: "Zulu",
    name: "IsiZulu"
  },
  // Additional languages not in your original list but commonly used
  {
    iso_639_1: "sw",
    iso_639_2: "swa",
    iso_3166_1: "TZ",
    flag: "\u{1F1F9}\u{1F1FF}",
    english_name: "Swahili (Tanzania)",
    name: "Kiswahili"
  },
  {
    iso_639_1: "fr",
    iso_639_2: "fra",
    iso_3166_1: "CA",
    flag: "\u{1F1E8}\u{1F1E6}",
    english_name: "French (Canada)",
    name: "Fran\xE7ais"
  },
  {
    iso_639_1: "fr",
    iso_639_2: "fra",
    iso_3166_1: "BE",
    flag: "\u{1F1E7}\u{1F1EA}",
    english_name: "French (Belgium)",
    name: "Fran\xE7ais"
  },
  {
    iso_639_1: "fr",
    iso_639_2: "fra",
    iso_3166_1: "CH",
    flag: "\u{1F1E8}\u{1F1ED}",
    english_name: "French (Switzerland)",
    name: "Fran\xE7ais"
  },
  {
    iso_639_1: "de",
    iso_639_2: "deu",
    iso_3166_1: "AT",
    flag: "\u{1F1E6}\u{1F1F9}",
    english_name: "German (Austria)",
    name: "Deutsch"
  },
  {
    iso_639_1: "de",
    iso_639_2: "deu",
    iso_3166_1: "CH",
    flag: "\u{1F1E8}\u{1F1ED}",
    english_name: "German (Switzerland)",
    name: "Deutsch"
  },
  {
    iso_639_1: "it",
    iso_639_2: "ita",
    iso_3166_1: "CH",
    flag: "\u{1F1E8}\u{1F1ED}",
    english_name: "Italian (Switzerland)",
    name: "Italiano"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "MX",
    flag: "\u{1F1F2}\u{1F1FD}",
    english_name: "Spanish (Mexico)",
    internal_english_name: "Latino",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "AR",
    flag: "\u{1F1E6}\u{1F1F7}",
    english_name: "Spanish (Argentina)",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "CO",
    flag: "\u{1F1E8}\u{1F1F4}",
    english_name: "Spanish (Colombia)",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "CL",
    flag: "\u{1F1E8}\u{1F1F1}",
    english_name: "Spanish (Chile)",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "PE",
    flag: "\u{1F1F5}\u{1F1EA}",
    english_name: "Spanish (Peru)",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "es",
    iso_639_2: "spa",
    iso_3166_1: "VE",
    flag: "\u{1F1FB}\u{1F1EA}",
    english_name: "Spanish (Venezuela)",
    name: "Espa\xF1ol"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "MA",
    flag: "\u{1F1F2}\u{1F1E6}",
    english_name: "Arabic (Morocco)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "DZ",
    flag: "\u{1F1E9}\u{1F1FF}",
    english_name: "Arabic (Algeria)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "TN",
    flag: "\u{1F1F9}\u{1F1F3}",
    english_name: "Arabic (Tunisia)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "LY",
    flag: "\u{1F1F1}\u{1F1FE}",
    english_name: "Arabic (Libya)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "JO",
    flag: "\u{1F1EF}\u{1F1F4}",
    english_name: "Arabic (Jordan)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "SY",
    flag: "\u{1F1F8}\u{1F1FE}",
    english_name: "Arabic (Syria)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "LB",
    flag: "\u{1F1F1}\u{1F1E7}",
    english_name: "Arabic (Lebanon)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "IQ",
    flag: "\u{1F1EE}\u{1F1F6}",
    english_name: "Arabic (Iraq)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "KW",
    flag: "\u{1F1F0}\u{1F1FC}",
    english_name: "Arabic (Kuwait)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "BH",
    flag: "\u{1F1E7}\u{1F1ED}",
    english_name: "Arabic (Bahrain)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "QA",
    flag: "\u{1F1F6}\u{1F1E6}",
    english_name: "Arabic (Qatar)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "OM",
    flag: "\u{1F1F4}\u{1F1F2}",
    english_name: "Arabic (Oman)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "YE",
    flag: "\u{1F1FE}\u{1F1EA}",
    english_name: "Arabic (Yemen)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  {
    iso_639_1: "ar",
    iso_639_2: "ara",
    iso_3166_1: "SD",
    flag: "\u{1F1F8}\u{1F1E9}",
    english_name: "Arabic (Sudan)",
    name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629"
  },
  // Languages without ISO 639-1 codes but with ISO 639-2 codes
  {
    iso_639_1: null,
    iso_639_2: "ace",
    iso_3166_1: "ID",
    flag: "\u{1F1EE}\u{1F1E9}",
    english_name: "Achinese",
    name: "Bahsa Ac\xE8h"
  },
  {
    iso_639_1: null,
    iso_639_2: "ach",
    iso_3166_1: "UG",
    flag: "\u{1F1FA}\u{1F1EC}",
    english_name: "Acoli",
    name: "Lwo"
  },
  {
    iso_639_1: null,
    iso_639_2: "ada",
    iso_3166_1: "GH",
    flag: "\u{1F1EC}\u{1F1ED}",
    english_name: "Adangme",
    name: "Adangme"
  },
  {
    iso_639_1: null,
    iso_639_2: "ady",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Adyghe; Adygei",
    name: "\u0410\u0434\u044B\u0433\u044D\u0431\u0437\u044D"
  },
  {
    iso_639_1: null,
    iso_639_2: "afa",
    iso_3166_1: "ET",
    flag: "\u{1F1EA}\u{1F1F9}",
    english_name: "Afro-Asiatic languages",
    name: "Afro-Asiatic"
  },
  {
    iso_639_1: null,
    iso_639_2: "afh",
    iso_3166_1: "GH",
    flag: "\u{1F1EC}\u{1F1ED}",
    english_name: "Afrihili",
    name: "Afrihili"
  },
  {
    iso_639_1: null,
    iso_639_2: "agq",
    iso_3166_1: "CM",
    flag: "\u{1F1E8}\u{1F1F2}",
    english_name: "Aghem",
    name: "Aghem"
  },
  {
    iso_639_1: null,
    iso_639_2: "ain",
    iso_3166_1: "JP",
    flag: "\u{1F1EF}\u{1F1F5}",
    english_name: "Ainu",
    name: "\u30A2\u30A4\u30CC \u30A4\u30BF\u31F0"
  },
  {
    iso_639_1: null,
    iso_639_2: "akk",
    iso_3166_1: "IQ",
    flag: "\u{1F1EE}\u{1F1F6}",
    english_name: "Akkadian",
    name: "Akkadian"
  },
  {
    iso_639_1: null,
    iso_639_2: "ale",
    iso_3166_1: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    english_name: "Aleut",
    name: "Unangam Tunuu"
  },
  {
    iso_639_1: null,
    iso_639_2: "alt",
    iso_3166_1: "RU",
    flag: "\u{1F1F7}\u{1F1FA}",
    english_name: "Southern Altai",
    name: "\u0410\u043B\u0442\u0430\u0439 \u0442\u0438\u043B"
  },
  {
    iso_639_1: null,
    iso_639_2: "ang",
    iso_3166_1: "GB",
    flag: "\u{1F1EC}\u{1F1E7}",
    english_name: "English, Old (ca.450-1100)",
    name: "Englisc"
  },
  {
    iso_639_1: null,
    iso_639_2: "anp",
    iso_3166_1: "IN",
    flag: "\u{1F1EE}\u{1F1F3}",
    english_name: "Angika",
    name: "\u0905\u0902\u0917\u093F\u0915\u093E"
  },
  {
    iso_639_1: null,
    iso_639_2: "arc",
    iso_3166_1: "SY",
    flag: "\u{1F1F8}\u{1F1FE}",
    english_name: "Aramaic",
    name: "\u0710\u072A\u0721\u071D\u0710"
  },
  {
    iso_639_1: null,
    iso_639_2: "arn",
    iso_3166_1: "CL",
    flag: "\u{1F1E8}\u{1F1F1}",
    english_name: "Mapudungun; Mapuche",
    name: "Mapudungun"
  },
  {
    iso_639_1: null,
    iso_639_2: "arp",
    iso_3166_1: "US",
    flag: "\u{1F1FA}\u{1F1F8}",
    english_name: "Arapaho",
    name: "Hin\xF3no\u02BCeit\xED\xEDt"
  },
  {
    iso_639_1: null,
    iso_639_2: "arw",
    iso_3166_1: "GY",
    flag: "\u{1F1EC}\u{1F1FE}",
    english_name: "Arawak",
    name: "Arawak"
  },
  {
    iso_639_1: null,
    iso_639_2: "ast",
    iso_3166_1: "ES",
    flag: "\u{1F1EA}\u{1F1F8}",
    english_name: "Asturian; Bable; Leonese; Asturleonese",
    name: "Asturianu"
  }
];

// packages/core/src/utils/constants.ts
var INTERNAL_SECRET_HEADER = "X-AIOStreams-Internal-Secret";
var GDRIVE_FORMATTER = "gdrive";
var LIGHT_GDRIVE_FORMATTER = "lightgdrive";
var MINIMALISTIC_GDRIVE_FORMATTER = "minimalisticgdrive";
var TORRENTIO_FORMATTER = "torrentio";
var TORBOX_FORMATTER = "torbox";
var PRISM_FORMATTER = "prism";
var TAMTARO_FORMATTER = "tamtaro";
var CUSTOM_FORMATTER = "custom";
var FORMATTER_DETAILS = {
  [GDRIVE_FORMATTER]: {
    id: GDRIVE_FORMATTER,
    name: "Google Drive",
    description: "Uses the formatting from the Stremio GDrive addon"
  },
  [PRISM_FORMATTER]: {
    id: PRISM_FORMATTER,
    name: "Prism",
    description: "An aesthetic formatter with every detail within 5 lines."
  },
  [TAMTARO_FORMATTER]: {
    id: TAMTARO_FORMATTER,
    name: "Tamtaro",
    description: "From Tamtaro's setup. Smartly detects status for cached (\u26A1/\u23F3), proxied (\u26CA/\u26C9), library (\u2601\uFE0E/\u270E), season packs (\u2756/\u25C8) and HDR/DV (\u2726/\u2727). The last line in s\u1D0D\u1D00\u029F\u029F \u1D04\u1D00\u1D18s displays your preferred language options, Usenet's health (\u2611 \u0274\u1D22\u0299), SeaDex (\u1D00\u029F\u1D1B/\u0299\u1D07s\u1D1B \u0280\u1D07\u029F\u1D07\u1D00s\u1D07), networks, special editions and attributes via ranked stream expressions."
  },
  [LIGHT_GDRIVE_FORMATTER]: {
    id: LIGHT_GDRIVE_FORMATTER,
    name: "Light Google Drive",
    description: "A lighter version of the GDrive formatter, focused on asthetics"
  },
  [MINIMALISTIC_GDRIVE_FORMATTER]: {
    id: MINIMALISTIC_GDRIVE_FORMATTER,
    name: "Minimalistic",
    description: "A minimalistic formatter which shows only the bare minimum"
  },
  [TORRENTIO_FORMATTER]: {
    id: TORRENTIO_FORMATTER,
    name: "Torrentio",
    description: "Uses the formatting from the Torrentio addon"
  },
  [TORBOX_FORMATTER]: {
    id: TORBOX_FORMATTER,
    name: "Torbox",
    description: "Uses the formatting from the TorBox Stremio addon"
  },
  [CUSTOM_FORMATTER]: {
    id: CUSTOM_FORMATTER,
    name: "Custom",
    description: "Define your own formatter"
  }
};
var REALDEBRID_SERVICE = "realdebrid";
var DEBRIDLINK_SERVICE = "debridlink";
var PREMIUMIZE_SERVICE = "premiumize";
var ALLDEBRID_SERVICE = "alldebrid";
var TORBOX_SERVICE = "torbox";
var EASYDEBRID_SERVICE = "easydebrid";
var DEBRIDER_SERVICE = "debrider";
var PUTIO_SERVICE = "putio";
var PIKPAK_SERVICE = "pikpak";
var OFFCLOUD_SERVICE = "offcloud";
var SEEDR_SERVICE = "seedr";
var EASYNEWS_SERVICE = "easynews";
var NZBDAV_SERVICE = "nzbdav";
var ALTMOUNT_SERVICE = "altmount";
var STREMIO_NNTP_SERVICE = "stremio_nntp";
var STREMTHRU_NEWZ_SERVICE = "stremthru_newz";
var AIOSTREAMS_SERVICE = "aiostreams";
var TORRIN_SERVICE = "torrin";
var MEDIAFLOW_SERVICE = "mediaflow";
var STREMTHRU_SERVICE = "stremthru";
var BUILTIN_SERVICE = "builtin";
var PROXY_SERVICE_DETAILS = {
  [BUILTIN_SERVICE]: {
    id: BUILTIN_SERVICE,
    name: "Builtin Proxy",
    description: "A proxy service that is built into the core of AIOStreams",
    credentialDescription: "A valid username:password pair for this AIOStreams instance, defined in the `AIOSTREAMS_AUTH` environment variable."
  },
  [STREMTHRU_SERVICE]: {
    id: STREMTHRU_SERVICE,
    name: "StremThru",
    description: "[StremThru](https://github.com/MunifTanjim/stremthru) is a feature packed companion to Stremio which also offers a HTTP proxy, written in Go.",
    credentialDescription: "A valid username:password pair for your StremThru instance, defined in the `STREMTHRU_PROXY_AUTH` environment variable."
  },
  [MEDIAFLOW_SERVICE]: {
    id: MEDIAFLOW_SERVICE,
    name: "MediaFlow Proxy",
    description: "[MediaFlow Proxy](https://github.com/mhdzumair/mediaflow-proxy) is a high performance proxy server which supports HTTP, HLS, and more.",
    credentialDescription: "The value of your MediaFlow Proxy instance `API_PASSWORD` environment variable."
  }
};
var SERVICE_DETAILS = {
  [REALDEBRID_SERVICE]: {
    id: REALDEBRID_SERVICE,
    name: "Real-Debrid",
    shortName: "RD",
    knownNames: ["RD", "Real Debrid", "RealDebrid", "Real-Debrid"],
    signUpText: "Don't have an account? [Sign up here](https://real-debrid.com/?id=9483829)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "The API key for the Real-Debrid service. Obtain it from [here](https://real-debrid.com/apitoken)",
        type: "password",
        required: true
      }
    ]
  },
  [ALLDEBRID_SERVICE]: {
    id: ALLDEBRID_SERVICE,
    name: "AllDebrid",
    shortName: "AD",
    knownNames: ["AD", "All Debrid", "AllDebrid", "All-Debrid"],
    signUpText: "Don't have an account? [Sign up here](https://alldebrid.com/?uid=3n8qa&lang=en)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "The API key for the All-Debrid service. Create one [here](https://alldebrid.com/apikeys)",
        type: "password",
        required: true
      }
    ]
  },
  [PREMIUMIZE_SERVICE]: {
    id: PREMIUMIZE_SERVICE,
    name: "Premiumize",
    shortName: "PM",
    knownNames: ["PM", "Premiumize"],
    signUpText: "Don't have an account? [Sign up here](https://www.premiumize.me/register)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your Premiumize API key. Obtain it from [here](https://www.premiumize.me/account)",
        type: "password",
        required: true
      }
    ]
  },
  [DEBRIDLINK_SERVICE]: {
    id: DEBRIDLINK_SERVICE,
    name: "Debrid-Link",
    shortName: "DL",
    knownNames: ["DL", "Debrid Link", "DebridLink", "Debrid-Link"],
    signUpText: "Don't have an account? [Sign up here](https://debrid-link.com/id/EY0JO)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your Debrid-Link API key. Obtain it from [here](https://debrid-link.com/webapp/apikey)",
        type: "password",
        required: true
      }
    ]
  },
  [TORBOX_SERVICE]: {
    id: TORBOX_SERVICE,
    name: "TorBox",
    shortName: "TB",
    knownNames: ["TB", "TorBox", "Torbox", "TRB"],
    signUpText: "Don't have an account? [Sign up here](https://torbox.app/subscription?referral=9ca21adb-dbcb-4fb0-9195-412a5f3519bc) or use my referral code `9ca21adb-dbcb-4fb0-9195-412a5f3519bc`.",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your Torbox API key. Obtain it from [here](https://torbox.app/settings)",
        type: "password",
        required: true
      }
    ]
  },
  [STREMIO_NNTP_SERVICE]: {
    id: STREMIO_NNTP_SERVICE,
    name: "Stremio NNTP",
    shortName: "SN",
    knownNames: ["SN", "Stremio NNTP", "StremioNntp", "Stremio-NNTP"],
    signUpText: "Stream usenet directly from your provider via Stremio's NNTP client.",
    credentials: [
      {
        id: "note",
        name: "",
        description: `This is a new Stremio feature that allows Stremio to connect directly to Usenet NNTP servers you provide. It is currently [only supported on Stremio V5 Desktop](https://blog.stremio.com/stremio-new-stream-sources-usenet-rar-zip-ftp-and-more/).`,
        type: "alert",
        intent: "warning"
      },
      {
        id: "servers",
        name: "NNTP Servers",
        description: "Provide your Usenet NNTP server addresses",
        type: "custom-nntp-servers",
        required: true
      }
    ]
  },
  [NZBDAV_SERVICE]: {
    id: NZBDAV_SERVICE,
    name: "NzbDAV",
    shortName: "ND",
    knownNames: ["ND"],
    signUpText: "Stream usenet directly from your provider via Nzb DAV.",
    credentials: [
      {
        id: "note",
        name: "Configuration Help",
        description: `**URL:** Use internal URL for local setups (e.g., http://nzbdav:3000), otherwise use a public URL.

**Public URL:** Only needed if URL is local but streams need to be publicly accessible. Leave blank if URL is public or using a proxy.

**Security Note:** WebDAV credentials are exposed in stream URLs unless proxied. To proxy, provide the Auth Token below (built-in proxy only).

For detailed setup instructions, see the [Usenet guide](https://docs.aiostreams.viren070.me/guides/usenet#nzbdav-altmount-and-stremthru-newz).`,
        type: "alert",
        intent: "info",
        required: false
      },
      {
        id: "url",
        name: "NzbDAV URL",
        description: "The base URL of your NZB DAV instance. E.g., http://nzbdav:3000",
        type: "string",
        required: true
      },
      {
        id: "publicUrl",
        name: "Public NzbDAV URL (Optional)",
        description: "The public URL of your NzbDAV instance. Optional, see note above for details.",
        type: "string",
        required: false
      },
      {
        id: "apiKey",
        name: "NzbDAV API Key",
        description: "Your Nzb DAV API Key, found in the SABnzbd section in settings.",
        type: "password",
        required: true
      },
      {
        id: "username",
        name: "NzbDAV WebDAV Username",
        description: "Your Nzb DAV WebDAV Username. Found in the WebDAV section in settings.",
        type: "string",
        required: false
      },
      {
        id: "password",
        name: "NzbDAV WebDAV Password",
        description: "Your NzbDAV WebDAV Password. Found in the WebDAV section in settings.",
        type: "password",
        required: false
      },
      {
        id: "aiostreamsAuth",
        name: "AIOStreams Auth Token (Optional)",
        description: "If you would like to proxy your NzbDAV streams, you will need to provide a username:password pair for your AIOStreams instance, defined in the `AIOSTREAMS_AUTH` environment variable. **Other proxies will not work and you must define it here only**",
        type: "password",
        required: false
      }
    ]
  },
  [AIOSTREAMS_SERVICE]: {
    id: AIOSTREAMS_SERVICE,
    name: "AIOStreams",
    shortName: "AIO",
    knownNames: ["AIO", "AIO Usenet", "NZB", "Usenet", "Native Usenet"],
    signUpText: "Stream directly from your own NNTP providers via the built-in usenet engine. Providers are configured globally by the administrator.",
    credentials: [
      {
        id: "note",
        name: "Configuration Help",
        description: `NNTP providers for this engine are configured **globally by the administrator** (Settings \u2192 Usenet), not here.

To authorise streaming through the built-in engine, provide an AIOStreams Auth Token below: a \`username:password\` pair defined in the \`AIOSTREAMS_AUTH\` environment variable.`,
        type: "alert",
        intent: "info",
        required: false
      },
      {
        id: "aiostreamsAuth",
        name: "AIOStreams Auth Token",
        description: "A `username:password` pair for your AIOStreams instance, defined in the `AIOSTREAMS_AUTH` environment variable. Required to authorise streaming through the built-in usenet engine.",
        type: "password",
        required: true
      }
    ]
  },
  [ALTMOUNT_SERVICE]: {
    id: ALTMOUNT_SERVICE,
    name: "AltMount",
    shortName: "AM",
    knownNames: ["AM"],
    signUpText: "Stream usenet directly from your provider via AltMount.",
    credentials: [
      {
        id: "note",
        name: "Configuration Help",
        description: `**URL:** Use internal URL for local setups (e.g., http://altmount:8000), otherwise use a public URL.

**Public URL:** Only needed if URL is local but streams need to be publicly accessible. Leave blank if URL is public or using a proxy.

**Security Note:** WebDAV credentials are exposed in stream URLs unless proxied. To proxy, provide the Auth Token below (built-in proxy only).

For detailed setup instructions, see the [Usenet guide](https://docs.aiostreams.viren070.me/guides/usenet#nzbdav-altmount-and-stremthru-newz).`,
        type: "alert",
        intent: "info",
        required: false
      },
      {
        id: "url",
        name: "Altmount URL",
        description: "The base URL of your AltMount instance used for requests. e.g., http://altmount:8080",
        type: "string",
        required: true
      },
      {
        id: "publicUrl",
        name: "Public Altmount URL",
        description: "The public URL of your AltMount instance. Optional, see note above for details.",
        type: "string",
        required: false
      },
      {
        id: "apiKey",
        name: "AltMount API Key",
        description: "Your AltMount API Key, found at `Configuration -> System` in the AltMount Web UI.",
        type: "password",
        required: true
      },
      {
        id: "username",
        name: "AltMount WebDAV Username",
        description: "Your AltMount WebDAV Username, found at `Configuration -> WebDAV Server` in the AltMount Web UI.",
        type: "string",
        required: true
      },
      {
        id: "password",
        name: "AltMount WebDAV Password",
        description: "Your AltMount WebDAV Password, found at `Configuration -> WebDAV Server` in the AltMount Web UI.",
        type: "password",
        required: true
      },
      {
        id: "aiostreamsAuth",
        name: "AIOStreams Auth Token (Optional)",
        description: "If you would like to proxy your AltMount streams, you will need to provide a username:password pair for your AIOStreams instance, defined in the `AIOSTREAMS_AUTH` environment variable. **Other proxies will not work and you must define it here only**",
        type: "password",
        required: false
      }
    ]
  },
  [OFFCLOUD_SERVICE]: {
    id: OFFCLOUD_SERVICE,
    name: "Offcloud",
    shortName: "OC",
    knownNames: ["OC", "Offcloud"],
    signUpText: "Don't have an account? [Sign up here](https://offcloud.com/?=06202a3d)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your Offcloud API key. Obtain it from [here](https://offcloud.com/#/account) on the `API Key` tab. ",
        type: "password",
        required: true
      },
      {
        id: "email",
        name: "Email",
        description: "Your Offcloud email. (These credentials are necessary for some addons)",
        type: "password",
        required: true
      },
      {
        id: "password",
        name: "Password",
        description: "Your Offcloud password. (These credentials are necessary for some addons)",
        type: "password",
        required: true
      }
    ]
  },
  [PUTIO_SERVICE]: {
    id: PUTIO_SERVICE,
    name: "put.io",
    shortName: "P.IO",
    knownNames: ["PO", "put.io", "putio"],
    signUpText: "Don't have an account? [Sign up here](https://put.io/)",
    credentials: [
      {
        id: "clientId",
        name: "Client ID",
        description: "Your put.io Client ID. Obtain it from [here](https://app.put.io/oauth)",
        type: "password",
        required: true
      },
      {
        id: "token",
        name: "Token",
        description: "Your put.io Token. Obtain it from [here](https://app.put.io/oauth)",
        type: "password",
        required: true
      }
    ]
  },
  [EASYNEWS_SERVICE]: {
    id: EASYNEWS_SERVICE,
    name: "Easynews",
    shortName: "EN",
    knownNames: ["EN", "Easynews"],
    signUpText: "Don't have an account? [Sign up here](https://www.easynews.com/)",
    credentials: [
      {
        id: "username",
        name: "Username",
        description: "Your Easynews username",
        type: "password",
        required: true
      },
      {
        id: "password",
        name: "Password",
        description: "Your Easynews password",
        type: "password",
        required: true
      }
    ]
  },
  [EASYDEBRID_SERVICE]: {
    id: EASYDEBRID_SERVICE,
    name: "EasyDebrid",
    shortName: "ED",
    knownNames: ["ED", "EasyDebrid"],
    signUpText: "Don't have an account? [Sign up here](https://paradise-cloud.com/products/easydebrid)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your EasyDebrid API key. Obtain it from [here](https://paradise-cloud.com/dashboard/)",
        type: "password",
        required: true
      }
    ]
  },
  [DEBRIDER_SERVICE]: {
    id: DEBRIDER_SERVICE,
    name: "Debrider",
    shortName: "DR",
    knownNames: ["DBD", "DR", "DER", "DB", "Debrider"],
    signUpText: "Don't have an account? [Sign up here](https://debrider.app/)",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your Debrider API key. Obtain it from [here](https://debrider.app/dashboard/account)",
        type: "password",
        required: true
      }
    ]
  },
  [PIKPAK_SERVICE]: {
    id: PIKPAK_SERVICE,
    name: "PikPak",
    shortName: "PKP",
    knownNames: ["PP", "PikPak", "PKP"],
    signUpText: "Don't have an account? [Sign up here](https://mypikpak.com/drive/activity/invited?invitation-code=72822731)",
    credentials: [
      {
        id: "email",
        name: "Email",
        description: "Your PikPak email address",
        type: "password",
        required: true
      },
      {
        id: "password",
        name: "Password",
        description: "Your PikPak password",
        type: "password",
        required: true
      }
    ]
  },
  [SEEDR_SERVICE]: {
    id: SEEDR_SERVICE,
    name: "Seedr",
    shortName: "SDR",
    knownNames: ["SR", "Seedr", "SDR"],
    signUpText: "Don't have an account? [Sign up here](https://www.seedr.cc/?r=6542079)",
    credentials: [
      {
        id: "encodedToken",
        name: "Encoded Token",
        description: "Please authorise at MediaFusion and copy the token into here.",
        type: "password",
        required: true
      }
    ]
  },
  [STREMTHRU_NEWZ_SERVICE]: {
    id: STREMTHRU_NEWZ_SERVICE,
    name: "StremThru Newz",
    shortName: "ST",
    knownNames: ["ST", "StremThru Newz", "StremThruNewz"],
    signUpText: "Stream usenet content via [StremThru](https://github.com/MunifTanjim/stremthru).",
    credentials: [
      {
        id: "url",
        name: "StremThru URL",
        description: "The base URL of your StremThru instance used for requests e.g. http://stremthru:8080 or https://stremthru.mydomain.com",
        type: "string",
        required: true
      },
      {
        id: "authToken",
        name: "Auth Token",
        description: "Your StremThru authentication token from `STREMTHRU_AUTH`",
        type: "password",
        required: true
      },
      {
        id: "note",
        name: "Tip",
        description: "If you are self-hosting both StremThru and AIOStreams, consider using the internal URL of StremThru (e.g., http://stremthru:8080) to avoid potential network issues. Your playback URLs generated by StremThru will use the `STREMTHRU_BASE_URL` environment variable.",
        type: "alert",
        intent: "info"
      }
    ]
  },
  [TORRIN_SERVICE]: {
    id: TORRIN_SERVICE,
    name: "Torrin",
    shortName: "TR",
    knownNames: ["TR", "TI", "Torrin"],
    signUpText: "Don't have an account? [Sign up here](https://torrin.app). Torrin is an open-source debrid service.",
    credentials: [
      {
        id: "apiKey",
        name: "API Key",
        description: "Your Torrin API key (begins with `tr_`). Obtain it from [torrin.app/app/settings](https://torrin.app/app/settings).",
        type: "password",
        required: true
      }
    ]
  }
};
var FAKE_VISUAL_TAGS = ["HDR+DV", "DV Only", "HDR Only"];
var VISUAL_TAGS = [
  ...FAKE_VISUAL_TAGS,
  "HDR10+",
  "HDR10",
  "DV",
  "HDR",
  "HLG",
  "10bit",
  "3D",
  "IMAX",
  "AI",
  "Upscaled",
  "SDR",
  "H-OU",
  "H-SBS",
  "Unknown"
];
var MAX_SIZE = 100 * 1e3 * 1e3 * 1e3;
var MAX_BITRATE = 250 * 1e3 * 1e3;
var MAX_AGE_HOURS = 6480 * 24;
var STREAM_RESOURCE = "stream";
var SUBTITLES_RESOURCE = "subtitles";
var CATALOG_RESOURCE = "catalog";
var META_RESOURCE = "meta";
var ADDON_CATALOG_RESOURCE = "addon_catalog";
var MOVIE_TYPE = "movie";
var SERIES_TYPE = "series";
var CHANNEL_TYPE = "channel";
var TV_TYPE = "tv";
var ANIME_TYPE = "anime";
var TYPE_LABELS = {
  [MOVIE_TYPE]: "Movie",
  [SERIES_TYPE]: "Series",
  [CHANNEL_TYPE]: "Channel",
  [TV_TYPE]: "TV",
  [ANIME_TYPE]: "Anime"
};
var RESOURCE_LABELS = {
  [STREAM_RESOURCE]: "Stream",
  [SUBTITLES_RESOURCE]: "Subtitles",
  [CATALOG_RESOURCE]: "Catalog",
  [META_RESOURCE]: "Metadata",
  [ADDON_CATALOG_RESOURCE]: "Addon Catalog"
};
var LANGUAGES = [
  "English",
  "Japanese",
  "Chinese",
  "Russian",
  "Arabic",
  "Portuguese",
  "Portuguese (Brazil)",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Korean",
  "Hindi",
  "Bengali",
  "Punjabi",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Turkish",
  "Hebrew",
  "Persian",
  "Ukrainian",
  "Greek",
  "Lithuanian",
  "Latvian",
  "Estonian",
  "Polish",
  "Czech",
  "Slovak",
  "Hungarian",
  "Romanian",
  "Bulgarian",
  "Serbian",
  "Croatian",
  "Slovenian",
  "Dutch",
  "Danish",
  "Finnish",
  "Swedish",
  "Norwegian",
  "Malay",
  "Latino",
  "Dual Audio",
  "Dubbed",
  "Multi",
  "Original",
  "Unknown"
];

// packages/core/src/utils/languages.ts
function getLanguageDisplayName(entry) {
  if (entry.internal_english_name) return entry.internal_english_name;
  return entry.english_name.split(/;|\(/)[0].trim();
}
var LANGUAGE_ALIAS_MAP = {
  fre: "fra",
  ger: "deu",
  cze: "ces",
  slo: "slk",
  rum: "ron",
  dut: "nld",
  gre: "ell",
  alb: "sqi",
  baq: "eus",
  bur: "mya",
  chi: "zho",
  per: "fas",
  arm: "hye",
  geo: "kat",
  ice: "isl",
  mac: "mkd",
  mao: "mri",
  may: "msa",
  tib: "bod",
  wel: "cym"
};
function normaliseLangCode(code) {
  const lower = code.toLowerCase().trim();
  return LANGUAGE_ALIAS_MAP[lower] ?? lower;
}
var LANGUAGE_BY_NAME = new Map(
  LANGUAGES.map((lang) => [lang.toLowerCase(), lang])
);
var ENTRY_BY_NAME = /* @__PURE__ */ new Map();
for (const entry of FULL_LANGUAGE_MAPPING) {
  const names = [
    entry.internal_english_name,
    entry.english_name,
    ...entry.english_name.split(";").map((name) => name.split("(")[0])
  ];
  for (const name of names) {
    const key = name?.trim().toLowerCase();
    if (!key) continue;
    const existing = ENTRY_BY_NAME.get(key);
    if (!existing || !existing.flag_priority && entry.flag_priority) {
      ENTRY_BY_NAME.set(key, entry);
    }
  }
}
var REGION_ALIASES = {
  "latin america": "419",
  latam: "419",
  la: "419"
};
var QUALIFIER_PATTERN = /^(.*\S)\s*\(([^()]+)\)$/;
var MAX_INPUT_LENGTH = 64;
function toSupportedLanguage(entry) {
  if (!entry) return void 0;
  const candidate = getLanguageDisplayName(entry);
  return LANGUAGES.includes(candidate) ? candidate : void 0;
}
function findEntryByCode(value) {
  const parts = mapLanguageCode(normaliseLangCode(value)).toLowerCase().split("-");
  const possible = FULL_LANGUAGE_MAPPING.filter((lang) => {
    if (parts.length === 2) {
      return lang.iso_639_1?.toLowerCase() === parts[0] && lang.iso_3166_1?.toLowerCase() === parts[1];
    }
    return lang.iso_639_1?.toLowerCase() === parts[0] || lang.iso_639_2?.toLowerCase() === parts[0];
  });
  return possible.find((lang) => lang.flag_priority) ?? possible[0];
}
function mapLanguageCode(code) {
  switch (code.toLowerCase()) {
    case "zh-tw":
    case "zh-hans":
      return "zh";
    case "es-419":
      return "es-MX";
    default:
      return code;
  }
}
function normaliseLanguage(value) {
  if (typeof value !== "string") return void 0;
  let raw = value.trim();
  if (raw.length > MAX_INPUT_LENGTH) return void 0;
  while (raw) {
    const byName = LANGUAGE_BY_NAME.get(raw.toLowerCase());
    if (byName) return byName;
    const byFullName = toSupportedLanguage(
      ENTRY_BY_NAME.get(raw.toLowerCase())
    );
    if (byFullName) return byFullName;
    const byCode = toSupportedLanguage(findEntryByCode(raw));
    if (byCode) return byCode;
    const qualified = QUALIFIER_PATTERN.exec(raw);
    if (!qualified) return void 0;
    const base = qualified[1].trim();
    const qualifier = qualified[2].trim();
    const baseCode = ENTRY_BY_NAME.get(base.toLowerCase())?.iso_639_1 ?? findEntryByCode(base)?.iso_639_1;
    const region = REGION_ALIASES[qualifier.toLowerCase()] ?? (/^[a-z]{2}$/i.test(qualifier) ? qualifier : void 0);
    if (baseCode && region) {
      const byRegion = toSupportedLanguage(
        findEntryByCode(`${baseCode}-${region}`)
      );
      if (byRegion) return byRegion;
    }
    raw = base;
  }
  return void 0;
}
var AMBIGIOUS_LANGUAGES = new Set(
  ["Latino", "Portuguese (Brazil)"].map((lang) => lang.toLowerCase())
);
function languageToCode(language) {
  const cached = LANGUAGE_CODE_CACHE.get(language);
  if (cached !== void 0 || LANGUAGE_CODE_CACHE.has(language)) return cached;
  const result = computeLanguageCode(language);
  if (LANGUAGE_CODE_CACHE.size >= LANGUAGE_CODE_CACHE_MAX) {
    LANGUAGE_CODE_CACHE.clear();
  }
  LANGUAGE_CODE_CACHE.set(language, result);
  return result;
}
var LANGUAGE_CODE_CACHE = /* @__PURE__ */ new Map();
var LANGUAGE_CODE_CACHE_MAX = 1e3;
function computeLanguageCode(language) {
  const possibleLangs = FULL_LANGUAGE_MAPPING.filter(
    (lang) => lang.english_name.split(";").some(
      (name) => name.split("(")[0].trim().toLowerCase() === language.toLowerCase()
    ) || lang.internal_english_name && lang.internal_english_name.toLowerCase() === language.toLowerCase() || lang.name.toLowerCase() === language.toLowerCase()
  );
  if (possibleLangs.length === 0) return void 0;
  const selectedLang = possibleLangs.find((lang) => lang.flag_priority) ?? possibleLangs[0];
  if (AMBIGIOUS_LANGUAGES.has(getLanguageDisplayName(selectedLang).toLowerCase())) {
    return `${selectedLang.iso_639_1?.toUpperCase()}-${selectedLang.iso_3166_1?.toUpperCase()}`;
  }
  return selectedLang.iso_639_1?.toUpperCase();
}
var languageEmojiMap = {
  multi: "\u{1F30E}",
  english: "\u{1F1EC}\u{1F1E7}",
  japanese: "\u{1F1EF}\u{1F1F5}",
  chinese: "\u{1F1E8}\u{1F1F3}",
  russian: "\u{1F1F7}\u{1F1FA}",
  arabic: "\u{1F1F8}\u{1F1E6}",
  portuguese: "\u{1F1F5}\u{1F1F9}",
  "portuguese (brazil)": "\u{1F1E7}\u{1F1F7}",
  spanish: "\u{1F1EA}\u{1F1F8}",
  french: "\u{1F1EB}\u{1F1F7}",
  german: "\u{1F1E9}\u{1F1EA}",
  italian: "\u{1F1EE}\u{1F1F9}",
  korean: "\u{1F1F0}\u{1F1F7}",
  hindi: "\u{1F1EE}\u{1F1F3}",
  bengali: "\u{1F1E7}\u{1F1E9}",
  punjabi: "\u{1F1F5}\u{1F1F0}",
  marathi: "\u{1F1EE}\u{1F1F3}",
  gujarati: "\u{1F1EE}\u{1F1F3}",
  tamil: "\u{1F1EE}\u{1F1F3}",
  telugu: "\u{1F1EE}\u{1F1F3}",
  kannada: "\u{1F1EE}\u{1F1F3}",
  malayalam: "\u{1F1EE}\u{1F1F3}",
  thai: "\u{1F1F9}\u{1F1ED}",
  vietnamese: "\u{1F1FB}\u{1F1F3}",
  indonesian: "\u{1F1EE}\u{1F1E9}",
  turkish: "\u{1F1F9}\u{1F1F7}",
  hebrew: "\u{1F1EE}\u{1F1F1}",
  persian: "\u{1F1EE}\u{1F1F7}",
  ukrainian: "\u{1F1FA}\u{1F1E6}",
  greek: "\u{1F1EC}\u{1F1F7}",
  lithuanian: "\u{1F1F1}\u{1F1F9}",
  latvian: "\u{1F1F1}\u{1F1FB}",
  estonian: "\u{1F1EA}\u{1F1EA}",
  polish: "\u{1F1F5}\u{1F1F1}",
  czech: "\u{1F1E8}\u{1F1FF}",
  slovak: "\u{1F1F8}\u{1F1F0}",
  hungarian: "\u{1F1ED}\u{1F1FA}",
  romanian: "\u{1F1F7}\u{1F1F4}",
  bulgarian: "\u{1F1E7}\u{1F1EC}",
  serbian: "\u{1F1F7}\u{1F1F8}",
  croatian: "\u{1F1ED}\u{1F1F7}",
  slovenian: "\u{1F1F8}\u{1F1EE}",
  dutch: "\u{1F1F3}\u{1F1F1}",
  danish: "\u{1F1E9}\u{1F1F0}",
  finnish: "\u{1F1EB}\u{1F1EE}",
  swedish: "\u{1F1F8}\u{1F1EA}",
  norwegian: "\u{1F1F3}\u{1F1F4}",
  malay: "\u{1F1F2}\u{1F1FE}",
  latino: "\u{1F483}\u{1F3FB}",
  Latino: "\u{1F1F2}\u{1F1FD}"
};
function languageToEmoji(language) {
  return languageEmojiMap[language.toLowerCase()];
}

// packages/core/src/formatters/engine/sentinels.ts
var NEW_LINE_SENTINEL = "";
var REMOVE_LINE_SENTINEL = "";
var SENTINEL_PATTERN = /[\u0011\u0012]/g;
function hasSentinel(text) {
  return text.includes(NEW_LINE_SENTINEL) || text.includes(REMOVE_LINE_SENTINEL);
}
function sanitise(text) {
  return hasSentinel(text) ? text.replace(SENTINEL_PATTERN, "") : text;
}
function substituteTools(text) {
  return text.replaceAll("{tools.newLine}", NEW_LINE_SENTINEL).replaceAll("{tools.removeLine}", REMOVE_LINE_SENTINEL);
}

// packages/core/src/formatters/engine/modifiers.ts
var toLanguageCode = (value) => {
  const name = normaliseLanguage(value) ?? value;
  return languageToCode(name) || name.toUpperCase();
};
var toLanguageEmoji = (value) => {
  const name = normaliseLanguage(value) ?? value;
  return languageToEmoji(name) ?? "";
};
var mapLanguages = (value, convert) => [
  ...new Set(value.map((item) => convert(String(item))).filter(Boolean))
];
var stringModifiers = {
  upper: (value) => value.toUpperCase(),
  lower: (value) => value.toLowerCase(),
  title: (value) => value.split(" ").map((word) => word.toLowerCase()).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
  length: (value) => value.length.toString(),
  reverse: (value) => value.split("").reverse().join(""),
  base64: (value) => btoa(String.fromCharCode(...new TextEncoder().encode(value))),
  string: (value) => value,
  smallcaps: (value) => makeSmall(value),
  subscript: (value) => mapChars(value, DIGITS, SUBSCRIPT_DIGITS),
  superscript: (value) => mapChars(value, DIGITS, SUPERSCRIPT_DIGITS),
  languagecode: toLanguageCode,
  languageemoji: toLanguageEmoji
};
var DIGITS = "0123456789+-=()";
var SUBSCRIPT_DIGITS = "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u208A\u208B\u208C\u208D\u208E";
var SUPERSCRIPT_DIGITS = "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207C\u207D\u207E";
function mapChars(value, from, to) {
  const table = /* @__PURE__ */ new Map();
  const source = [...from];
  const target = [...to];
  for (let i = 0; i < source.length && i < target.length; i++) {
    table.set(source[i], target[i]);
  }
  return [...value].map((char) => table.get(char) ?? char).join("");
}
var arrayGetOrDefault = (value, index) => value.length > 0 ? String(value[index]) : "";
var sortBy = (ascending) => (value) => [...value].sort((a, b) => {
  const result = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), void 0, { numeric: true });
  return ascending ? result : -result;
});
var stars = (padWithEmpty) => (value) => {
  const FULL = "\u2605";
  const HALF = "\u2BEA";
  const EMPTY = "\u2606";
  const full = Math.floor(value / 20);
  const half = value % 20 >= 10 ? 1 : 0;
  return FULL.repeat(full) + HALF.repeat(half) + (padWithEmpty ? EMPTY.repeat(5 - full - half) : "");
};
var arrayModifiers = {
  join: (value) => value.join(", "),
  length: (value) => value.length.toString(),
  first: (value) => arrayGetOrDefault(value, 0),
  last: (value) => arrayGetOrDefault(value, value.length - 1),
  random: (value) => arrayGetOrDefault(value, Math.floor(Math.random() * value.length)),
  sort: sortBy(true),
  rsort: sortBy(false),
  lsort: (value) => [...value].sort(),
  reverse: (value) => [...value].reverse(),
  languagecode: (value) => mapLanguages(value, toLanguageCode),
  languageemoji: (value) => mapLanguages(value, toLanguageEmoji),
  string: (value) => value.toString()
};
var numberModifiers = {
  comma: (value) => value.toLocaleString(),
  hex: (value) => value.toString(16),
  octal: (value) => value.toString(8),
  binary: (value) => value.toString(2),
  bytes: (value) => formatBytes(value, 1e3),
  sbytes: (value) => formatSmartBytes(value, 1e3),
  sbytes10: (value) => formatSmartBytes(value, 1e3),
  sbytes2: (value) => formatSmartBytes(value, 1024),
  rbytes: (value) => formatBytes(value, 1e3, true),
  bytes10: (value) => formatBytes(value, 1e3),
  rbytes10: (value) => formatBytes(value, 1e3, true),
  bytes2: (value) => formatBytes(value, 1024),
  rbytes2: (value) => formatBytes(value, 1024, true),
  bitrate: (value) => formatBitrate(value),
  rbitrate: (value) => formatBitrate(value, true),
  sbitrate: (value) => formatSmartBitrate(value),
  string: (value) => value.toString(),
  time: (value) => formatDuration(normaliseDuration(value)),
  star: stars(false),
  pstar: stars(true)
};
var booleanModifiers = {
  string: (value) => String(value)
};
var conditionalModifiers = {
  exact: {
    istrue: (value) => value === true,
    isfalse: (value) => value === false,
    exists: (value) => {
      if (value === void 0 || value === null) return false;
      if (typeof value === "string") return /\S/.test(value);
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }
  },
  prefix: {
    $: (value, check) => typeof value === "string" ? value.startsWith(check) : value?.[0] === check,
    "^": (value, check) => typeof value === "string" ? value.endsWith(check) : value?.[value.length - 1] === check,
    "~": (value, check) => value.includes(check),
    "=": (value, check) => value === check,
    ">=": (value, check) => value >= check,
    ">": (value, check) => value > check,
    "<=": (value, check) => value <= check,
    "<": (value, check) => value < check
  }
};
var stringModifierNames = Object.keys(stringModifiers);
var numberModifierNames = Object.keys(numberModifiers);
var arrayModifierNames = Object.keys(arrayModifiers);
var booleanModifierNames = Object.keys(booleanModifiers);
var conditionalModifierNames = Object.keys(
  conditionalModifiers.exact
);
var allModifierNames = [
  ...stringModifierNames,
  ...booleanModifierNames,
  ...numberModifierNames,
  ...arrayModifierNames,
  ...conditionalModifierNames
];
var prefixOperators = Object.keys(conditionalModifiers.prefix).sort(
  (a, b) => b.length - a.length
);
function quotedArguments(inner) {
  const args = [];
  const pattern = /"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = pattern.exec(inner)) !== null) {
    args.push(match[1] ?? match[2] ?? "");
  }
  return args;
}
function unquote(arg) {
  const quote = arg[0];
  return arg.length >= 2 && (quote === "'" || quote === '"') && arg.endsWith(quote) ? arg.slice(1, -1) : void 0;
}
var MAX_RENDER_LENGTH = 8e3;
function replaceAll(value, search, replacement) {
  if (!search) return value;
  const growth = replacement.length - search.length;
  const worstCase = growth <= 0 ? value.length : value.length + Math.floor(value.length / search.length) * growth;
  if (worstCase <= MAX_RENDER_LENGTH) {
    return value.replaceAll(search, replacement);
  }
  let out = "";
  let from = 0;
  while (out.length < MAX_RENDER_LENGTH) {
    const at = value.indexOf(search, from);
    if (at === -1) {
      out += value.slice(from);
      break;
    }
    out += value.slice(from, at) + replacement;
    from = at + search.length;
  }
  return out.length > MAX_RENDER_LENGTH ? out.slice(0, MAX_RENDER_LENGTH) : out;
}
function compileConditional(lower) {
  const exact = conditionalModifiers.exact;
  const isExact = Object.prototype.hasOwnProperty.call(exact, lower);
  const operator = prefixOperators.find((op) => lower.startsWith(op));
  if (!isExact && !operator) return void 0;
  const rawCheck = operator ? lower.slice(operator.length) : "";
  const isArrayCapable = operator ? ["$", "^", "~"].includes(operator) : false;
  const isNumericCapable = operator ? ["<", "<=", ">", ">=", "="].includes(operator) : false;
  return (value) => {
    try {
      if (!exact.exists(value)) return false;
      if (isExact) return exact[lower](value);
      const arrayValue = Array.isArray(value) && value.every((item) => typeof item === "string") ? value.map((item) => item.toLowerCase()) : void 0;
      const stringValue = String(value).toLowerCase();
      const check = /\s/.test(stringValue) ? rawCheck : rawCheck.replace(/\s/g, "");
      const numericValue = Number(stringValue.replace(/,\s/g, ""));
      const numericCheck = Number(check.replace(/,\s/g, ""));
      const numeric = isNumericCapable && !isNaN(numericValue) && !isNaN(numericCheck);
      const compare = conditionalModifiers.prefix[operator];
      return compare(
        numeric ? numericValue : (isArrayCapable ? arrayValue : void 0) ?? stringValue,
        numeric ? numericCheck : check
      );
    } catch {
      return false;
    }
  };
}
function compileParameterised(source, lower) {
  const open = source.indexOf("(");
  if (open === -1 || !source.endsWith(")")) return void 0;
  const name = lower.slice(0, open);
  const inner = source.slice(open + 1, -1);
  switch (name) {
    case "replace": {
      const variableForm = /^\s*\{([^}]+)\}\s*,\s*(['"])([\s\S]*)\2\s*$/.exec(
        inner
      );
      if (variableForm) {
        const [, variablePath, , rawReplacement] = variableForm;
        const replacementText2 = substituteTools(rawReplacement);
        return (value, parseValue, ctx) => {
          if (typeof value !== "string") return void 0;
          const resolved = ctx.resolveVariable(variablePath, parseValue);
          return resolved ? replaceAll(value, resolved, replacementText2) : value;
        };
      }
      const openQuote = source.charAt("replace(".length);
      const closeQuote = source.charAt(source.length - 2);
      const body = source.slice("replace(".length + 1, -2);
      const [rawSearch, replacement, extra] = body.split(
        new RegExp(`${openQuote}\\s*,\\s*${closeQuote}`)
      );
      if (extra !== void 0 || !rawSearch || replacement === void 0) {
        return (value) => typeof value === "string" ? value : void 0;
      }
      const variableKey = rawSearch.startsWith("{") && rawSearch.endsWith("}") ? rawSearch.slice(1, -1) : void 0;
      const replacementText = substituteTools(replacement);
      return (value, parseValue, ctx) => {
        if (typeof value !== "string") return void 0;
        if (!variableKey) return replaceAll(value, rawSearch, replacementText);
        const resolved = ctx.resolveVariable(variableKey, parseValue);
        if (!resolved) return value;
        return replaceAll(value, resolved, replacementText);
      };
    }
    case "remove": {
      const args = quotedArguments(inner);
      if (args.length === 0) return () => void 0;
      const targets = args.filter(Boolean);
      return (value) => {
        if (typeof value === "string") {
          let result = value;
          for (const target of targets) result = result.replaceAll(target, "");
          return result;
        }
        if (Array.isArray(value)) return value.filter((v) => !args.includes(v));
        return void 0;
      };
    }
    case "join": {
      const raw = unquote(inner);
      if (raw === void 0) return void 0;
      const separator = substituteTools(raw);
      return (value) => Array.isArray(value) ? value.join(separator) : void 0;
    }
    case "truncate": {
      const limit = parseInt(inner, 10);
      if (isNaN(limit) || limit < 0) return void 0;
      const segmenter = new Intl.Segmenter();
      return (value) => {
        if (typeof value !== "string") return void 0;
        const graphemes = [...segmenter.segment(value)];
        if (graphemes.length <= limit) return value;
        return graphemes.slice(0, limit).map((s) => s.segment).join("").replace(/\s+$/, "") + "\u2026";
      };
    }
    case "slice": {
      const parts = inner.split(",").map((part) => parseInt(part.trim(), 10));
      if (isNaN(parts[0])) return void 0;
      const [start, end] = [
        parts[0],
        parts.length > 1 && !isNaN(parts[1]) ? parts[1] : void 0
      ];
      return (value) => Array.isArray(value) ? value.slice(start, end) : void 0;
    }
    case "default": {
      const fallback = unquote(inner);
      if (fallback === void 0) return void 0;
      return (value) => conditionalModifiers.exact.exists(value) ? value : fallback;
    }
    case "translate": {
      const [from, to] = quotedArguments(inner);
      if (from === void 0 || to === void 0) return void 0;
      return (value) => typeof value === "string" ? mapChars(value, from, to) : void 0;
    }
    case "in": {
      const options = quotedArguments(inner).map(
        (option) => option.toLowerCase()
      );
      if (options.length === 0) return void 0;
      const set = new Set(options);
      return (value) => {
        if (value === null || value === void 0) return false;
        if (Array.isArray(value)) {
          return value.some(
            (item) => typeof item === "string" && set.has(item.toLowerCase())
          );
        }
        return set.has(String(value).toLowerCase());
      };
    }
    case "time": {
      const pattern = unquote(inner);
      if (pattern === void 0) return void 0;
      return (value) => typeof value === "number" ? formatDurationPattern(normaliseDuration(value), pattern) : void 0;
    }
    case "date": {
      const pattern = unquote(inner);
      if (pattern === void 0) return void 0;
      return (value) => typeof value === "string" ? formatDatePattern(value, pattern) : void 0;
    }
    default:
      return void 0;
  }
}
function compilePlain(lower) {
  return (value) => {
    if (typeof value === "string") {
      const fn = stringModifiers[lower];
      return fn ? fn(value) : void 0;
    }
    if (Array.isArray(value)) {
      const fn = arrayModifiers[lower];
      return fn ? fn(value) : void 0;
    }
    if (typeof value === "number") {
      const fn = numberModifiers[lower];
      return fn ? fn(value) : void 0;
    }
    if (typeof value === "boolean") {
      const fn = booleanModifiers[lower];
      return fn ? fn(value) : void 0;
    }
    return void 0;
  };
}
function compileModifier(source) {
  const lower = source.toLowerCase();
  return compileConditional(lower) ?? compileParameterised(source, lower) ?? compilePlain(lower);
}

// packages/core/src/formatters/engine/comparators.ts
var comparatorFunctions = {
  and: (a, b) => a && b,
  or: (a, b) => a || b,
  xor: (a, b) => (a || b) && !(a && b),
  neq: (a, b) => a !== b,
  equal: (a, b) => a === b,
  left: (a) => a,
  right: (_, b) => b
};
var comparatorNames = Object.keys(comparatorFunctions);

// packages/core/src/formatters/engine/parser.ts
var comparators = () => comparatorNames;
var plainModifiers = () => PLAIN_MODIFIERS;
var PLAIN_MODIFIERS = [...allModifierNames].map((name) => name.toLowerCase()).sort((a, b) => b.length - a.length);
var PREFIX_OPERATORS = prefixOperators;
var CALL_MODIFIERS = [
  ["replace", "replaceArgs"],
  ["remove", "loose"],
  ["join", "quoted"],
  ["truncate", "digits"],
  ["slice", "digitsOrPair"],
  ["time", "quoted"],
  ["date", "quoted"],
  ["default", "quoted"],
  ["in", "loose"],
  ["translate", "quotedPair"]
];
var LOOKS_LIKE_EXPRESSION = /^\s*[A-Za-z_][A-Za-z0-9_]*\s*\.\s*[A-Za-z_][A-Za-z0-9_]*/;
var MAX_DIAGNOSTICS = 25;
var MAX_SPAN_SCAN = 4e3;
var NESTED_SAFE_CATEGORIES = /* @__PURE__ */ new Set([
  "unknown-field",
  "unknown-modifier",
  "modifier-arguments"
]);
var Scanner = class {
  constructor(input, pos = 0) {
    this.input = input;
    this.pos = pos;
  }
  get atEnd() {
    return this.pos >= this.input.length;
  }
  peek(offset = 0) {
    return this.input[this.pos + offset];
  }
  /** Case-insensitive literal match, consuming on success. */
  eat(literal) {
    const slice = this.input.substr(this.pos, literal.length);
    if (slice.toLowerCase() !== literal.toLowerCase()) return false;
    this.pos += literal.length;
    return true;
  }
  startsWith(literal) {
    return this.input.substr(this.pos, literal.length).toLowerCase() === literal.toLowerCase();
  }
  slice(from, to = this.pos) {
    return this.input.slice(from, to);
  }
};
function isIdentifierChar(char) {
  return char !== void 0 && /[A-Za-z0-9_]/.test(char);
}
function scanPrefixArgument(scanner) {
  while (!scanner.atEnd) {
    const char = scanner.peek();
    if (char === "}" || char === "[" || char === "]") break;
    if (char === ":" && scanner.peek(1) === ":") break;
    scanner.pos += 1;
  }
}
function scanQuotedArgument(scanner) {
  const quote = scanner.peek();
  if (quote !== "'" && quote !== '"') return false;
  scanner.pos += 1;
  while (!scanner.atEnd) {
    if (scanner.peek() === quote) {
      const after = scanner.peek(1);
      if (after === void 0 || after === "," || after === ")" || /\s/.test(after)) {
        scanner.pos += 1;
        return true;
      }
    }
    scanner.pos += 1;
  }
  return false;
}
function scanDigits(scanner) {
  const start = scanner.pos;
  while (scanner.peek() !== void 0 && /\d/.test(scanner.peek())) {
    scanner.pos += 1;
  }
  return scanner.pos > start;
}
function skipSpaces(scanner) {
  while (scanner.peek() !== void 0 && /\s/.test(scanner.peek())) {
    scanner.pos += 1;
  }
}
function scanLooseArgument(scanner) {
  let lastParen = -1;
  while (!scanner.atEnd) {
    const char = scanner.peek();
    if (char === "}" || char === "[" || char === "]") break;
    if (char === ":" && scanner.peek(1) === ":") break;
    if (char === ")") lastParen = scanner.pos;
    scanner.pos += 1;
  }
  if (lastParen === -1) return false;
  scanner.pos = lastParen;
  return true;
}
function scanCallArguments(scanner, shape) {
  if (!scanner.eat("(")) return false;
  switch (shape) {
    case "quoted":
      if (!scanQuotedArgument(scanner)) return false;
      break;
    case "quotedPair":
      if (!scanQuotedArgument(scanner)) return false;
      skipSpaces(scanner);
      if (!scanner.eat(",")) return false;
      skipSpaces(scanner);
      if (!scanQuotedArgument(scanner)) return false;
      break;
    case "replaceArgs":
      if (scanner.peek() === "{") {
        while (!scanner.atEnd && scanner.peek() !== "}") scanner.pos += 1;
        if (!scanner.eat("}")) return false;
      } else if (!scanQuotedArgument(scanner)) {
        return false;
      }
      skipSpaces(scanner);
      if (!scanner.eat(",")) return false;
      skipSpaces(scanner);
      if (!scanQuotedArgument(scanner)) return false;
      break;
    case "digits":
      if (!scanDigits(scanner)) return false;
      break;
    case "digitsOrPair":
      skipSpaces(scanner);
      if (!scanDigits(scanner)) return false;
      skipSpaces(scanner);
      if (scanner.eat(",")) {
        skipSpaces(scanner);
        if (!scanDigits(scanner)) return false;
        skipSpaces(scanner);
      }
      break;
    case "loose":
      return scanLooseArgument(scanner) && scanner.eat(")");
  }
  return scanner.eat(")");
}
function parseModifier(scanner) {
  const start = scanner.pos;
  for (const [name, shape] of CALL_MODIFIERS) {
    if (!scanner.startsWith(`${name}(`)) continue;
    scanner.pos += name.length;
    if (scanCallArguments(scanner, shape)) return scanner.slice(start);
    scanner.pos = start;
    break;
  }
  for (const operator of PREFIX_OPERATORS) {
    if (scanner.startsWith(operator)) {
      scanner.pos += operator.length;
      scanPrefixArgument(scanner);
      return scanner.slice(start);
    }
  }
  for (const name of plainModifiers()) {
    if (!scanner.startsWith(name)) continue;
    const after = scanner.peek(name.length);
    if (isIdentifierChar(after)) continue;
    scanner.pos += name.length;
    return scanner.slice(start);
  }
  scanner.pos = start;
  return void 0;
}
function parseOperandHead(scanner) {
  const start = scanner.pos;
  while (isIdentifierChar(scanner.peek())) scanner.pos += 1;
  let section = scanner.slice(start);
  if (!section || scanner.peek() !== ".") {
    scanner.pos = start;
    return void 0;
  }
  scanner.pos += 1;
  const propertyStart = scanner.pos;
  while (isIdentifierChar(scanner.peek())) scanner.pos += 1;
  let property = scanner.slice(propertyStart);
  if (!property) {
    scanner.pos = start;
    return void 0;
  }
  const canonical = canonicaliseField(section, property);
  if (!canonical) {
    scanner.pos = start;
    return void 0;
  }
  [section, property] = canonical;
  return { section, property };
}
function parseOperand(scanner) {
  let head;
  if (scanner.peek() === "'" || scanner.peek() === '"') {
    const quote = scanner.peek();
    const start = scanner.pos;
    scanner.pos += 1;
    const from = scanner.pos;
    while (!scanner.atEnd && scanner.peek() !== quote) scanner.pos += 1;
    if (scanner.atEnd) {
      scanner.pos = start;
      return void 0;
    }
    const literal = scanner.slice(from);
    scanner.pos += 1;
    head = { section: "", property: "", literal };
  } else {
    head = parseOperandHead(scanner);
  }
  if (!head) return void 0;
  const modifiers = [];
  while (scanner.startsWith("::")) {
    const save = scanner.pos;
    scanner.pos += 2;
    if (comparators().some((c) => scanner.startsWith(`${c}::`))) {
      scanner.pos = save;
      break;
    }
    const modifier = parseModifier(scanner);
    if (modifier === void 0) {
      scanner.pos = save;
      break;
    }
    modifiers.push(modifier);
  }
  return { ...head, modifiers };
}
function parseCheck(scanner, onFail) {
  const start = scanner.pos;
  const fail = (reason) => {
    onFail?.(reason, scanner.pos);
    scanner.pos = start;
    return void 0;
  };
  if (!scanner.eat("[")) return fail("no-open");
  const branch = () => {
    if (!scanner.eat('"')) return void 0;
    let text = "";
    let depth = 0;
    while (!scanner.atEnd) {
      const char = scanner.peek();
      if (char === "\\" && scanner.peek(1) === '"') {
        text += '"';
        scanner.pos += 2;
        continue;
      }
      if (char === "{") depth += 1;
      else if (char === "}") depth = Math.max(0, depth - 1);
      else if (char === '"' && depth === 0) {
        scanner.pos += 1;
        return text;
      }
      text += char;
      scanner.pos += 1;
    }
    return void 0;
  };
  const trueStart = scanner.pos + 1;
  const trueTemplate = branch();
  if (trueTemplate === void 0) return fail("true-branch");
  if (!scanner.eat("||")) return fail("missing-or");
  const falseStart = scanner.pos + 1;
  const falseTemplate = branch();
  if (falseTemplate === void 0) return fail("false-branch");
  let absentTemplate;
  let absentStart;
  if (scanner.startsWith("||")) {
    scanner.pos += 2;
    absentStart = scanner.pos + 1;
    absentTemplate = branch();
    if (absentTemplate === void 0) return fail("absent-branch");
  }
  if (!scanner.eat("]")) return fail("missing-close");
  return {
    trueTemplate,
    falseTemplate,
    trueStart,
    falseStart,
    ...absentTemplate !== void 0 ? { absentTemplate, absentStart } : {}
  };
}
function parseGroupBody(scanner) {
  const start = scanner.pos;
  if (!scanner.eat("{?")) return void 0;
  const from = scanner.pos;
  let depth = 1;
  while (!scanner.atEnd) {
    if (scanner.startsWith("{?")) {
      depth += 1;
      scanner.pos += 2;
      continue;
    }
    if (scanner.startsWith("?}")) {
      depth -= 1;
      if (depth === 0) {
        const body = scanner.slice(from);
        scanner.pos += 2;
        return body;
      }
      scanner.pos += 2;
      continue;
    }
    scanner.pos += 1;
  }
  scanner.pos = start;
  return void 0;
}
function parseTool(scanner) {
  const start = scanner.pos;
  for (const tool of ["newLine", "removeLine"]) {
    if (scanner.eat(`{tools.${tool}}`)) return { kind: "tool", tool };
    scanner.pos = start;
  }
  return void 0;
}
function parseExpression(scanner) {
  const start = scanner.pos;
  const fail = () => {
    scanner.pos = start;
    return void 0;
  };
  if (!scanner.eat("{")) return fail();
  skipSpaces(scanner);
  const operands = [];
  const found = [];
  const first = parseOperand(scanner);
  if (!first) return fail();
  operands.push(first);
  while (scanner.startsWith("::")) {
    const save = scanner.pos;
    scanner.pos += 2;
    const comparator = comparators().find(
      (name) => scanner.startsWith(`${name}::`)
    );
    if (!comparator) {
      scanner.pos = save;
      break;
    }
    scanner.pos += comparator.length + 2;
    const operand = parseOperand(scanner);
    if (!operand) return fail();
    found.push(comparator.toLowerCase());
    operands.push(operand);
  }
  const check = scanner.peek() === "[" ? parseCheck(scanner) : void 0;
  skipSpaces(scanner);
  if (!scanner.eat("}")) return fail();
  return {
    kind: "expression",
    source: scanner.slice(start),
    operands,
    comparators: found,
    start,
    end: scanner.pos,
    ...check ? { check } : {}
  };
}
function offsetNodes(nodes, delta) {
  for (const node of nodes) {
    if (node.start !== void 0) node.start += delta;
    if (node.end !== void 0) node.end += delta;
    if (node.kind === "group") offsetNodes(node.nodes, delta);
    if (node.kind === "expression" && node.check) {
      const c = node.check;
      if (c.trueStart !== void 0) c.trueStart += delta;
      if (c.falseStart !== void 0) c.falseStart += delta;
      if (c.absentStart !== void 0) c.absentStart += delta;
    }
  }
}
function parseTemplate(template) {
  const scanner = new Scanner(template);
  const nodes = [];
  const diagnostics = [];
  let literalStart = 0;
  let recoveringUntil = 0;
  const flushLiteral = (end) => {
    if (end > literalStart) {
      const node = rawText(template.slice(literalStart, end));
      node.start = literalStart;
      node.end = end;
      nodes.push(node);
    }
  };
  while (!scanner.atEnd) {
    if (scanner.peek() !== "{") {
      scanner.pos += 1;
      continue;
    }
    const braceIndex = scanner.pos;
    if (scanner.startsWith("{?")) {
      const body = parseGroupBody(scanner);
      if (body !== void 0) {
        flushLiteral(braceIndex);
        const inner = parseTemplate(body);
        const offset = braceIndex + 2;
        diagnostics.push(
          ...inner.diagnostics.map((d) => ({ ...d, index: d.index + offset }))
        );
        offsetNodes(inner.nodes, offset);
        nodes.push({
          kind: "group",
          nodes: inner.nodes,
          start: braceIndex,
          end: scanner.pos
        });
        literalStart = scanner.pos;
        continue;
      }
      if (diagnostics.length < MAX_DIAGNOSTICS) {
        diagnostics.push({
          index: braceIndex,
          message: "unterminated group: no matching `?}`",
          source: template.slice(braceIndex, braceIndex + 2),
          category: "unterminated-group"
        });
      }
    }
    const node = parseTool(scanner) ?? parseExpression(scanner);
    if (!node) {
      const closing = template.indexOf("}", braceIndex);
      const inner = closing === -1 ? "" : template.slice(braceIndex + 1, closing);
      if (diagnostics.length < MAX_DIAGNOSTICS) {
        const diagnostic = diagnoseSpan(template, braceIndex);
        const nested = braceIndex < recoveringUntil;
        if (diagnostic && (!nested || NESTED_SAFE_CATEGORIES.has(diagnostic.category))) {
          diagnostics.push(diagnostic);
        }
      }
      recoveringUntil = Math.max(
        recoveringUntil,
        matchBrace(template, braceIndex).end
      );
      if (!inner.includes("{") && LOOKS_LIKE_EXPRESSION.test(inner)) {
        flushLiteral(braceIndex);
        nodes.push({
          kind: "raw",
          text: `{invalid_expression(${inner.trim()})}`,
          start: braceIndex,
          end: closing + 1
        });
        scanner.pos = closing + 1;
        literalStart = scanner.pos;
        continue;
      }
      scanner.pos = braceIndex + 1;
      continue;
    }
    flushLiteral(braceIndex);
    if (node.start === void 0) node.start = braceIndex;
    if (node.end === void 0) node.end = scanner.pos;
    nodes.push(node);
    literalStart = scanner.pos;
  }
  flushLiteral(template.length);
  return { nodes, diagnostics };
}
var ARGUMENT_EXAMPLES = {
  quoted: "('text')",
  quotedPair: "('from', 'to')",
  replaceArgs: "('find', 'replaceWith')",
  digits: "(3)",
  digitsOrPair: "(0, 3)",
  loose: "('a', 'b')"
};
function matchBrace(template, braceIndex) {
  let depth = 0;
  const limit = Math.min(template.length, braceIndex + MAX_SPAN_SCAN);
  for (let i = braceIndex; i < limit; i++) {
    const char = template[i];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return { end: i, terminated: true };
    }
  }
  return { end: limit, terminated: false };
}
function knownModifierNames() {
  return [
    .../* @__PURE__ */ new Set([...plainModifiers(), ...CALL_MODIFIERS.map(([name]) => name)])
  ];
}
function isKnownModifier(token) {
  return knownModifierNames().includes(token.toLowerCase());
}
function diagnoseSpan(template, braceIndex) {
  const { end, terminated } = matchBrace(template, braceIndex);
  const source = template.slice(braceIndex, terminated ? end + 1 : end);
  const inner = terminated ? source.slice(1, -1) : source.slice(1);
  if (!LOOKS_LIKE_EXPRESSION.test(inner)) return void 0;
  const at = (category, message, suggestion) => ({
    index: braceIndex,
    message,
    source,
    category,
    ...suggestion ? { suggestion } : {}
  });
  const badArguments = (token) => {
    const lower = token.toLowerCase();
    const call = CALL_MODIFIERS.find(([name]) => name === lower);
    return at(
      "modifier-arguments",
      call ? `modifier \`${token}\` has invalid arguments; expected \`${lower}${ARGUMENT_EXAMPLES[call[1]]}\`` : `modifier \`${token}\` takes no arguments`
    );
  };
  const scanner = new Scanner(source);
  scanner.eat("{");
  skipSpaces(scanner);
  const checkHead = () => {
    const headStart = scanner.pos;
    while (isIdentifierChar(scanner.peek())) scanner.pos += 1;
    const section = scanner.slice(headStart);
    if (!section || scanner.peek() !== ".") {
      scanner.pos = headStart;
      return void 0;
    }
    scanner.pos += 1;
    const propertyStart = scanner.pos;
    while (isIdentifierChar(scanner.peek())) scanner.pos += 1;
    const property = scanner.slice(propertyStart);
    if (!property || canonicaliseField(section, property)) return void 0;
    const suggestions = suggestField(section, property);
    const hint = suggestions.length ? ` \u2014 did you mean \`${suggestions.join("` or `")}\`?` : "";
    return at(
      "unknown-field",
      `unknown field \`${section}.${property}\`${hint}`,
      suggestions[0]
    );
  };
  const checkModifiers = () => {
    while (scanner.startsWith("::")) {
      const save = scanner.pos;
      scanner.pos += 2;
      if (comparators().some((c) => scanner.startsWith(`${c}::`))) {
        scanner.pos = save;
        return void 0;
      }
      const modifierStart = scanner.pos;
      if (parseModifier(scanner)) {
        if (scanner.peek() === "(") {
          return badArguments(scanner.slice(modifierStart));
        }
        continue;
      }
      if (PREFIX_OPERATORS.some((operator) => scanner.startsWith(operator))) {
        scanner.pos = save;
        return void 0;
      }
      const tokenStart = scanner.pos;
      while (isIdentifierChar(scanner.peek())) scanner.pos += 1;
      const token = scanner.slice(tokenStart);
      if (!token) return void 0;
      if (isKnownModifier(token)) return badArguments(token);
      const close = nearestName(token.toLowerCase(), knownModifierNames());
      return at(
        "unknown-modifier",
        `unknown modifier \`${token}\`${close ? ` \u2014 did you mean \`${close}\`?` : ""}`
      );
    }
    return void 0;
  };
  for (; ; ) {
    const head = checkHead();
    if (head) return head;
    const modifier = checkModifiers();
    if (modifier) return modifier;
    if (!scanner.startsWith("::")) break;
    const save = scanner.pos;
    scanner.pos += 2;
    const comparator = comparators().find((c) => scanner.startsWith(`${c}::`));
    if (!comparator) {
      scanner.pos = save;
      break;
    }
    scanner.pos += comparator.length + 2;
  }
  if (scanner.peek() === "[") {
    let failure;
    parseCheck(scanner, (reason, position) => {
      failure ??= { reason, at: position };
    });
    if (failure) {
      const message = describeCheckFailure(source, failure.reason, failure.at);
      if (message) return at("conditional", message);
    }
  }
  if (!terminated) {
    return at("unterminated", "unterminated expression: no closing `}`");
  }
  return at("unparseable", `unparseable expression: {${inner}}`);
}
function describeCheckFailure(source, reason, at) {
  if (reason === "no-open") return void 0;
  if (reason === "missing-close") {
    return "conditional is missing its closing `]`";
  }
  if (reason === "missing-or") {
    return "conditional branches must be separated by `||`";
  }
  if (at >= source.length) {
    return 'unterminated conditional branch: a nested `{` is missing its `}`, or the branch is missing its closing `"`';
  }
  if (source[at] === "\\" && source[at + 1] === '"') {
    return 'conditional branch starts with an escaped quote `\\"` \u2014 escapes only apply one nesting level deeper';
  }
  return 'conditional branch must start with `"`';
}

// packages/core/src/formatters/engine/compile.ts
var MAX_TEMPLATE_DEPTH = 5;
var renderBudget = MAX_RENDER_LENGTH;
function emit(render, parseValue) {
  if (renderBudget <= 0) return "";
  const text = render(parseValue);
  renderBudget -= text.length;
  return text;
}
function prepareOperand(node) {
  return {
    node,
    modifiers: node.modifiers.map((source) => ({
      source,
      apply: compileModifier(source)
    }))
  };
}
function resolveOperand(operand, parseValue, hooks) {
  if (operand.node.literal !== void 0) {
    const ctx2 = {
      resolveVariable: (source) => hooks.resolveVariable(source, parseValue)
    };
    let value = operand.node.literal;
    for (const { apply } of operand.modifiers) {
      const next = apply(value, parseValue, ctx2);
      if (next === void 0) break;
      value = next;
      if (typeof value === "string" && value.length > MAX_RENDER_LENGTH) {
        value = value.slice(0, MAX_RENDER_LENGTH);
        break;
      }
    }
    return { result: value, present: true };
  }
  const section = parseValue[operand.node.section];
  if (!section) {
    return { error: `{unknown_variableType(${operand.node.section})}` };
  }
  const property = section[operand.node.property];
  if (property === void 0) {
    return {
      error: `{unknown_propertyName(${operand.node.section}.${operand.node.property})}`
    };
  }
  const ctx = {
    resolveVariable: (source) => hooks.resolveVariable(source, parseValue)
  };
  let result = property;
  if (typeof property === "string") {
    result = sanitise(property);
  } else if (Array.isArray(property) && property.some((item) => typeof item === "string" && hasSentinel(item))) {
    result = property.map(
      (item) => typeof item === "string" ? sanitise(item) : item
    );
  }
  const present = isPresent(property) || operand.modifiers.some(
    ({ source }) => source.toLowerCase().startsWith("default(")
  );
  for (const { source, apply } of operand.modifiers) {
    const input = result;
    result = apply(input, parseValue, ctx);
    if (result !== void 0) {
      if (typeof result === "string" && result.length > MAX_RENDER_LENGTH) {
        result = result.slice(0, MAX_RENDER_LENGTH);
        break;
      }
      continue;
    }
    if (input === null || input === void 0) return { result: "", present };
    return {
      error: `{unknown_${Array.isArray(input) ? "array" : typeof input}_modifier(${source})}`
    };
  }
  return { result, present };
}
function resolveExpression(node, operands, parseValue, hooks) {
  if (operands.length === 1) {
    return resolveOperand(operands[0], parseValue, hooks);
  }
  let present = operandPresence(operands[0]);
  for (let i = 1; i < operands.length; i++) {
    const next = operandPresence(operands[i]);
    present = node.comparators[i - 1] === "or" ? present || next : present && next;
  }
  const allSame = node.comparators.every((c) => c === node.comparators[0]);
  const canShortCircuit = allSame && (node.comparators[0] === "and" || node.comparators[0] === "or");
  let result = resolveOperand(operands[0], parseValue, hooks);
  for (let i = 1; i < operands.length; i++) {
    if (result.error !== void 0) return result;
    const comparator = node.comparators[i - 1];
    if (canShortCircuit) {
      if (comparator === "and" && result.result === false)
        return { result: false, present };
      if (comparator === "or" && result.result === true)
        return { result: true, present };
    }
    const next = resolveOperand(operands[i], parseValue, hooks);
    if (next.error !== void 0) return next;
    try {
      result = {
        result: hooks.comparators[comparator](result.result, next.result)
      };
    } catch (error) {
      return {
        error: `{unable_to_compare(<${result.result}>::${comparator}::<${next.result}>, ${error})}`
      };
    }
  }
  return { result: result.result, present };
  function operandPresence(operand) {
    if (operand.node.literal !== void 0) return true;
    if (operand.modifiers.some(
      ({ source }) => source.toLowerCase().startsWith("default(")
    ))
      return true;
    const section = parseValue[operand.node.section];
    return section ? isPresent(section[operand.node.property]) : false;
  }
}
function compileNode(node, hooks, depth) {
  if (node.kind === "raw") {
    const text = node.text.replace(/\\n/g, "\n");
    return () => text;
  }
  if (node.kind === "tool") {
    const sentinel = node.tool === "newLine" ? NEW_LINE_SENTINEL : REMOVE_LINE_SENTINEL;
    return () => sentinel;
  }
  if (node.kind === "group") return compileGroup(node, hooks, depth);
  const operands = node.operands.map(prepareOperand);
  if (!node.check) {
    return (parseValue) => {
      const resolved = resolveExpression(node, operands, parseValue, hooks);
      return resolved.error ?? String(resolved.result ?? "");
    };
  }
  const whenTrue = compileTemplate(node.check.trueTemplate, hooks, depth + 1);
  const whenFalse = compileTemplate(node.check.falseTemplate, hooks, depth + 1);
  const whenAbsent = node.check.absentTemplate === void 0 ? void 0 : compileTemplate(node.check.absentTemplate, hooks, depth + 1);
  return (parseValue) => {
    const resolved = resolveExpression(node, operands, parseValue, hooks);
    if (resolved.error !== void 0) return resolved.error;
    if (!isPresent(resolved.result)) {
      return whenAbsent ? whenAbsent(parseValue) : "";
    }
    if (resolved.result !== true && resolved.result !== false) {
      return `{cannot_coerce_boolean_for_check_from(${resolved.result})}`;
    }
    return resolved.result ? whenTrue(parseValue) : whenFalse(parseValue);
  };
}
function isPresent(value) {
  if (value === void 0 || value === null) return false;
  if (typeof value === "string") return /\S/.test(value);
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
function compileGroup(node, hooks, depth) {
  const parts = node.nodes.map((child) => ({
    node: child,
    render: compileNode(child, hooks, depth),
    // a check produces output either way, so it never suppresses the group
    operands: child.kind === "expression" && !child.check ? child.operands.map(prepareOperand) : void 0
  }));
  return (parseValue) => {
    let out = "";
    for (const { node: child, render, operands } of parts) {
      if (operands) {
        const resolved = resolveExpression(
          child,
          operands,
          parseValue,
          hooks
        );
        if (resolved.error === void 0 && resolved.present === false)
          return "";
      }
      out += emit(render, parseValue);
    }
    return out;
  };
}
function compileTemplate(template, hooks, depth = 0) {
  if (depth > MAX_TEMPLATE_DEPTH) {
    hooks.onDepthExceeded?.(MAX_TEMPLATE_DEPTH);
    return () => template;
  }
  let source = template;
  for (const [key, replacement] of Object.entries(hooks.debugMacros ?? {})) {
    source = source.replace(`{debug.${key}}`, replacement);
  }
  const { nodes } = parseTemplate(source);
  const compiled = nodes.map((node) => compileNode(node, hooks, depth));
  const render = compiled.length === 1 ? compiled[0] : (parseValue) => {
    let out = "";
    for (const part of compiled) out += emit(part, parseValue);
    return out;
  };
  if (depth > 0) return render;
  return (parseValue) => {
    renderBudget = MAX_RENDER_LENGTH;
    return render(parseValue);
  };
}
export {
  comparatorFunctions,
  compileTemplate,
  parseTemplate
};
