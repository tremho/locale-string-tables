
import * as fs from 'fs'
import * as path from 'path'

let root = './'

class NodeFileOps {
    read(realPath:string): string {
        // let apath = path.normalize(path.join(root, relPath))
        let contents = fs.readFileSync(realPath).toString()
        return contents
    }
    enumerate(dirPath:string, callback:any) {
        let apath = path.normalize(path.join(root, dirPath))
        if(!fs.existsSync(apath)) {
            // console.error('warning: path not found ' + apath)
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
    get rootPath() { return '../../'}
}
export default new NodeFileOps()