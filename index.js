const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;
const ovldl = require('./func/multidl.js');


app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'affichage', 'acceuil.html'));
});

app.use('/youtube', (req, res) => {
  res.sendFile(path.join(__dirname, 'affichage', 'youtube.html'));
});

app.use('/ovldl', ovldl);

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

module.exports = app;
