# locale-string-tables

###### Foundational code for i18n locale based string table lookup

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![TotalDownloads][total-downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]: https://travis-ci.com/tremho/locale-string-tables.svg?branch=master

[build-url]: https://travis-ci.com/tremho/locale-string-tables

[npm-image]: http://img.shields.io/npm/v/@tremho/locale-string-tables.svg

[npm-url]: https://npmjs.org/package/@tremho/locale-string-tables

[downloads-image]: http://img.shields.io/npm/dm/@tremho/locale-string-tables.svg

[total-downloads-image]: http://img.shields.io/npm/dt/@tremho/locale-string-tables.svg?label=total%20downloads

[twitter-image]: https://img.shields.io/twitter/follow/Tremho1.svg?style=social&label=Follow%20me

[twitter-url]: https://twitter.com/Tremho1

This module allows localization strings to be provided for an array of languages and regions.
It has a cascading structure, so the more specific language + region entries
will supercede the more general language - only  entries, and finally
falling back to a 'common' group for strings that are not localized.

Pluralization is also supported, as are ordinals (as of 1.0.0)

This module is not meant to necessarily provide the end-all-be-all API
interface for your application and it's localization needs, but
rather the foundation for one that you may create within your
application.
It is an implementation of the time-honored design of using
key-value data sets to represent string by identifiers that
are switched in scope per the locale setting.

Since the strings are managed separately and as part of your
application's resources, you can easily choose whether you wish to
keep all the string tables for all locales bundled with a
single distributed application, or simply exclude those that
do not apply to certain regions in order to save bundle size.

In-memory, only those languages that have been loaded into scope
will occupy Javascript Array space.  Unused locales in the
data files will remain on disk.

-------
### Revision History

##### v 1.1.0 (prerelease)
- __new API:__  
  - added `enumerateAvailableLocales()`
- __changed API (breaking)__
    _These changes only affect apps needing to declare a `FileOps` object_
    - `FileOps` no longer support property `rootPath`.
    - `FileOps` now requires property `i18nPath`, to indicate the i18n folder directly.
    - Similarly, `init` parameter 'customLocation' behavior is modified as is no longer relative to the
    (now non-existent) `rootPath`
- __non-API changes__
    - Fix major bug in  loading of _pluralRules_ scripts.
    - documentation updates




##### v 1.0.0 - 1.0.1  
 - Initial release and subsequent doc updates

--------

### Setting up for use in an application

At the root of your project, create a folder named "i18n". Other names are possible,
but this is the standard default used by the library.

Within this folder, you may create a folder named 'common'.  This folder will hold
string definitions that are independent of language.

Create a new folder for each language that you will support, using the
ISO 639 2-letter language code (lower case) for that language (e.g. 'en', or 'fr')
In this language folder you will create files that define strings for a particular language,
but independent of region.  For example, English, regardless of whether it's US or GB.

Create a new folder for each language-region you will support, using the 
ISO 639 2-letter language code (lower case) followed by a dash ('-') and the
ISO 3166 2-letter region code (upper case), as in RFC 1766. (e.g. 'en-US').  
In these folders you will create files that define strings unique to this language region.
For example, idioms and phrases, or format order and detail.

You may also create folders named 'common-&lt;region>' where &lt;region> is the 
ISO 3166 code for regions that you will support.  
In these folders, you may wish to define strings (such as formats or other non-literal text)
that apply to a geographical region regardless of the language.

Your `i18n` folder tree might look like this, for instance:

        i18n
            common
                serviceEndpoints.json
                metricUnits.json
            common-US
                USImpUnits.json
            en
                dateStrings.json
                welcome.json
                account.json
                order.json   
            en-GB
                dateStrings.json
                welcome.json
                account.json
                order.json   
            es
                dateStrings.json
                welcome.json
                account.json
                order.json   
            fr
                dateStrings.json
                welcome.json
                account.json
                order.json   
            fr-CA
                welcomeCA.json
                orderCA.json

The `.json` files that are in each folder can have any
name, but must have the .json extension, and must contain valid 
JSON.  You may wish to choose file names that represent the
strings for use in various parts of your application, or
according to another scheme.

Identifiers are unique.  If an identifier exists in more than
one place, the one of the greatest hierarchical priority
will be the one used for that chosen locale.

For example, suppose strings representing formats and unit names for
the Metric system were defined in `metricUnits.json`, and 
placed in the `common` folder.  These strings will apply to
all languages, unless overridden.  Since the metric system
is used by most of the world, this is convenient.  However, since
the US does not use this system, the _same string identifiers_ are
defined in a file we'll call `USImpUnits.json` which is placed in the `common-US`
folder.  Since the `common-US` folder is more specific than the
`common` folder, these strings take precedence for the US region.
Since it's in the `common-US` folder, any locale language that
uses the US as its region will use the US standard definitions
for these unit strings, unless further overridden by a language
or language-region entry.

Precedence always occurs from most specific to least, so,
in order of precedence:

-   lang-region
-   lang
-   common-region
-   common

Note that strings are just that: Strings of text. Most commonly, 
these are translations of words and phrases into different
languages, but they may also be format templates, URLs, keywords,
or other text not necessarily meant for human reading, but 
nevertheless to be in context when in the prescribed locale scope.
You might think of these types of string resources almost 
like configuration settings.

A string table .json file entry is a straight-forward key/value
association between string identifiers (string ID) and the value of
that string in the target language.

Identifiers can be any legal JSON string you like.  However, 
the convention adopted and promoted by this library is to 
use prefix notation to help identify the context of the
string and its use in the application.  We've adopted the
convention of using dots (.) to separate prefix and suffix
portions of the identifier.  You may choose to do the same,
or you may wish to use something different, such as dashes, slashes.
spaces, or camelCase.  Try to be consistent with whatever
convention you choose, however, as string ids will multiply
and become complex to manage as your app grows.

#### Using _@tremho/gen-format_

Consider using the npm package [@tremho/gen-format](https://www.npmjs.com/package/@tremho/gen-format),
which provides generalized
formatting support including localization for Date/Time among other things, and
is based upon this library.  If you set up gen-format using the i18n tables that
are associated with it, you will have a pre-established localization structure
you can continue to populate with your own strings across a large number of
language locales.

If you use gen-format, you do not need to import or set up this 
@tremho/locale-string-tables module independently

### Using locale-string-tables

_Please note that all the code examples used here are
written using TypeScript. If using plain JavaScript, please
convert the `import` and `export` statements to valid `require`
and `module.exports` form (or other module syntax your framework may use)_

You must create an instance of locale-string-tables and
use this in your application.
The steps to creating and initializing the instance are as follows:

1.  install locale-string-version.
    If you haven't already, you can install it as follows:


    npm install @tremho/install-string-tables   

2.  Define a 'FileOps' object.
    This is simply an object with the following properties

-   function `read`(pathname) : a function that reads and
    returns the text from the given pathname
-   function `enumerate`(relDir, fileCallback) : a function that 
    recursively enumerates the directories starting at the folder 
    designated by `relDir`, a relative pathname as referenced from
    your project root (in which you have placed your `ii8n` folder tree).
    This function will send the files it finds within this tree back through fileCallback,
    with the fully realized pathname of the file as the argument.


-   string property or getter function `i18bnOath` : returns the
    relative or absolute path to the location of the _i18n_ folder that holds
    the locale strings, usually off of the application root path.

Since different applications may use this module in different
contexts, it is up to the application to supply these basic
file operations.  If you are working with Node, the following
code will work.  If you are relying on a different platform file
system, you will need to adjust to match your platform.

NodeFileOps.ts

        import * as fs from 'fs'
        import * as path from 'path'

        let root = './'

        class NodeFileOps {
           // read a text file, returning contents as string
            read(realPath:string): string {    
                return fs.readFileSync(realPath).toString()
            }
            // enumerate all files within the folder tree given,
            // sending paths to files found through callback
            enumerate(dirPath:string, callback:any) {
                let apath = path.normalize(path.join(root, dirPath))
                if(!fs.existsSync(apath)) {
                    console.warn('warning: path not found '+apath)
                    return;
                }
                let entries = fs.readdirSync(apath)
                entries.forEach(file => {
                    let pn = path.join(root, dirPath, file)
                    let state = fs.lstatSync(pn)
                    if(state.isDirectory()) {
                        this.enumerate(path.join(dirPath, file), callback)
                    } else {
                        callback(pn)
                    }
                })
            }
            
            // property (or getter) that provides the root path
            // that the `i18n` tree resides within.
            get i18nPath() { return './i18n/'}
        }

        // note that we instantiate this class before exporting
        export default new NodeFileOps()

3.  create a module for your instance.  In this example, we'll call this module
    `i18`.  It should start out looking something like this:

i18n.ts

        import {getSystemLocale, LocaleStrings}  from '@tremho/locale-string-tables'

        // Have  your fileops ready (change this import line to suit your own FileOps object)
        import {NodeFileOps} from './NodeFileOps' 

        // Construct the instance
        const i18n = new LocaleStrings()
        // init it with your fileops object
        i18n.init(NodeFileOps)

        // (optional) preload locales you wish to use
        // (they will load on demand anyway if you choose not to do that here)
        i18n.loadForLocale(getSystemLocale())
        i18n.loadForLocale('en')
        i18n.loadForLocale('en-GB')
        i18n.loadForLocale('fr-FR')
        i18n.loadForLocale('fr-CA')

        // set the current locale
        i18n.setLocale(getSystemLocale())

        // export this for your app to use
        export default i18n 

4.  Use and apply in your own modules


        import i18n from `./i18n'

        function someFunction() {
            // first english
            i18n.setLocale('en-US')
            let greet = i18n.getLocaleString('example.greeting')
            console.log(greet)
            // then french
            i18n.setLocale('fr-FR')
            greet = i18n.getLocaleString('example.greeting')
            console.log(greet)
            // then spanish
            i18n.setLocale('es-ES')
            greet = i18n.getLocaleString('example.greeting')
            console.log(greet)
        }

In this hypothetical module, if `someFunction` is called,
it will attempt to display a "hello" greeting in each of
the three selected languages.  What actually happens when
you run this will depend upon  your setup.

Create a file named `example.json` with the following contents
and place in a folder at `i18n/en`:

example.json

        {
            "example.greeting" : "Hello"
        }

Copy this file to folders at `i18n/es` and `i18n/fr` also, and 
then edit these so that the one in the `fr` folder looks like this:

        {
            "example.greeting" : "Bonjour"
        }

and the one in the `i18n/es` folder like this:

        {
            "example.greeting" : "Hola"
        }

Now when you run your app, it should work as expected.  If you 
ran this program before supplying these strings, or missing one of
the referenced languages, you would see both warning messages as
well as the string "%$$>example.greeting&lt;$$%" returned.

See the API docs for more on managing this behavior and using
strings.

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### getSystemLocale

Interrogates services of the underlying platform to determine the
current system locale.
For browser contexts, this comes from the window.navigator object
For Nativescript, this comes from the platform info
Node does not have a convenient means of identifying this, so
it falls to the default case, which is to assign the system locale
as 'en-US'

### init

We must initialize LocaleStrings with a FileOps object that contains the following methods:
 `read(filepath)` - read text from the given true file path (e.g. fs.readFileSync)
 `enumerate(relDir)` -- enumerates recursively the folder (relative to presumed root) and calls back with full file paths for each fle
 `i18nPath` -- a string property or getter function that returns the relative or absolute path to the presumed \`i18n' folder, usually at project root.

#### Parameters

-   `fileOps` **FileOps** object containing necessary file operations for this environment
-   `customLocation` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** optional path than overrides the `i18nPath` in `FileOps` as the folder off of root for the locale string files

### loadForLocale

Loads the translation string tables for a given locale,
but does not change the current setting.

#### Parameters

-   `locale` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the RFC 1766 language-region specifier

Returns **LoadStats** LoadStats object containing details of the loaded table

### setLocale

Switches to a new locale.
If the locale has not been previously loaded, it is loaded now.

#### Parameters

-   `locale` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the RFC 1766 language-region specifier

Returns **LoadStats** LoadStats object containing details of the table that has been set

### isLocaleLoaded

Tests to see if the given locale is loaded.

#### Parameters

-   `locale` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the RFC 1766 language-region specifier

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** `true` if the specified locale has been loaded

### hasLocaleString

Tests to see if the given string Id can be found in the current locale table.

#### Parameters

-   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the string identifier to find in the current locale

Returns **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** `true` if the specified string id exists in the currently active table

### getLocaleString

Returns the localized string according to the current locale for the
string Id passed.
If the string does not exist, the value supplied by `useDefault` is returned instead.
If useDefault is undefined, a decorated version of the string ID is returned, as "%$$>string.id&lt;$$%"
if `silent` is not true, the console will emit a warning indicating that the string Id requested is
not found in the table, and will show the default or decorated return value also.  This may be useful
in reconciling string tables. pass `true` for the `silent` option to prevent these messages.

#### Parameters

-   `id` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the string identifier to find in the current locale
-   `useDefault` **([string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String) \| [undefined](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined))** the string to return if the id is not found in the table.
    do not include, or use _undefined_ to have a 'decorated' version of the id returned in this case.
-   `silent` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** if the string id is not found, a warning is emitted to the console. Passing
    `true` here will silence these warnings.

### populateObjectStrings

Traverses the object (deep by default, or without recursion if `shallow` is true)
looking for string properties that begin with '@'.  These strings are parsed
as `@token:default`, meaning that the substring following the '@' character for the
remainder of the string or to the first occurrence of a ':' character is used as
a token into the locale string table.  If there is a : character in the string, the
substring following this is used as the default if the string table does not have
the token entry.
This is effectively equivalent to `getLocalString(token, default)` for the strings
converted.  This method is a convenient means of translating many strings at once
and for populating objects with values that include localizable string data.

Note that this version translates in place, without a return object.
This makes it unsuitable for re-translation, but useful for passing functional objects.

#### Parameters

-   `obj` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object to be traversed for '@token' and '@token:default' patterns.
-   `shallow` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** Optional; if true recursion is prohibited

### translateObjectStrings

Preferred method of translating a set of strings.
See `populateObjectStrings` for general description.
_However_: This makes a **COPY** of the passed-in object with the translated values.
This allows the original to be used for re-translation more easily.

#### Parameters

-   `obj` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Object to be traversed for '@token' and '@token:default' patterns.
-   `shallow` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** Optional; if true recursion is prohibited

Returns **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** Resulting object with translated strings.

### getTokenDefault

Parses an incoming string for possible localized substitutions.
String is searched  for patterns of the form `@token:default`, meaning that
the substring following the '@' character to the first occurrence of a ':' character,
or else the remainder of the string, is used asa token into the locale string table.
If there is a : character in the string, the
substring following, up to the next '@' or the end of the string is used as the
default if the string table does not have the token entry.
This is effectively equivalent to `getLocalString(token, default)` for the strings
converted.
If a literal '@' or ':' is desired, use `@@` and `::`, respectively

#### Parameters

-   `inStr` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the string with @token:default substitutions to make
-   `silent`  

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** the returned translated or default string.

### getPluralizedString

Provides pluralization support.

Also provides ordinal counting support.  That is, return the "nth item".

In English, pluralization is pretty simple: You either have a singular or a plural.

The string tables alone could be used here: Lookup word.plural for counts != 1 and make sure the
table has the correct entries (e.g. 'dog' and 'dogs', 'sheep' and 'sheep', 'ox' and 'oxen')

Further, we could eliminate the need for too many duplicates by adding rules (i.e. append 's' by default)
that are overridden if there is a string table '.plural' entry.

Other languages are not so simple.  See discussion online for this topic in detail.
For example, Arabic or Russian (and other languages) support multiple forms of pluralized words for common items depending
upon the count.  There may be a different name for a 'few' things than for 'many'.  Or for 'zero'. Or when
fractional amounts are involved.  Some languages use different wording for counts with 1 as the last digit.
And so it goes.  Using tables with suffixes will work for all of these, but one must prepare.

The W3C intl spec for `PluralRules` and its `select` method support the following plural results:
 'one', 'two', 'few', 'many' and 'other', (where 'other' is synonymous with 'plural' by default).

This in turn should be used to look up the corresponding correct word form in the i18n table.

The i18n table for the language / locale must contain the word referenced in singular form and
_may also_ require the pluralized form(s) as needed (per language).

The pluralized form of the word is held in an id that is the same as the singular word identifier
plus a suffix (e.g. '.plural').  For example:

    "item.cow" : "cow",
    "item.cow.plural" : "cows",
    "item.sheep": "sheep",
    "item.sheep.plural" : "sheep"

 in other languages, one may use the other suffixes of
 ".zero", ".two", ".few", ".many" or "plural"

Note that these map directly to the terminology of the
W3C PluralRules specification, but with these exceptions:

-   The PluralRules 'one' is not used.  The "no-suffix" original identifier is used.
-   The PluralRules 'other' is changed to 'plural' as the suffix (more semantically aligned to english at least).

Note that "simple plurals" need not be literally provided in the table if the plurization script can assign
pluralization correctly.  For instance, in the above example, "item.cow" need not have a literal
"item.cow.plural" compliment, since the word "cow" can be automatically pluralized to "cows" correctly.
However, "item.sheep" will probably need the literal entry to prevent the algorithm from naming it as "sheeps".

Automatic pluralization is the domain of the `findPlurals` method.  The `plural-en.js` script provided
supplies the simple version for English, and handles appended "s" or "es" in most common cases, but does
not handle exceptions (so use literals when in doubt).

The `getPluralizedString` method encapsulates this into a single place.  However, it requires proper setup
to be useful.

Specific plural string ids can be placed directly into the string table data by including the suffix ".plural"
For example:

         animal.names.cow = 'cow'
         animal.names.cow.plural = 'cows'
         animal.names.sheep = 'sheep'
         animal.names.sheep.plural = 'sheep'

-   As noted, some languages pluralize differently depending upon the count, for example there may be different words
    for 1 cow, 2 cows, 6 cows, or 20 cows
    -   This is the role of `getPluralRulesSelect` (see below), or `Intl.PluralRules.select()` if available.
    -   This should be supported by relevant pluralRules scripts where possible and practical.
    -   To support this behavior using the string tables, append the 'select' result to the string id, as in:
                animal.name.cow
                animal.name.cow.two
                animal.name.cow.few
                animal.name.cow.many
                animal.name.cow.plural

Besides the string tables, the other source for pluralization is the `pluralRules` script.
This code is within a script named for the language, as in `pluralRules-en.js` for the `en` language.

This script may supply each of three methods.  These are optional, and default behavior will occur if not defined.

-   **`getPluralRulesSelect`** takes two arguments
-   `count` The number of items
-   `type` [optional] is one of 'cardinal' or 'ordinal'. 'cardinal' is the default. 'ordinal' is _not yet_ supported here.  See the PluralRules definitions of these.
    The function should return per `PluralRules.select` for this language.
    It may choose to implement directly as a pass through to `intl.PluralRules` if this is available.
    It must return one of 'zero', 'one', 'two', 'few', 'many', or 'other' accordingly.
    Note that for English, the allowed returns (for type 'cardinal') are 'one' and 'other'.
    (future support for 'ordinal' in English will define the other return values per intl spec)

-   **`findPlural`** takes two arguments
-   `single` The word in singular form
-   `count` The count to pluralize to
    The function should return the pluralized version of the word in that form, either by rule or
    internal lookup, or else return null.

-   If the plural rule script is not available, the `Intl.PluralRules` method will be used directly to
    get the correct plural suffixed string from the i18n table, assuming a full or partial implementation of W3C Intl is
    available to the system.

-   if the stringId has no singular entry in the table, then an empty string will be returned.

-   If none of these support features are available, all requests will return a string "%$<NO PLURALS lang >$%"
    (where _lang_ is the language requested).

###### Ordinal support in the pluralRules script

The `pluralRules-<lang>.js` script may also include support for ordinals by supplying the following function

-   **`makeOrdinal`** takes two arguments
-   `single` The word in singular form
-   `count` The count to make ordinal to
    The function should return the correct ordinal form of the word in that form, either by rule or
    internal lookup, or else return null.  The ordinal should contain the word as well, not just the count,
    For example, in English, sending asking for 0,1,2,3,11 and 99 'cows' would return
     "zeroeth cow", "first cow", "second cow", "third cow", "eleventh cow", "99th cow"

If the ordinal fails, the word itself is returned unmodified.

#### Parameters

-   `locale` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The locale to pluralize this id for. If not given, the system locale is used.
-   `stringId` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The i18n string identifier for the singular form of the word to pluralize
-   `count` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** The number of items involved in the pluralization or ordinal count
-   `type` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** alllowed types are 'cardinal' and 'ordinal', default is 'cardinal'.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### pluralize

Use the application-supplied `pluralRules-<lang>.js` to pluralize a word, or return it in ordinal form.
See the discussion of the `pluralRules` script in the documentation for `getPluralizedString`.
This function works the same way, but you pass the singular form word itself, not an identifier to look up in
the tables.

pluralRules-en.js is provided by this library.  Other languages do not have pluralRules scripts supplied.

#### Parameters

-   `locale` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The locale to pluralize this id for. If not given, the system locale is used.
-   `word` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** The word to be pluralized or ordinated, in singular form
-   `count` **[number](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number)** The number of items involved in the pluralization or ordinal count
-   `type` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)?** alllowed types are 'cardinal' and 'ordinal', default is 'cardinal'.

### getInstalledLocales

Returns an array of all the locales that have been currently loaded.

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)** {string} Array of loaded locale strings

### enumerateAvailableLocales

Enumerates all available locales by lang-region identifier
via a callback function that accepts the locale name as a string parameter.

This walks the _i18n_ folder tree to determine which potential locales are
available.  This differs from `getInstalledLocales`, which only lists those
that have been loaded into memory.

Note that folders in the _i18n_ tree that do not contain files will not be
enumerated.

The 'common' folders are not included in the enumeration, just the named languages
and regions.

#### Parameters

-   `callback`  a function that accepts the locale identifier as a string.  This function will be called for each locale enumerated.

### StringTable

String Tables are a simple name/value pairing from a JSON file.
This can be used as the basis for configuration, localization, or other common mappings.

All string table files are relative to the app folder root.

#### getString

Returns a string from the string table

##### Parameters

-   `name`  

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

#### setString

Sets the value of a string identifier.

##### Parameters

-   `name`  
-   `value`  

#### numStrings

Returns the number of strings in this table

#### load

Loads string values from a JSON file on disk.
This is an asynchronous non-blocking promise call.

##### Parameters

-   `filePath`  
-   `silent` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** `true` to supress file not found error.  Other errors may still throw.

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 
 
 
 
 
 
