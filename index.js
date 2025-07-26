const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;
const ovldl = require('./func/multidl.js');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'affichage', 'acceuil.html'));
});

app.get('/youtube', (req, res) => {
  res.sendFile(path.join(__dirname, 'affichage', 'youtube.html'));
});

app.get('/telechargement/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'affichage', 'telechargement.html'));
});

app.use('/ovldl', ovldl);

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

module.exports = app;
