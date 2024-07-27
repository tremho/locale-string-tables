
/*
The primary i18n support foundation code.
 */

import {FileOps, StringTable} from "./StringTable";

// Support for Nativescript
let nsplatform:any, nsdevice:any
try {
    nsplatform = require('@nativescript/core/platform')
    nsdevice = nsplatform.device
} catch(e) {
}

let INTL = Intl

let systemLanguage = 'en'
let systemRegion = 'US'

let table
let gFileOps:FileOps

const requireOffset = '../' // because we're in a directory (src)

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

export class LoadStats {
    localeName:string
    commonFiles:number
    commonRegionFiles:number
    languageFiles:number
    regionFiles:number
    totalStrings: number
}

export class LocaleStrings {

    installedLocales:any = {}
    installedLocaleStats:any = {}

    fileOps:FileOps
    i18nFolder:string


    /**
     * We must initialize LocaleStrings with a FileOps object that contains the following methods:
     *  `read(filepath)` - read text from the given true file path (e.g. fs.readFileSync)
     *  `enumerate(relDir)` -- enumerates recursively the folder (relative to presumed root) and calls back with full file paths for each fle
     *  `i18nPath` -- a string property or getter function that returns the relative or absolute path to the presumed `i18n' folder, usually at project root.
     * @param {FileOps} fileOps - object containing necessary file operations for this environment
     * @param {string} [customLocation] - optional path than overrides the `i18nPath` in `FileOps` as the folder off of root for the locale string files
     */
    init(fileOps: FileOps, customLocation?:string):void {
        gFileOps = fileOps
        if(customLocation) {
            this.i18nFolder = customLocation
        } else {
            this.i18nFolder = gFileOps?.i18nPath ?? './i18n'
        }
        this.installedLocales = {}
        this.loadForLocale(getSystemLocale())
        this.setLocale(getSystemLocale())
    }

    /**
     * returns the path of the underlying tables
     */
    geti18nFolder() {
        return this.i18nFolder
    }

    /**
     * Loads the translation string tables for a given locale,
     * but does not change the current setting.
     * @param {string} locale - the RFC 1766 language-region specifier
     *
     * @return {LoadStats} LoadStats object containing details of the loaded table
     */
    loadForLocale(locale):LoadStats {
        if(!locale) locale = getSystemLocale()
        if (this.installedLocales[locale]) {
          return this.installedLocaleStats[locale]
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

        const stats = new LoadStats()
        stats.localeName = locale
        stats.commonFiles = this.loadFromFolder(this.i18nFolder + 'common', ftable)
        stats.commonRegionFiles = this.loadFromFolder(this.i18nFolder + 'common-'+region, ftable)
        stats.languageFiles = this.loadFromFolder(this.i18nFolder + lang, ftable)
        stats.regionFiles = this.loadFromFolder(this.i18nFolder + lang+'-'+region, ftable)
        stats.totalStrings = ftable.numStrings()
        this.installedLocales[locale] = ftable
        this.installedLocaleStats[locale] = stats

        return stats
    }

    /**
     * Switches to a new locale.
     * If the locale has not been previously loaded, it is loaded now.
     * @param {string} locale - the RFC 1766 language-region specifier
     *
     * @return {LoadStats} LoadStats object containing details of the table that has been set
     */
    setLocale(locale):LoadStats {
        if(!locale) locale = getSystemLocale()
        const stats = this.loadForLocale(locale); // test for load and load it if necessary.
        if(this.isLocaleLoaded(locale)) {
            table = this.installedLocales[locale]
        } else {
            throw 'Locale "'+locale+'" has not been loaded'
        }
        return stats
    }

    // loads from an individual i18n folder and adds or overrides the strings in the table.
    private loadFromFolder(dirPath:string, ftable:StringTable):number {
        let filesLoaded = 0
        gFileOps.enumerate(dirPath, (filePath:string) => {
            ftable.load(filePath)
            filesLoaded++
        })
        return filesLoaded
    }

    /**
     * Tests to see if the given locale is loaded.
     * @param {string} locale - the RFC 1766 language-region specifier
     *
     * @return {boolean} `true` if the specified locale has been loaded
     */
    isLocaleLoaded(locale):boolean {
        return !!this.installedLocales[locale]
    }

    /**
     * Tests to see if the given string Id can be found in the current locale table.
     * @param {string} id - the string identifier to find in the current locale
     *
     * @return {boolean} `true` if the specified string id exists in the currently active table
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
     * @param {string} id - the string identifier to find in the current locale
     * @param {string | undefined} useDefault - the string to return if the id is not found in the table.
     * do not include, or use _undefined_ to have a 'decorated' version of the id returned in this case.
     * @param {boolean} showWarn - if the string id is not found, a warning is emitted to the console. Passing
     * `false` here will silence these warnings.
     */
    getLocaleString(id, useDefault?:string, showWarn?:boolean):string {
        if (!table) throw (Error('i18n init() has not been called before using'))
        let rt = table.getString(id)
        if (rt === undefined) {
            rt = useDefault === undefined ? '%$$>' + id + '<$$%' : useDefault // decorated not-found identifier
            if (showWarn) console.warn('>>> i18n default >> "' + id + '": "' + rt + '"')
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
    populateObjectStrings (obj:any, shallow?:boolean):void {
        Object.getOwnPropertyNames(obj).forEach(p => {
            if (typeof obj[p] === 'string') {
                obj[p] = this.getTokenDefault(obj[p])
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
     * @param {object} obj  Object to be traversed for '@token' and '@token:default' patterns.
     * @param {boolean} [shallow] Optional; if true recursion is prohibited
     * @return {object} Resulting object with translated strings.
     */
    translateObjectStrings (obj:any, shallow?:boolean):any {
        const outObj = {}
        Object.getOwnPropertyNames(obj).forEach(p => {
            if (typeof obj[p] === 'string') {
                outObj[p] = this.getTokenDefault(obj[p])
            } else if (!shallow && typeof obj[p] === 'object') {
                outObj[p] = this.translateObjectStrings(obj[p], shallow)
            } else {
                outObj[p] = obj[p]
            }
        })
        return outObj
    }

    /**
     * Parses an incoming string for possible localized substitutions.
     * String is searched  for patterns of the form `@token:default`, meaning that
     * the substring following the '@' character to the first occurrence of a ':' character,
     * or else the remainder of the string, is used asa token into the locale string table.
     * If there is a : character in the string, the
     * substring following, up to the next '@' or the end of the string is used as the
     * default if the string table does not have the token entry.
     * This is effectively equivalent to `getLocalString(token, default)` for the strings
     * converted.
     * If a literal '@' or ':' is desired, use `@@` and `::`, respectively
     *
     * @param {string} inStr - the string with @token:default substitutions to make
     * @returns {string} - the returned translated or default string.
     */
    getTokenDefault(inStr:string, silent?:boolean):string {
        let outStr = ''
        let sp = 0
        let ti
        // prep for any escapes first
        inStr = inStr.replace(/@@/g, '%%AT%%').replace(/::/g, '%%SEP%%')
        if(inStr.indexOf('@') === -1) return inStr // return unmodified if no replacements will be made
        while((ti = inStr.indexOf('@', sp)) !== -1) {
            let ci = inStr.indexOf(':', ti)
            if(ci === -1) ci = inStr.length
            let tok = inStr.substring(ti+1, ci)
            let nti = inStr.indexOf('@', ci)
            if(nti === -1) nti = inStr.length;
            let def
            if(nti > ci) {
                def = inStr.substring(ci + 1, nti).replace('%%AT%%', '@').replace('%%SEP%%', ':')
            }

            let sub = this.getLocaleString(tok, def, silent)
            let pre = inStr.substring(sp, ti)
            outStr += pre + sub
            if(def && def.charAt(def.length-1) === ' ') outStr += ' '
            sp = nti
        }
        return outStr
    }

    /**
     * Provides pluralization support.
     *
     * Also provides ordinal counting support.  That is, return the "nth item".
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
     * For example, Arabic or Russian (and other languages) support multiple forms of pluralized words for common items depending
     * upon the count.  There may be a different name for a 'few' things than for 'many'.  Or for 'zero'. Or when
     * fractional amounts are involved.  Some languages use different wording for counts with 1 as the last digit.
     * And so it goes.  Using tables with suffixes will work for all of these, but one must prepare.
     *
     * The W3C intl spec for `PluralRules` and its `select` method support the following plural results:
     *  'one', 'two', 'few', 'many' and 'other', (where 'other' is synonymous with 'plural' by default).
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
     *  in other languages, one may use the other suffixes of
     *  ".zero", ".two", ".few", ".many" or "plural"
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
     * Specific plural string ids can be placed directly into the string table data by including the suffix ".plural"
     * For example:
     * ```
     *      animal.names.cow = 'cow'
     *      animal.names.cow.plural = 'cows'
     *      animal.names.sheep = 'sheep'
     *      animal.names.sheep.plural = 'sheep'
     * ```
     *  - As noted, some languages pluralize differently depending upon the count, for example there may be different words
     *  for 1 cow, 2 cows, 6 cows, or 20 cows
     *     - This is the role of `getPluralRulesSelect` (see below), or `Intl.PluralRules.select()` if available.
     *     - This should be supported by relevant pluralRules scripts where possible and practical.
     *     - To support this behavior using the string tables, append the 'select' result to the string id, as in:
     *     ```
     *         animal.name.cow
     *         animal.name.cow.two
     *         animal.name.cow.few
     *         animal.name.cow.many
     *         animal.name.cow.plural
     *      ```
     *
     * Besides the string tables, the other source for pluralization is the `pluralRules` script.
     * This code is within a script named for the language, as in `pluralRules-en.js` for the `en` language.
     *
     * This script may supply each of three methods.  These are optional, and default behavior will occur if not defined.
     *
     * - __`getPluralRulesSelect`__ takes two arguments
     *  - `count` The number of items
     *  - `type` [optional] is one of 'cardinal' or 'ordinal'. 'cardinal' is the default. 'ordinal' is *not yet* supported here.  See the PluralRules definitions of these.
     * The function should return per `PluralRules.select` for this language.
     * It may choose to implement directly as a pass through to `intl.PluralRules` if this is available.
     * It must return one of 'zero', 'one', 'two', 'few', 'many', or 'other' accordingly.
     * Note that for English, the allowed returns (for type 'cardinal') are 'one' and 'other'.
     * (future support for 'ordinal' in English will define the other return values per intl spec)
     *
     * - __`findPlural`__ takes two arguments
     *  - `single` The word in singular form
     *  - `count` The count to pluralize to
     * The function should return the pluralized version of the word in that form, either by rule or
     * internal lookup, or else return null.
     *
     * - If the plural rule script is not available, the `Intl.PluralRules` method will be used directly to
     * get the correct plural suffixed string from the i18n table, assuming a full or partial implementation of W3C Intl is
     * available to the system.
     *
     * - if the stringId has no singular entry in the table, then an empty string will be returned.
     *
     * - If none of these support features are available, all requests will return a string "%$<NO PLURALS lang >$%"
     * (where *lang* is the language requested).
     *
     * ##### Ordinal support in the pluralRules script
     *
     * The `pluralRules-<lang>.js` script may also include support for ordinals by supplying the following function
     * - __`makeOrdinal`__ takes two arguments
     *  - `single` The word in singular form
     *  - `count` The count to make ordinal to
     * The function should return the correct ordinal form of the word in that form, either by rule or
     * internal lookup, or else return null.  The ordinal should contain the word as well, not just the count,
     * For example, in English, sending asking for 0,1,2,3,11 and 99 'cows' would return
     *  "zeroeth cow", "first cow", "second cow", "third cow", "eleventh cow", "99th cow"
     *
     * If the ordinal fails, the word itself is returned unmodified.
     *
     * @param {string} locale  The locale to pluralize this id for. If not given, the system locale is used.
     * @param {string} stringId The i18n string identifier for the singular form of the word to pluralize
     * @param {number} count  The number of items involved in the pluralization or ordinal count
     * @param {string} [type]   alllowed types are 'cardinal' and 'ordinal', default is 'cardinal'.
     * @returns {string}
     */
    getPluralizedString (locale, stringId, count, type = 'cardinal') {

        if(!locale) locale = getSystemLocale()

        let prSelect
        let lang = locale.split('-')[0].toLowerCase()
        let ruleScript = 'pluralRules-' + lang + '.js'
        let rules = null
        try {
            const rpath = this.i18nFolder + ruleScript
            const path = require('path')
            const apath = path.resolve(rpath)
            rules = loadScriptModule(rpath)
            if (rules.getPluralRulesSelect) {
                prSelect = rules.getPluralRulesSelect(count, type)
            }
        } catch (e) {
            console.error('No pluralRules script found for '+lang+ ' in ' +this.i18nFolder)
        }

        // Use INTL if there
        if (!prSelect && INTL && INTL.PluralRules) {
            // @ts-ignore
            prSelect = new INTL.PluralRules(locale, { type }).select(count)
        }

        if (prSelect) {
            if (prSelect === 'other') prSelect = 'plural' // prefer this semantic to the w3c 'other' as more natural

            let single = this.getLocaleString(stringId)

            if(!this.hasLocaleString(stringId)) return "" // return empty string if we have no singular ent

            if(type === 'ordinal') {
                return this.pluralize(locale, single, count, type)
            }
            // for cardinal, don't call pluralize because we are still working with ids.
            // return the single if one, or decorated id for non-find
            if (prSelect === 'one') {
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
            return '%$<NO PLURALS ' + lang + '>$%'
        }
    }

    /**
     * Use the application-supplied `pluralRules-<lang>.js` to pluralize a word, or return it in ordinal form.
     * See the discussion of the `pluralRules` script in the documentation for `getPluralizedString`.
     * This function works the same way, but you pass the singular form word itself, not an identifier to look up in
     * the tables.
     *
     * pluralRules-en.js is provided by this library.  Other languages do not have pluralRules scripts supplied.
     *
     * @param {string} locale  The locale to pluralize this id for. If not given, the system locale is used.
     * @param {string} word  The word to be pluralized or ordinated, in singular form
     * @param {number} count  The number of items involved in the pluralization or ordinal count
     * @param {string} [type]   alllowed types are 'cardinal' and 'ordinal', default is 'cardinal'.
     */
    pluralize(locale, word, count, type = 'cardinal') {

        if(!locale) locale = getSystemLocale()

        let prSelect
        let lang = locale.split('-')[0].toLowerCase()
        let ruleScript = 'pluralRules-' + lang + '.js'
        let rules = null
        try {
            rules = loadScriptModule(this.i18nFolder + ruleScript)
            if (rules.getPluralRulesSelect) {
                prSelect = rules.getPluralRulesSelect(count, type)
            }
        } catch (e) {
        }

        // Use INTL if there
        if (!prSelect && INTL && INTL.PluralRules) {
            // @ts-ignore
            prSelect = new INTL.PluralRules(locale, { type }).select()
        }

        if(type === 'cardinal') {
            if (rules && rules.findPlural) {
                let pl = rules.findPlural(word, count, prSelect)
                if (pl) return pl
            } else {
                if(!rules) console.error('No pluralRules script found for '+lang+ ' in ' +this.i18nFolder)
            else console.error('No findPlural function found in pluralRules for '+lang)
                return word
            }
        }
        if(type === 'ordinal') {
            if (rules && rules.makeOrdinal) {
                let pl = rules.makeOrdinal(word, count, prSelect)
                if (pl) return pl
            } else {
                if(!rules) console.error('No pluralRules script found for '+lang+ ' in ' +this.i18nFolder)
                else console.error('No makeOrdinal function found in pluralRules for '+lang)
                return word
            }

        } else {
            console.error('Unrecognized pluralization type "'+type+'"')
            return word
        }


    }

    /**
     * Returns an array of all the locales that have been currently loaded.
     *
     * @returns {Array} {string} Array of loaded locale strings
     */
    getInstalledLocales() {
        return Object.getOwnPropertyNames(this.installedLocales)
    }

    /**
     * Enumerates all available locales by lang-region identifier
     * via a callback function that accepts the locale name as a string parameter.
     *
     * This walks the _i18n_ folder tree to determine which potential locales are
     * available.  This differs from `getInstalledLocales`, which only lists those
     * that have been loaded into memory.
     *
     * Note that folders in the _i18n_ tree that do not contain files will not be
     * enumerated.
     *
     * The 'common' folders are not included in the enumeration, just the named languages
     * and regions.
     *
     * @param callback - a function that accepts the locale identifier as a string.  This function will be called for each locale enumerated.
     */
    enumerateAvailableLocales(callback) {

        let lastLoc = ''

        let i18nComp = this.i18nFolder
        if(i18nComp.charAt(0) === '.' && i18nComp.charAt(1) === '/') i18nComp = i18nComp.substring(2)

        gFileOps.enumerate(this.i18nFolder, (filePath:string) =>  {
                let si = i18nComp.length
                let ni = filePath.indexOf('/', si)
                let loc = filePath.substring(si, ni)
                if(loc !== lastLoc && loc !== i18nComp && loc.substring(0, 6) !== 'common') {
                    lastLoc = loc
                    callback(loc)
                }
         })
    }
}

function loadScriptModule(path) {
    const source = gFileOps.read(path)
    const script = eval(source)
    return script
}