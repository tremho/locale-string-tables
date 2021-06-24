# locale-string-tables

###### Let the robots test code, but let people judge content

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![TotalDownloads][total-downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]: https://travis-ci.com/tremho/locale-string-tables.svg?branch=master
[build-url]: https://travis-ci.org/tremho/locale-string-tables
[npm-image]: http://img.shields.io/npm/v/locale-string-tables.svg
[npm-url]: https://npmjs.org/package/locale-string-tables
[downloads-image]: http://img.shields.io/npm/dm/locale-string-tables.svg
[total-downloads-image]: http://img.shields.io/npm/dt/locale-string-tables.svg?label=total%20downloads
[twitter-image]: https://img.shields.io/twitter/follow/Tremho1.svg?style=social&label=Follow%20me
[twitter-url]: https://twitter.com/Tremho1


This module allows localization strings to be provided for an array of languages and regions.
It has a cascading structure, so the more specific language + region entries
will supercede the more general language - only  entries, and finally
falling back to a 'common' group for strings that are not localized.

Pluralization is also supported.

This module is not meant to necessarily provide the end-all-be-all API
interface for your application and it's localization needs, but
rather the foundation for one that you may create within your
application.
It is an imlementation of the time-honored design of using
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

### Setting up for use in an application

At the root of your project, create a folder named "i18n". Other names are possible,
but this is the standard default used by the library.

Within this folder, you may create a folder named 'common'.  This folder will hold
string definitions that are independent of language.

Create a new folder for each language that you will support, using the
ISO 639 2-letter language code (lower case) for that language (e.g. 'en', or 'fr')
In this folder you will create files that define strings for a particular language,
but independent of region.  For example, English, regardless of whether it's US or GB.

Create a new folder for each language-region you will support, using the 
ISO 639 2-letter language code (lower case) followed by a dash ('-') and the
ISO 3166 2-letter region code (upper case), as in RFC 1766. (e.g. 'en-US')
In these folders you will create files that define strings unique to this language region.
For example, idioms and phrases, or format order and detail.

You may also create folders named 'common-<region>' where <region> is the 
ISO 3166 code for regions that you will support.  
In these folders, you may wish to define strings (such as formats or other non-literal text)
that apply to a geographical region regardless of the language.

Your `i18n` folder tree might look like this, for instance:
```
    i18n
        common
            serviceEndpoints.json
            metricUnits.json
        common-us
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
```
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
- lang-region
- lang
- common-region
- common

Note that strings are just that: Strings of text. Most commonly, 
these are translations of words and phrases into different
languages, but they may also be format templates, URLs, keywords,
or other text not necessarily meant for human reading, but 
nevertheless to be in context when in the prescribed locale scope.

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

### Using locale-string-tables

_Please note that all the code examples used here are
written using TypeScript. If using plain JavaScript, please
convert the `import` and `export` statements to valid `require`
and `module.exports` form (or other module syntax your framework may use)_

You must create an instance of locale-string-tables and
use this in your application.
The steps to creating and initializing the instance are as follows:

1. install locale-string-version.
If you haven't already, you can install it as follows:


    npm install @tremho/install-string-tables   
   

2. Define a 'FileOps' object.
This is simply an object with the following properties

- function `read`(pathname) : a function that reads and
returns the text from the given pathname

  
- function `enumerate`(relDir, fileCallback) : a function that 
recursively enumerates the directories starting at the folder 
designated by `relDir`, a relative pathname as referenced from
your project root (in which you have placed your `ii8n` folder tree).
This function will send the files it finds within this tree back through fileCallback,
with the fully realized pathname of the file as the argument.


- string property or getter function `rootPath` : returns the
relative or absolute path to the root folder.

  
Since different applications may use this module in different
contexts, it is up to the application to supply these basic
file operations.  If you are working with Node, the following
code will work.  If you are relying on a different platform file
system, you will need to adjust to match your platform.


NodeFileOps.ts
```
import * as fs from 'fs'
import * as path from 'path'

let root = '/Users/sohmert/tbd/locale-string-tables/'

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
            console.error('error: path not found '+apath)
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
    get rootPath() { return '../../'}
}

// note that we instantiate this class before exporting
export default new NodeFileOps()
```

3. create a module for your instance.  In this example, we'll call this module
   `i18`.  It should start out looking something like this:

i18n.ts
```
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
```

4. Use and apply in your own modules

```
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

```

In this hypothetical module, if `someFunction` is called,
it will attempt to display a "hello" greeting in each of
the three selected languages.  What actually happens when
you run this will depend upon  your setup.

Create a file named `example.json` with the following contents
and place in a folder at `i18n/en`:

example.json
```
    {
        "example.greeting" : "Hello"
    }
```
Copy this file to folders at `i18n/es` and `i18n/fr` also, and 
then edit these so that the one in the `fr` folder looks like this:
```
    {
        "example.greeting" : "Bonjour"
    }
```
and the one in the `i18n/es` folder like this:
```
    {
        "example.greeting" : "Hola"
    }
```
Now when you run your app, it should work as expected.  If you 
ran this program before supplying these strings, or missing one of
the referenced languages, you would see both warning messages as
well as the string "%$$>example.greeting<$$%" returned.

See the API docs for more on managing this behavior and using
strings.


### API


### Known issues

There are currently no known issues.
See also the [Github repository issues page](https://github.com/tremho/humanTest/issues)

### Contributing and suggestions

We would love to hear from you!

If you have ideas for making `locale-string-tables` better, please visit
the [Github repository issues page](https://github.com/tremho/locale-string-tables/issues)
page and record your suggestions there.

If you would like to commit code that addresses an outstanding issue, please
fork the repository and post a pull request with your changes.

