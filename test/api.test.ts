

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

        let objStr = {
            greet: "@test.greeting",
            miss: "@test.missing",
            another: "@test.another:another",
            subObj : {
                foobar: "@test.foobar:foobar"
            }
        }
        i18n.populateObjectStrings(objStr)
        let r = objStr.greet, x = 'howdy dude' // en-US
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

        t.end()


    })
}

apiTest()


/*
    populateObjectStrings,
    translateObjectStrings,
    getInstalledLocales,
    clearInstalledLocale,
    getAvailableLanguages,
    getAvailableRegions,
    getPluralizedString,


 */