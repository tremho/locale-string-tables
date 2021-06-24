'use strict'

/**
 * @module i18n
 * @description
 * The i18n module is designed to handle internationalization concerns, primarily through the use of string tables
 * that map identifiers to words translated into each language.
 *
 * The string tables are kept within the i18n folder.
 * The i18n folder contains files that hold translation strings in a hierarchy in which
 * any strings in the 'common.json' file are loaded first. These strings are meant to be
 * common across languages and generally are used for default formats, etc.
 *
 * Additionally, regardless of language, the region itself may have a set of common defaults.
 * This optional file is named `common-RG.json` where **RG** is replaced by the locale code.
 *
 * For example, `common-US.json` would hold anything relevant to the US regardless of language, such
 * as currency formats or other civic or regionally specific patterns or configurations.  Generally not words, though,
 * since these are the domain of the language files.
 *
 * Next, the core language file is loaded (eg. 'en.json').  This file contains the translation
 * strings for that language that is the default for all locales.
 *
 * Next, the specific region is loaded (eg. 'en-GB.json') which will add or replace strings
 * with specific translations for the given region.
 *
 *
 * While most identifiers are assigned by the app, some identifiers are pre-set, or use pre-established templates
 * for naming, to coincide with use by the Formatter and for use in i18n supported pluralization.
 *
 * Identifiers beginning with "formatter." are reserved for use by the Formatter in international contexts.
 * These affect formatting numbers, currencies, measure units, and date/time values.
 *
 * Pluralization is handled via suffixes ('.plural', or '.two', '.few', and '.many')
 *
 * Strings themselves are accessed with `getLocaleString`, naming the identifier.  The word for the
 * current language is returned per entry in the table.
 *
 * Strings not found in the table will return as 'decorated fails' in which the identifier is encased
 * in bookended tokens:  "%$<missing.identifier>$%"
 *
 * Use the `translateObjectStrings` method for a convenient way to establish a set of localized values.
 *
 * See the docs for all the i18n methods.  All i18n methods are static.
 *
 * TODO: Support indirect reference with @  e.g. "another.use.of.word": "@original.translation.of.word"
 *
 */

const platform = require('tns-core-modules/platform')
const nsfs = require('tns-core-modules/file-system')
const StringTable = require('./StringTable')

const availableLangs = []
const availableRegions = {}

/**
 * Accesses the system implmentation of the `W3C intl` library, if it exists.
 * @static
 */
const intl = require('nativescript-intl')

let i18nFolder = 'i18n/'

let systemLanguage, systemRegion
let table
let installedLocales = {}

// i18n
// common.json
// en.json
// common-US.json
// en-US.json
// en-GB.json
// de.json
// common-GB.json
// de-DE.json
// fr.json
// fr-CA.json
// fr-FR.json

/**
 * Initializes the i18n singleton table
 * @param {string} [customLocation] if given, defines the path (relative to app) for the i18n/ folder if
 * not the standard `i18n/` location.
 * @static
 */
function init (customLocation) {
  i18nFolder = customLocation || 'i18n/'
  table = new StringTable()
  installedLocales = {}
  getSystemLocale()
}

/**
 * Retrieves and reports the locale of the device
 * @returns {string}
 * @static
 */
function getSystemLocale () {
  systemLanguage = (platform.device.language || '').toLowerCase()
  systemRegion = (platform.device.region || '').toUpperCase()
  return systemLanguage + '-' + systemRegion
}

/**
 * Loads the table with the translation strings for the given locale from the i18n folder.
 * The i18n folder contains files that hold translation strings in a hierarchy in which
 * any strings in the 'common.json' file are loaded first. These strings are meant to be
 * common across languages and generally are used for default formats, etc.
 * Additionally, regardless of language, the region itself may have a set of common defaults.
 * This optional file is named `common-RG.json` where **RG** is replaced by the locale code.
 * For example, `common-US.json` would hold anything relevant to the US regardless of language, such
 * as currency formats or other civic or regionally specific patterns or configurations.  Generally not words, though,
 * since these are the domain of the language files.
 * Next, the core language file is loaded (eg. 'en.json').  This file contains the translation
 * strings for that language that is the default for all locales.
 * Next, the specific region is loaded (eg. 'en-GB.json') which will add or replace strings
 * with specific translations for the given region.
 *
 * @param {string} locale  A BP47 language/region code (eg. 'en-US' or 'fr-CA')
 * @returns {Promise}
 * @static
 */
function loadForLocale (locale) {
  return loadForeignTable(locale).then(t => {
    table = t
  })
}

/**
 * Removes the named locale from storage when done using it.
 * Note: Will not remove the system locale
 * @param locale
 * @static
 */
function clearInstalledLocale (locale) {
  delete installedLocales[locale]
}

/**
 * Returns the list of locale tables currently held in memory.
 * @static
 */
function getInstalledLocales () {
  return Object.getOwnPropertyNames(installedLocales)
}

/**
 * Tests if the given locale is loaded
 * @static
 */
function isLocaleLoaded (locale) {
  return getInstalledLocales().indexOf(locale) !== -1
}

/**
 * Synchronous version of `loadForLocale`
 * @param locale
 * @static
 */
function loadForLocaleSync (locale) {
  table = loadForeignTableSync(locale)
}

function enumerateAvailableLanguagesAndRegions () {
  const folder = nsfs.Folder.fromPath(nsfs.knownFolders.currentApp().path + '/' + i18nFolder)
  folder.eachEntity(e => {
    if (e._extension === '.json') {
      let n = e.name.substring(0, e.name.indexOf(e._extension))
      let p = n.split('-')
      if (p[0]) {
        if (p[0] !== 'common') {
          availableLangs.push(p[0])
        }
        if (p[1]) {
          if (!availableRegions[p[0]]) {
            availableRegions[p[0]] = []
          }
          availableRegions[p[0]].push(p[1])
        }
      }
    }
  })
}

/**
 * Returns the enumeration result of the i18n folder for the installed language codes.
 * First invocation will do the enumeration. Subsequent invocations read the cached results.
 */
function getAvailableLanguages () {
  if (availableLangs.length === 0) {
    enumerateAvailableLanguagesAndRegions()
  }
  return availableLangs
}

/**
 * Returns all of the available countries for this language
 * First invocation will do the enumeration. Subsequent invocations read the cached results.
 * @param language
 * @returns {string[]}
 */
function getAvailableRegions (language) {
  if (availableLangs.length === 0) {
    enumerateAvailableLanguagesAndRegions()
  }
  let all = availableRegions[language] || []
  return all.concat(availableRegions.common || [])
}

/**
 * Loads and returns a StringTable that is populated for use in i18n style conversions
 * but does NOT install is as the selected locale.
 *
 * @param locale
 * @returns {Promise<StringTable>}
 * @static
 */
function loadForeignTable (locale) {
  console.log('LoadForeignTable ' + locale)
  if (installedLocales[locale]) {
    return Promise.resolve(installedLocales[locale])
  }
  const parts = locale.split('-')
  let lang = (parts[0] || '').toLowerCase()
  if (!lang) {
    lang = systemLanguage
  }
  let region = (parts[1] || '').toUpperCase()
  if (!region) {
    region = systemRegion
  }
  const ftable = new StringTable()
  // Load the common, language, and locale files in order
  return ftable.load(i18nFolder + 'common.json', true).then(() => {
    return ftable.load(i18nFolder + 'common-' + region + '.json', true).then(() => {
      return ftable.load(i18nFolder + lang + '.json', true).then(() => {
        return ftable.load(i18nFolder + lang + '-' + region + '.json', true).then(() => {
          installedLocales[locale] = ftable
          return ftable
        })
      })
    })
  })
}

/**
 * Synchronously loads and returns a StringTable that is populated for use in i18n style conversions
 * but does NOT install is as the selected locale.

 * @param locale
 * @returns {StringTable}
 * @static
 */
function loadForeignTableSync (locale) {
  console.log('---->> LoadForeignTableSync for ' + locale)
  // if (installedLocales[locale]) {
  //   return installedLocales[locale]
  // }
  const parts = locale.split('-')
  let lang = (parts[0] || '').toLowerCase()
  if (!lang) {
    lang = systemLanguage
  }
  let region = (parts[1] || '').toUpperCase()
  if (!region) {
    region = systemRegion
  }
  const ftable = new StringTable()
  const silent = false // set false to throw error if one of the files is missing, which may not be a real problem...

  // todo: maybe define an option config: common, commonRegion, lang, region that if present (true), names what is expected (not silent))
  // e.g. we have en.commom and US.common, so en-US is implied and not explicity
  // Load the common, language, and locale files in order
  ftable.loadSync(i18nFolder + 'common.json', silent) // this probably should be ther
  ftable.loadSync(i18nFolder + 'common-' + region + '.json', silent) // may not be if are singling out lang/reg
  ftable.loadSync(i18nFolder + lang + '.json', silent) // should be unless we are only a few regions
  ftable.loadSync(i18nFolder + lang + '-' + region + '.json', silent) // for example, en-US is not explicitly in the set
  installedLocales[locale] = ftable
  return ftable
}

/**
 * Returns true if the table contains a translation for the given string id
 *
 * @param id
 * @returns {boolean}
 * @static
 */
function hasLocaleString (id) {
  if (!table) throw (Error('i18n init() has not been called before using'))
  return table.getString(id) !== undefined
}

/**
 * Returns the translated string for the given id, if it exists.
 * If it does not exist, and useDefault has been passed, this default value is returned instead.
 * If useDefault is not passed, the returned value will be the id decorated with a prefix of "%$>" and a
 * suffix of "<$%".  This may be helpful in recognizing omissions in the string table during development.
 *
 * If the string does not exist in the table, it will be logged to the console
 *
 * @param {string} id  The string id to look up
 * @param {string} [useDefault] If given, will be the default value if the id does not exist in the table
 * @param {boolean} [silent] If given as true, will prevent console logging of use of default.
 * @static
 */
function getLocaleString (id, useDefault, silent) {
  if (!table) throw (Error('i18n init() has not been called before using'))
  let rt = table.getString(id)
  if (rt === undefined) {
    rt = useDefault === undefined ? '%$$>' + id + '<$$%' : useDefault // decorated not-found identifier
    if (!silent) console.warn('>> i18n default >> "' + id + '": "' + rt + '"')
  }
  return rt
}

/**
 * Traverses the object (deep by default, or without recursion if `shallow` is true)
 * looking for string properties that begin with '@'.  These strings are parsed
 * as `@token:default`, meaning that the substring following the '@' character for the
 * remainder of the string or to the first occurrence of a ':' character is used as
 * a token into the locale string table.  If there is a : character in the string, the
 * substring following this is used as the default if the string table does not have
 * the token entry.
 * This is effectively equivalent to `getLocalString(token, default)` for the strings
 * converted.  This method is a convenient means of translating many strings at once
 * and for populating objects with values that include localizable string data.
 *
 * Note that this version translates in place, without a return object.
 * This makes it unsuitable for re-translation, but useful for passing functional objects.
 *
 * @param {object} obj  Object to be traversed for '@token' and '@token:default' patterns.
 * @param {boolean} [shallow] Optional; if true recursion is prohibited
 * @static
 */
function populateObjectStrings (obj, shallow) {
  Object.getOwnPropertyNames(obj).forEach(p => {
    if (typeof obj[p] === 'string') {
      const s = obj[p]
      if (s.charAt(0) === '@') {
        let n = s.indexOf(':')
        if (n === -1) n = undefined
        const t = s.substring(1, n)
        const d = n ? s.substring(n + 1) : undefined
        obj[p] = getLocaleString(t, d)
      }
    } else if (!shallow && typeof obj[p] === 'object') {
      populateObjectStrings(obj[p])
    }
  })
}

/**
 * Preferred method of translating a set of strings.
 * See `populateObjectStrings` for general description.
 * _However_: This makes a __COPY__ of the passed-in object with the translated values.
 * This allows the original to be used for re-translation more easily.
 *
 * @param obj
 * @param shallow
 * @return {object} Resulting object with translated strings.
 */
function translateObjectStrings (obj, shallow) {
  const outObj = {}
  Object.getOwnPropertyNames(obj).forEach(p => {
    if (typeof obj[p] === 'string') {
      const s = obj[p]
      if (s.charAt(0) === '@') {
        let n = s.indexOf(':')
        if (n === -1) n = undefined
        const t = s.substring(1, n)
        const d = n ? s.substring(n + 1) : undefined
        outObj[p] = getLocaleString(t, d)
      } else {
        outObj[p] = obj[p]
      }
    } else if (!shallow && typeof obj[p] === 'object') {
      outObj[p] = translateObjectStrings(obj[p])
    } else {
      outObj[p] = obj[p]
    }
  })
  return outObj
}

/**
 * Provides pluralization support.
 *
 * In English, pluralization is pretty simple: You either have a singular or a plural.
 *
 * The string tables alone could be used here: Lookup word.plural for counts != 1 and make sure the
 * table has the correct entries (e.g. 'dog' and 'dogs', 'sheep' and 'sheep', 'ox' and 'oxen')
 *
 * Further, we could eliminate the need for too many duplicates by adding rules (i.e. append 's' by default)
 * that are overridden if there is a string table '.plural' entry.
 *
 * Other languages are not so simple.  See discussion online for this topic in detail.
 * For example, Russian (and other languages) support multiple forms of pluralized words for common items depending
 * upon the count.  There may be a different name for a 'few' things than for 'many'.  Or for 'zero'. Or when
 * fractional amounts are involved.  Some languages use different wording for counts with 1 as the last digit.
 * And so it goes.  Using tables with suffixes will work for all of these, but one must prepare.
 *
 * The W3C intl spec for `PluralRules` and its `select` method support the following plural results:
 *  'one', 'two', 'few', 'many' and 'other', (where other is synonymous with 'plural' by default).
 *
 * This in turn should be used to look up the corresponding correct word form in the i18n table.
 *
 * The i18n table for the language / locale must contain the word referenced in singular form and
 * *may also* require the pluralized form(s) as needed (per language).
 *
 * The pluralized form of the word is held in an id that is the same as the singular word identifier
 * plus a suffix (e.g. '.plural').  For example:
 *
 *  ```
 *  "item.cow" : "cow",
 *  "item.cow.plural" : "cows",
 *  "item.sheep": "sheep",
 *  "item.sheep.plural" : "sheep"
 *  ```
 *
 *  in other languages (or for ordinal support), one may use the other suffixes of
 *  ".two", ".few", ".many" or "plural"
 *
 * Note that these map directly to the terminology of the
 * W3C PluralRules specification, but with these exceptions:
 *  - The PluralRules 'one' is not used.  The "no-suffix" original identifier is used.
 *  - The PluralRules 'other' is changed to 'plural' as the suffix (more semantically aligned to english at least).
 *
 * Note that "simple plurals" need not be literally provided in the table if the plurization script can assign
 * pluralization correctly.  For instance, in the above example, "item.cow" need not have a literal
 * "item.cow.plural" compliment, since the word "cow" can be automatically pluralized to "cows" correctly.
 * However, "item.sheep" will probably need the literal entry to prevent the algorithm from naming it as "sheeps".
 *
 * Automatic pluralization is the domain of the `findPlurals` method.  The `plural-en.js` script provided
 * supplies the simple version for English, and handles appended "s" or "es" in most common cases, but does
 * not handle exceptions (so use literals when in doubt).
 *
 * The `getPluralizedString` method encapsulates this into a single place.  However, it requires proper setup
 * to be usefule.
 *
 * It relies upon application-supplied code within the `i18n` folder.
 * This code is within a script named for the language, as in `plurals-en.js` for the `en` language.
 *
 * This script may supply each of two methods.  These are optional, and default behavior will occur if not defined.
 *
 * - __`getPluralRulesSelect`__ takes two arguments
 *  - `count` The number of items
 *  - `type` [optional] is one of 'cardinal' or 'ordinal'. 'cardinal' is the default. 'ordinal' is *not yet* supported here.  See the PluralRules definitions of these.
 * The function should return per `PluralRules.select` for this language.
 * It may choose to implement directly as a pass through to `intl.PluralRules` if this is available.
 * It must return one of 'one', 'two', 'few', 'many', or 'other' accordingly.
 * Note that for English, the allowed returns (for type 'cardinal') are 'one' and 'other'.
 * (future support for 'ordinal' in English will define the other return values per intl spec)
 *
 * - __`findPlural`__ takes three arguments
 *  - `single` The word in singular form
 *  - `count` The count to pluralize to
 *  - `type` Optional. 'cardinal' is the default. 'ordinal' is not yet supported.
 * The function should return the pluralized version of the word in that form, either by rule or
 * internal lookup, or else return null.
 *
 * - If the plural rule script is not available, the `intl.PluralRules` method will be used directly to
 * get the correct plural suffixed string from the i18n table.
 *
 * - If neither of these support features are available, all requests will return a string "%$<NO PLURALS lang >$%"
 * (where *lang* is the language requested).
 *
 *
 * Note: future support for 'ordinal' and support for passed-in locale may be added later
 *
 * @param {string} stringId The i18n string identifier for the singular form of the word to pluralize
 * @param {number} count
 * @param {string} [type]   default is 'cardinal'.  'ordinal' is *not yet* supported here.
 * @returns {string}
 * @static
 */
function getPluralizedString (stringId, count, type = 'cardinal') {
  let locale = getSystemLocale() // TODO support passed-in locale, which means something like what we have in formatter

  let prSelect
  let lang = locale.split('-')[0].toLowerCase()
  let ruleScript = i18nFolder + 'plurals-' + lang
  let rules = null
  try {
    rules = require('../' + ruleScript)
    if (rules.getPluralRulesSelect) {
      prSelect = rules.getPluralRulesSelect(count, type)
    }
  } catch (e) {
    console.error('No script')
  }

  if (!prSelect && intl && intl.PluralRules) {
    prSelect = new intl.PluralRules(locale, { type }).select()
  }

  if (prSelect) {
    if (prSelect === 'other') prSelect = 'plural' // prefer this semantic to the w3c 'other' as more natural

    let single = getLocaleString(stringId)
    // return the single if one, or decorated id for non-find
    if (prSelect === 'one' || !hasLocaleString(stringId)) {
      return single
    }
    // return the pluralized version, if in the table
    let prId = stringId + '.' + prSelect
    // if not in table, see if we have a coded rule for it
    if (!hasLocaleString(prId)) {
      if (rules && rules.findPlural) {
        let pl = rules.findPlural(single, count, type)
        if (pl) return pl
      }
    }
    // if not in table, this will return decorated fail id
    return getLocaleString(prId)
  } else {
    return '%$<!--suppress HtmlUnknownTag --><NO PLURALS ' + lang + '>$%'
  }
}

init() // default initialization is automatic

module.exports = {
  intl,
  init,
  getSystemLocale,
  isLocaleLoaded,
  loadForLocale,
  loadForLocaleSync,
  hasLocaleString,
  getLocaleString,
  getPluralizedString,
  populateObjectStrings,
  translateObjectStrings,
  loadForeignTable,
  loadForeignTableSync,
  getInstalledLocales,
  clearInstalledLocale,
  getAvailableLanguages,
  getAvailableRegions
}
