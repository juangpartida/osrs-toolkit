const { app, BrowserWindow, ipcMain } = require("electron");
const zmq = require("zeromq");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false
        }
    });

    mainWindow.loadFile("renderer/index.html"); // Adjust if needed

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
});

async function sendZMQRequest(port, payload) {
    console.log(`[MAIN] Sending request to port ${port}:`, payload);
    
    const sock = new zmq.Request();
    sock.connect(`tcp://127.0.0.1:${port}`);

    try {
        await sock.send(JSON.stringify(payload));
        const [reply] = await sock.receive();
        console.log(`[MAIN] Received response from port ${port}:`, reply.toString());
        return JSON.parse(reply.toString());
    } catch (error) {
        console.error(`❌ Error communicating with port ${port}:`, error);
        return { error: `Failed to fetch data from port ${port}` };
    } finally {
        await sock.close(); // Ensure socket is closed after request
    }
}

// Ensure endpoint names match `renderer.js`
ipcMain.handle("fetch-quest-data", async (event, username) => {
    return await sendZMQRequest(5556, { username });
});

ipcMain.handle("fetch-skill-data", async (event, username) => {
    return await sendZMQRequest(5557, { username });
});

ipcMain.handle("fetch-ranking-data", async (event, username) => {  
    return await sendZMQRequest(5558, { username });
});

// ipcMain.handle("fetch-ge-data", async (event, item_id) => {
//     return await sendZMQRequest(5559, { item_id });
// });
ipcMain.handle("fetch-ge-data", async (event, item_id) => {
    console.log(`[MAIN] Sending GE request with item_id:`, item_id);

    if (!item_id || item_id.trim() === "") {
        return { error: "No item ID provided" };
    }

    return await sendZMQRequest(5559, { item_id });
});

