

import Tap from 'tap'

import {LocaleStrings, getSystemLocale} from "../src/i18n";
import NodeFileOps from "../src/NodeFileOps";

let i18n
i18n = new LocaleStrings()
i18n.init(NodeFileOps)
i18n.loadForLocale(getSystemLocale())
i18n.loadForLocale('en')
i18n.loadForLocale('en-GB')
i18n.loadForLocale('fr-FR')
i18n.loadForLocale('fr-CA')

function apiTest() {
    Tap.test('API', t => {

        let r,x;

        r = i18n.getTokenDefault('@test.greeting')
        x = 'howdy dude'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = i18n.getTokenDefault('@missing:default string')
        x = 'default string'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = i18n.getTokenDefault('@missing:')
        x = ''
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = i18n.getTokenDefault('@test.greeting:something wrong @missing:default string')
        x = 'howdy dude default string'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = i18n.getTokenDefault('@test.foobar:foobar is @@key::value')
        x = 'foobar is @key:value'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        r = i18n.getTokenDefault('nothing to replace')
        x = 'nothing to replace'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        let objStr = {
            greet: "@test.greeting",
            miss: "@test.missing",
            another: "@test.another:another",
            subObj : {
                foobar: "@test.foobar:foobar"
            }
        }
        i18n.populateObjectStrings(objStr)
        r = objStr.greet;
        x = 'howdy dude' // en-US
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = objStr.miss; x = '%$$>test.missing<$$%'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = objStr.another; x = 'another'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = objStr.subObj.foobar; x = 'foobar'
        t.ok(r === x, `expected "${x}", got "${r}"`)

        objStr = {
            greet: "@test.greeting",
            miss: "@test.missing",
            another: "@test.another:another",
            subObj : {
                foobar: "@test.foobar:foobar"
            }
        }        
        let tobj = i18n.translateObjectStrings(objStr)
        r = tobj.greet, x = 'howdy dude'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = tobj.miss; x = '%$$>test.missing<$$%'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = tobj.another; x = 'another'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        r = tobj.subObj.foobar; x = 'foobar'
        t.ok(r === x, `expected "${x}", got "${r}"`)
        
        let list = i18n.getInstalledLocales()
        let expect = ['en-US', 'en', 'en-GB', 'fr-FR', 'fr-CA']
        t.ok(list.length === expect.length, 'Unexpected length in result ('+list.length+')')
        for(let i=0; i<list.length; i++) {
            r = list[i]
            x = expect[i]
            t.ok(r === x, `expected "${x}", got "${r}"`)
        }

        const ourLocales= ['en', 'en-GB', 'en-US', 'fr', 'fr-CA'] // es has no files, thus won't enum
        let i = 0;
        i18n.enumerateAvailableLocales(loc => {
            r = loc
            x = ourLocales[i++]
            if(x) {
                t.ok(r === x, `locale enumerate (${i}) expected "${x}", got "${r}"`)
            }

        })

        t.end()


    })
}

apiTest()

