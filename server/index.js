const http = require("http");
const express = require("express");
const { Server: SocketServer } = require("socket.io");
const pty = require("node-pty");
const fs = require("fs/promises");
const cors = require("cors");
const path = require("path");
const chokidar = require("chokidar");

const port = 9000;
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: { origin: "*" }
});

app.use(cors());

// Ensure the 'user' directory exists
const userDirectory = path.join(process.env.INIT_CWD || __dirname, 'user');
fs.mkdir(userDirectory, { recursive: true });

const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: userDirectory,
    env: process.env
});

// Watch for file changes using chokidar
chokidar.watch(userDirectory).on('all', (event, filePath) => {
    console.log(`File event: ${event} on ${filePath}`);
    io.emit('file:refresh', filePath);
});

ptyProcess.onData((data) => {
    io.emit('terminal:data', data);
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Handle file changes from the client
    socket.on('file:change', async ({ path: filePath, content }) => {
        try {
            if (!filePath.startsWith('/')) filePath = '/' + filePath; // Ensure leading slash
            const fullPath = path.join(userDirectory, filePath);
            await fs.writeFile(fullPath, content);
            console.log(`File updated: ${fullPath}`);
        } catch (error) {
            console.error('Error writing file:', error);
            socket.emit('file:error', { error: 'Failed to write file' });
        }
    });

    // Handle terminal input from the client
    socket.on('terminal:write', (data) => {
        try {
            ptyProcess.write(data);
        } catch (error) {
            console.error('Error writing to terminal:', error);
        }
    });
});

// API to get file tree
app.get('/files', async (req, res) => {
    try {
        const fileTree = await generateFileTree(userDirectory);
        return res.json({ tree: fileTree });
    } catch (error) {
        console.error('Error generating file tree:', error);
        res.status(500).json({ error: 'Failed to generate file tree' });
    }
});

// API to read file content
app.get('/files/content', async (req, res) => {
    try {
        let filePath = req.query.path;
        if (!filePath.startsWith('/')) filePath = '/' + filePath;
        const fullPath = path.join(userDirectory, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        return res.json({ content });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read file' });
    }
});

// Generate file tree function
async function generateFileTree(directory) {
    const tree = {};

    async function buildTree(currentDir, currentTree) {
        const files = await fs.readdir(currentDir);
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                currentTree[file] = {};
                await buildTree(filePath, currentTree[file]);
            } else {
                currentTree[file] = null;
            }
        }
    }

    await buildTree(directory, tree);
    return tree;
}

// Start server
server.listen(port, () => {
    console.log(`🐳 Server is running on port ${port}`);
});