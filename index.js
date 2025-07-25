const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const ytdlRoute = require('./ytdl');

app.use(ytdlRoute);

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

module.exports = app;
