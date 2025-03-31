
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let qrCode;
let connectedNumber = null;

client.on('qr', (qr) => {
    qrCode = qr;
    console.log('QR RECEIVED');
});

client.on('ready', () => {
    console.log('Client is ready!');
    client.getMe().then(user => {
        connectedNumber = user.id._serialized;
    });
});

client.initialize();

app.get('/qr', (req, res) => {
res.json({ qr: qrCode || null });

});

app.get('/status', (req, res) => {
    const isConnected = connectedNumber !== null;

    res.json({
        connected: isConnected,
        number: isConnected ? connectedNumber : null,
        qr: !isConnected ? qrCode : null
    });
});

app.post('/send', async (req, res) => {
    const { number, message } = req.body;
    try {
        await client.sendMessage(`${number}@c.us`, message);
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ error: err.toString() });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
