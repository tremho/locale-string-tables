
import * as fs from 'fs'
import * as path from 'path'

let i18nRel = './i18n/'
let displayed = false

class NodeFileOps {
    read(realPath:string): string {
        // let apath = path.normalize(path.join(root, relPath))
        let contents = fs.readFileSync(realPath).toString()
        return contents
    }
    enumerate(dirPath:string, callback:any) {
        let apath = path.resolve(dirPath)
        let ppath = apath.substring(0, apath.lastIndexOf(path.sep))
        if(!fs.existsSync(ppath)) {
            console.error('warning: path not found ' + ppath)
        }
        if (!fs.existsSync(apath)) {
            // console.error('warning: path not found ' + apath)
            return;
        }
        let entries = fs.readdirSync(apath)
        entries.forEach(file => {
            let pn = path.join(dirPath, file)
            let state = fs.lstatSync(pn)
            if(state.isDirectory()) {
                this.enumerate(path.join(dirPath, file), callback)
            } else {
                callback(pn)
            }
        })
    }
    get i18nPath() {
        if(!displayed) {
            console.log('i18nPath ('+ i18nRel +') = ' + path.resolve(i18nRel))
            displayed = true
        }
        return i18nRel
    }
}
export default new NodeFileOps()