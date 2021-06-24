
/*
 */

import {FileOps, StringTable} from "./StringTable";

// Support for Nativescript
let nsplatform, nsdevice
try {
    nsplatform = require('@nativescript/core/platform')
    nsdevice = nsplatform.device
} catch(e) {
}

let INTL = null

let systemLanguage = 'en'
let systemRegion = 'US'

let i18nFolder
let table
let installedLocales = {}

let gFileOps

/**
 * Interrogates services of the underlying platform to determine the
 * current system locale.
 * For browser contexts, this comes from the window.navigator object
 * For Nativescript, this comes from the platform info
 * Node does not have a convenient means of identifying this, so
 * it falls to the default case, which is to assign the system locale
 * as 'en-US'
 */
export function getSystemLocale():string {
    // nativescript
    if(nsdevice) {
        systemLanguage = (nsdevice.language || '').toLowerCase()
        systemRegion = (nsdevice.region || '').toUpperCase()
    } else if(typeof window !== 'undefined') {
        // browser context
        let language = 'en-US'
        if (window.navigator.languages) {
            language = window.navigator.languages[0];
        } else {
            language = (window.navigator as any).userLanguage || window.navigator.language;
        }
        let p = language.split('-')
        systemLanguage = p[0]
        systemRegion = p[1]
    } else {
        systemLanguage = 'en'
        systemRegion = 'US'
    }
    return systemLanguage+'-'+systemRegion
}

export class LocaleStrings {

    /**
     * We must initialize LocaleStrings with a FileOps object that contains the following methods:
     *  `read(filepath)` - read text from the given true file path (e.g. fs.readFileSync)
     *  `enumerate(relDir)` -- enumerates recursively the folder (relative to presumed root) and calls back with full file paths for each fle
     *  `rootPath` -- a string property or getter function that returns the relative or absolute path to the presumed root.
     *
     *  The `useIntl` flag controls whether or not W3C Intl library will be used at all.
     *  This may be useful in browser contexts, where full W3C support is available, or
     *  in Node environments if Node is built with full Intl support.
     *  If Intl is not available, or does not appear to support languages, it is disabled, regardless.
     *  The `customLocation` optional path can point to someting other than "i18n/" as the folder off of root for the locale string files.
     * @param fileOps
     * @param useIntl
     * @param customLocation
     */
    init(fileOps: FileOps, useIntl?: boolean, customLocation?:string):void {
        i18nFolder = customLocation || 'i18n/'
        gFileOps = fileOps
        if(useIntl) INTL = Intl
        installedLocales = {}
        this.loadForLocale(getSystemLocale())
        this.setLocale(getSystemLocale())
    }

    /**
     * Loads the translation string tables for a given locale,
     * but does not change the current setting.
     * @param locale
     */
    loadForLocale(locale):void {
        if(!locale) locale = getSystemLocale()
        // console.log('---->> loadForLocale ' + locale)
        if (installedLocales[locale]) {
          return installedLocales[locale]
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
        ftable.setFileOps(gFileOps)

        this.loadFromFolder(i18nFolder + 'common', ftable)
        this.loadFromFolder(i18nFolder + 'common-'+region, ftable)
        this.loadFromFolder(i18nFolder + lang, ftable)
        this.loadFromFolder(i18nFolder + lang+'-'+region, ftable)
        installedLocales[locale] = ftable
    }

    /**
     * Switches to a new locale.
     * If the locale has not been previously loaded, it is loaded now.
     * @param locale
     */
    setLocale(locale):void {
        if(!locale) locale = getSystemLocale()
        this.loadForLocale(locale); // test for load and load it if necessary.
        if(this.isLocaleLoaded(locale)) {
            table = installedLocales[locale]
        } else {
            throw 'Locale "'+locale+'" has not been loaded'
        }
    }

    // loads from an individual i18n folder and adds or overrides the strings in the table.
    private loadFromFolder(dirPath:string, ftable:StringTable):void {
        gFileOps.enumerate(dirPath, (filePath:string) => {
            ftable.load(filePath)
        })
    }

    /**
     * Tests to see if the given locale is loaded.
     * @param locale
     */
    isLocaleLoaded(locale):boolean {
        return !!installedLocales[locale]
    }

    /**
     * Tests to see if the given string Id can be found in the current locale table.
     * @param id
     */
    hasLocaleString(id):boolean {
        if (!table) throw (Error('i18n init() has not been called before using'))
        return table.getString(id) !== undefined
    }

    /**
     * Returns the localized string according to the current locale for the
     * string Id passed.
     * If the string does not exist, the value supplied by `useDefault` is returned instead.
     * If useDefault is undefined, a decorated version of the string ID is returned, as "%$$>string.id<$$%"
     * if `silent` is not true, the console will emit a warning indicating that the string Id requested is
     * not found in the table, and will show the default or decorated return value also.  This may be useful
     * in reconciling string tables. pass `true` for the `silent` option to prevent these messages.
     * @param id
     * @param useDefault
     * @param silent
     */
    getLocaleString(id, useDefault?:string, silent?:boolean):string {
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
    populateObjectStrings (obj, shallow) {
        Object.getOwnPropertyNames(obj).forEach(p => {
            if (typeof obj[p] === 'string') {
                const s = obj[p]
                if (s.charAt(0) === '@') {
                    let n = s.indexOf(':')
                    if (n === -1) n = undefined
                    const t = s.substring(1, n)
                    const d = n ? s.substring(n + 1) : undefined
                    obj[p] = this.getLocaleString(t, d, true)
                }
            } else if (!shallow && typeof obj[p] === 'object') {
                this.populateObjectStrings(obj[p], shallow)
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
    translateObjectStrings (obj, shallow) {
        const outObj = {}
        Object.getOwnPropertyNames(obj).forEach(p => {
            if (typeof obj[p] === 'string') {
                const s = obj[p]
                if (s.charAt(0) === '@') {
                    let n = s.indexOf(':')
                    if (n === -1) n = undefined
                    const t = s.substring(1, n)
                    const d = n ? s.substring(n + 1) : undefined
                    outObj[p] = this.getLocaleString(t, d, true)
                } else {
                    outObj[p] = obj[p]
                }
            } else if (!shallow && typeof obj[p] === 'object') {
                outObj[p] = this.translateObjectStrings(obj[p], shallow)
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
     * to be useful.
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
    getPluralizedString (stringId, count, type = 'cardinal') {
        let locale = getSystemLocale() // TODO support passed-in locale, which means something like what we have in formatter

        let prSelect
        let lang = locale.split('-')[0].toLowerCase()
        let ruleScript = i18nFolder + 'plurals-' + lang
        let rules = null
        try {
            rules = require(gFileOps.rootPath + ruleScript)
            if (rules.getPluralRulesSelect) {
                prSelect = rules.getPluralRulesSelect(count, type)
            }
        } catch (e) {
            console.error('No script')
        }

        if (!prSelect && Intl && Intl.PluralRules) {
            // @ts-ignore
            prSelect = new Intl.PluralRules(locale, { type }).select()
        }

        if (prSelect) {
            if (prSelect === 'other') prSelect = 'plural' // prefer this semantic to the w3c 'other' as more natural

            let single = this.getLocaleString(stringId)
            // return the single if one, or decorated id for non-find
            if (prSelect === 'one' || !this.hasLocaleString(stringId)) {
                return single
            }
            // return the pluralized version, if in the table
            let prId = stringId + '.' + prSelect
            // if not in table, see if we have a coded rule for it
            if (!this.hasLocaleString(prId)) {
                if (rules && rules.findPlural) {
                    let pl = rules.findPlural(single, count, type)
                    if (pl) return pl
                }
            }
            // if not in table, this will return decorated fail id
            return this.getLocaleString(prId)
        } else {
            return '%$<!--suppress HtmlUnknownTag --><NO PLURALS ' + lang + '>$%'
        }
    }

    /**
     * Returns an array of all the locales that have been currently loaded.
     */
    getInstalledLocales() {
        return Object.getOwnPropertyNames(installedLocales)
    }
}