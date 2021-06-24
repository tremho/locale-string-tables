'use strict'

/**
 * String Tables are a simple name/value pairing from a JSON file.
 * This can be used as the basis for configuration, localization, or other common mappings.
 *
 * All string table files are relative to the app folder root.
 */
class StringTable {
  /**
   * Constructs a new StringTable.
   */
  constructor () {
    this.data = {}
  }

  /**
   * Returns a string from the string table
   * @param name
   * @returns {string}
   */
  getString (name) {
    return this.data[name]
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
    return new Promise((resolve, reject) => {
      const currentAppFolder = nsfs.knownFolders.currentApp()
      const path = nsfs.path.normalize(currentAppFolder.path + '/' + filePath)
      const exists = nsfs.File.exists(path)
      if (exists) {
        const file = nsfs.File.fromPath(path)
        file.readText().then(contents => {
          try {
            Object.assign(this.data, JSON.parse(contents))
          } catch (e) {
            reject(e)
          }
          resolve()
        }).catch(e => {
          reject(e)
        })
      } else {
        if (silent) resolve()
        else reject(Error('File not found "' + path + "'"))
      }
    })
  }

  /**
   * Synchronous (blocking) load of a string table file
   * @param filePath
   * @param silent
   */
  loadSync (filePath, silent = false) {
    const currentAppFolder = nsfs.knownFolders.currentApp()
    const path = nsfs.path.normalize(currentAppFolder.path + '/' + filePath)
    const exists = nsfs.File.exists(path)
    if (exists) {
      const file = nsfs.File.fromPath(path)
      const contents = file.readTextSync() || "{}"
      try {
        Object.assign(this.data, JSON.parse(contents))
      } catch(e) {
        if(!global.__snapshot) console.log('error parsing contents ', path, contents, e)
      }
    } else {
      if (!silent) throw (Error('File not found "' + path + "'"))
    }
  }
}

module.exports = StringTable
