const { app, Menu, Tray, globalShortcut, BrowserWindow } = require('electron')
const { ipcMain, screen } = require('electron')
const settings = require('electron-settings');
const { spawn } = require('child_process');
const iconv = require('iconv-lite');
const path = require('path');
const XLSX = require('xlsx');


const indexPath = path.join(__dirname, '/dist/index.html')


app.commandLine.appendSwitch('wm-window-animations-disabled')

let mainWindow
var showShortcutKeys = shortcutKeysFormat(settings.getSync("shortcutKeys") || "");
var winAutoHide = settings.getSync("winAutoHide");
var winShowFrame = settings.getSync("winShowFrame");
if (!showShortcutKeys) {
    if (process.platform === "darwin") {
        showShortcutKeys = "Option+F"
    } else {
        showShortcutKeys = "Ctrl+Alt+F"
    }
}


function getSize() {
    const { size, scaleFactor } = screen.getPrimaryDisplay();
    const displays = screen.getAllDisplays();
    console.log(displays);
    return { width: size.width * scaleFactor, height: size.height * scaleFactor }
}

function createWindow(window_x, window_y) {

    const windows = BrowserWindow.getAllWindows()
    if (mainWindow || windows.length != 0) {
        if (!mainWindow) mainWindow = windows[0]
        console.log("窗口存在，关闭");
        mainWindow.close()
    }
    let window_config = {
        width: 900,
        height: 700,
        show: true,
        frame: winShowFrame,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // preload: path.join(__dirname, '/dist/preload.js')
        }
    }
    if (window_x && window_x > 0) window_config.x = window_x
    if (window_y && window_y > 0) window_config.y = window_y
    mainWindow = new BrowserWindow(window_config)

    // console.log(winAutoHide, winShowFrame);

    // mainWindow.loadURL('http://10.0.0.236:8080/')
    // mainWindow.loadFile(indexPath+ "#/screen")
    mainWindow.loadURL(`file://${indexPath}`)

    if (winAutoHide) {
        mainWindow.on('blur', onBlur)
    }
    mainWindow.on('closed', function () {
        const windows = BrowserWindow.getAllWindows()
        if (windows.length != 0) {
            mainWindow = windows[0]
        } else {
            mainWindow = null
        }
    })
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.type === "keyDown" && input.key === "F12") {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools();
            }
        }

    })
    // console.log("窗口：", !!mainWindow);

}



const currentWindow = BrowserWindow.getFocusedWindow()

// 检查应用是否已经在运行
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    // 如果已经有一个实例在运行，则退出应用
    if (currentWindow) {
        if (currentWindow.isMinimized()) currentWindow.restore()
        currentWindow.focus()
    }
    app.quit()
}


ipcMain.on('check-window-focus', (event) => {
    if (mainWindow.isFocused()) {
        mainWindow.show()
    }
});
ipcMain.on("show_window", (event) => {
    mainWindow.show()
})


function showMainWindow() {
    if (mainWindow === null) {
        createWindow()
    };
    mainWindow.show()

}


var tray = null
app.on('ready', () => {
    // 创建一个 Tray 对象，并设置图标路径
    tray = new Tray(path.join(__dirname, '/src/assets/玉玦-16.png'))
    const contextMenu = Menu.buildFromTemplate([
        { label: '显示', type: 'normal', click: showMainWindow },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' }
    ])
    tray.setContextMenu(contextMenu)
    // tray.setToolTip('翻译坤')
    tray.on("double-click", showMainWindow)

})


app.whenReady().then(() => {
    createWindow()

    globalShortcut.register(showShortcutKeys, showMainWindow)


})


app.on('will-quit', () => {
    // app退出时注销所有快捷键
    globalShortcut.unregisterAll()
})


app.whenReady().then(() => {
    // 设置mac系统dock栏图标
    const dockIconPath = path.join(__dirname, 'src/assets', '玉玦-128.png');
    app.dock.setIcon(dockIconPath);

});



ipcMain.on('parseExcelFileField', (e, args) => {
    // 解析Excel的表头
    console.log('这里是主进程:parseExcelFileField', args)
    try {
        const workbook = XLSX.readFile(args.file_path);

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const range = XLSX.utils.decode_range(worksheet['!ref']);

        let items = []
        for (let i = range.s.c; i <= range.e.c; i++) {
            const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: i });
            if (worksheet[cellAddress]) {
                const cellValue = worksheet[cellAddress].v;
                items.push(cellValue)
            }
        }
        console.log("解析后表格头：" + JSON.stringify(items));
        let result = {
            file_type: args.file_type,
            file_path: args.file_path,
            headers: items
        }
        e.reply("showExcelFileField", result)
    } catch (error) {
        e.reply("showExcelFileField", result)

    }

})

ipcMain.on('buildData', (e, args) => {
    // 根据参数生成新的Excel
    console.log('这里是主进程:buildData', args)
    let pythonProcess
    if (process.platform === 'darwin') {
        // pythonProcess = spawn('python_venv/bin/python3', ['./src/pythonScript/buildData.py', JSON.stringify(args)]);

        pythonProcess = spawn(path.join(process.resourcesPath, 'script/buildData'), [JSON.stringify(args),]);
    } else if (process.platform === 'win32') {
        pythonProcess = spawn(path.join(process.resourcesPath, 'script/buildData.exe'), [JSON.stringify(args),], { encoding: 'utf-8' });
    }

    pythonProcess.stdout.on('data', (data) => {
        if (process.platform === "win32") {
            data = iconv.decode(data, 'gbk').toString()
        } else {
            data = data.toString()
        }
        console.log(`stdout: ${data}`);
        let result = {
            msg: "操作成功",
            file_path: data
        }
        e.reply("buildResult", result)
        mainWindow.webContents.send("buildLog", { level: "success", info: "生成: " + data });

    });

    pythonProcess.stderr.on('data', (data) => {
        if (process.platform === "win32") {
            data = iconv.decode(data, 'gbk').toString()
        } else {
            data = data.toString()
        }

        console.error(`stderr: ${data}`);
        e.reply("buildResult", { "msg": data })
        mainWindow.webContents.send("buildLog", { level: "error", info: data });

    });

    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

})


ipcMain.on("saveShortcutKeys", async (e, args) => {
    let shortcutKeys = args.shortcutKeys
    await settings.set('shortcutKeys', shortcutKeys);
    globalShortcut.unregister(shortcutKeysFormat(showShortcutKeys))
    globalShortcut.register(shortcutKeysFormat(shortcutKeys), showMainWindow)
    showShortcutKeys = shortcutKeys


})

ipcMain.on("changeSettingAutoHide", async (e, args) => {
    await settings.set('winAutoHide', args);
    winAutoHide = args
    if (args) {
        mainWindow.on('blur', onBlur)
    } else {
        mainWindow.removeListener('blur', onBlur)
    }

})
ipcMain.on("getSettingInfo", async (e, args) => {
    let shortcutKeys = await settings.get("shortcutKeys")

    if (!shortcutKeys) {
        shortcutKeys = showShortcutKeys
    }
    showShortcutKeys = shortcutKeysFormat(shortcutKeys)


    e.reply("SettingInfo", { "winAutoHide": winAutoHide, "winShowFrame": winShowFrame, "shortcutKeys": shortcutKeys });

})

ipcMain.on("changeSettingShowFrame", async (e, args) => {
    await settings.set('winShowFrame', args);
    const position = mainWindow.getPosition()
    console.log(position);
    // console.log('winShowFrame', args);
    winShowFrame = args
    createWindow(position[0], position[1])
    setTimeout(() => {
        mainWindow.show()
    }, 500);

})

function shortcutKeysFormat(shortcutKeys) {
    console.log("格式化快捷键：", shortcutKeys);
    shortcutKeys = shortcutKeys.replace("⇧", "Shift")
    shortcutKeys = shortcutKeys.replace("⌃", "Control")
    shortcutKeys = shortcutKeys.replace("⌥", "Option")
    shortcutKeys = shortcutKeys.replace("⌘", "Command")
    return shortcutKeys
}




app.on('window-all-closed', function () {
    // if (process.platform !== 'darwin') app.quit()
})
// app.on('activate', function () {
// if (mainWindow === null) createWindow()
// })



function onBlur() {
    mainWindow.hide()
}