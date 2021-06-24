
'use strict'

export interface FileOps {
    read(relPath:string): string
    enumerate(dirPath:string, callback:any)
}

/**
 * String Tables are a simple name/value pairing from a JSON file.
 * This can be used as the basis for configuration, localization, or other common mappings.
 *
 * All string table files are relative to the app folder root.
 */
export class StringTable {
    private data = new Map<string,string>()
    private fileOps:FileOps = null

    /**
     * Returns a string from the string table
     * @param name
     * @returns {string}
     */
    getString (name) {
        return this.data[name]
    }

    setFileOps(fileOps:FileOps) {
        this.fileOps = fileOps
    }

    /**
     * Sets the value of a string identifier.
     * @param name
     * @param value
     */
    setString (name, value) {
        this.data[name] = value
    }

    /**
     * Loads string values from a JSON file on disk.
     * This is an asynchronous non-blocking promise call.
     * @param filePath
     * @param {boolean} [silent] `true` to supress file not found error.  Other errors may still throw.
     * @returns {Promise}
     */
    load (filePath, silent = false) {

        if(this.fileOps && this.fileOps.read) {
            const contents = this.fileOps.read(filePath)
            if(contents) {
                try {
                    Object.assign(this.data, JSON.parse(contents))
                } catch (e) {
                    console.error('Unable to load string table at '+filePath+': ' + e.message)
                    throw e
                }
            }
        } else {
            console.error('no fileOps.read assigned to string table')
            throw Error('No FileOps')
        }

    }
}

