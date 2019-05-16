const {app, autoUpdater, Menu, dialog} = require('electron')
const ChildProcess = require('child_process')
const path = require('path')
let state = 'checking'

exports.initialize = () => {
  if (process.mas) return

  autoUpdater.on('checking-for-update', () => {
    console.log("checking for update");
    state = 'checking'
    exports.updateMenu()
  })

  autoUpdater.on('update-available', () => {
    state = 'checking'
    console.log("checking for update (available)");
    exports.updateMenu()
  })

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    state = 'installed'
    console.log("downloaded update");
    exports.updateMenu()

    const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    }

    dialog.showMessageBox(dialogOpts, (response) => {
       if (response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('update-not-available', () => {

    state = 'no-update'
    exports.updateMenu()
  })

  autoUpdater.on('error', (e) => {
    console.log("update error: " + e);
    state = 'no-update'
    exports.updateMenu()
  })

  const server = "http://autoupdate.xel.org:3000"
  const feed = `${server}/update/${process.platform}/${app.getVersion()}`
  autoUpdater.setFeedURL(feed)
  autoUpdater.checkForUpdates()
  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 60000)
}

exports.updateMenu = () => {
  if (process.mas) return

  const menu = Menu.getApplicationMenu()
  if (!menu) return

  menu.items.forEach(item => {
    if (item.submenu) {
      item.submenu.items.forEach(item => {
        switch (item.key) {
          case 'checkForUpdate':
            item.visible = state === 'no-update'
            break
          case 'checkingForUpdate':
            item.visible = state === 'checking'
            break
          case 'restartToUpdate':
            item.visible = state === 'installed'
            break
        }
      })
    }
  })
}

exports.createShortcut = callback => {
  spawnUpdate([
    '--createShortcut',
    path.basename(process.execPath),
    '--shortcut-locations',
    'StartMenu'
  ], callback)
}

exports.removeShortcut = callback => {
  spawnUpdate([
    '--removeShortcut',
    path.basename(process.execPath)
  ], callback)
}

function spawnUpdate (args, callback) {
  const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe')
  let stdout = ''
  let spawned = null

  try {
    spawned = ChildProcess.spawn(updateExe, args)
  } catch (error) {
    if (error && error.stdout == null) {
      error.stdout = stdout
    }
    process.nextTick(() => { callback(error) })
    return
  }

  var error = null

  spawned.stdout.on('data', data => {
    stdout += data
  })

  spawned.on('error', processError => {
    if (!error) error = processError
  })

  spawned.on('close', (code, signal) => {
    if (!error && code !== 0) {
      error = new Error(`Command failed: ${code} ${signal}`)
    }
    if (error && error.code == null) error.code = code
    if (error && error.stdout == null) error.stdout = stdout
    callback(error)
  })
}
