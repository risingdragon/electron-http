const electron = require('electron')
const fs = require('fs')

let win = null
let winSize = null
let settingFile = __dirname + '/settings.json'

electron.app.on('window-all-closed', () => {
	if (process.platform != 'darwin') {
		electron.app.quit()
	}
})

electron.app.on('ready', () => {
	let size = null
	try {
		let settings = JSON.parse(fs.readFileSync(settingFile, { encoding: 'utf8' }))
		size = settings.size
	} catch (err) {
		size = {
			width: 800,
			height: 600
		}
	}
	
	win = new electron.BrowserWindow({
		width: size.width,
		height: size.height
	})

	win.loadURL(`file://${electron.app.getAppPath()}/index.html`)

	win.on('resize', () => {
		winSize = win.getSize()
	})

	win.on('closed', () => {
		win = null
		if (winSize != null) {
			let settings = null
			try {
				settings = JSON.parse(fs.readFileSync(settingFile, { encoding: 'utf8' }))
			} catch (err) {
				settings = {}
			}
			settings['size'] = {
				width: winSize[0],
				height: winSize[1]
			}
			fs.writeFile(settingFile, JSON.stringify(settings))
		}
	})
})

electron.ipcMain.on('save', (e, text) => {
	electron.dialog.showSaveDialog(
		win,
		{
			title: 'save parameters',
			filters: [
				{name: 'json file', extensions: ['json', 'text']}
			]
		},
		(file) => {
			if (!file) {
				return;
			}
			fs.writeFile(file, text, (error) => {
				if (error != null) {
					console.log(error)
				}
			})
		}
	)
})

electron.ipcMain.on('save-settings', (e, formdata) => {
	winSize = win.getSize()
	formdata['size'] = {
		width: winSize[0],
		height: winSize[1]
	}
	fs.writeFile(settingFile, JSON.stringify(formdata))
})
