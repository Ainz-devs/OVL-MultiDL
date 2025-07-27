const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const app = express.Router();

const cacheMap = new Map();
const DOWNLOAD_DIR = path.join(__dirname, '..', 'downloads');

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function downloadFile(url, filename) {
  const filePath = path.join(DOWNLOAD_DIR, filename);
  const writer = fs.createWriteStream(filePath);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

async function ovldl(videoUrl, type) {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': 'https://notube.lol/fr/'
      };
      const postData = new URLSearchParams({
        url: videoUrl,
        format: type,
        lang: 'fr',
        subscribed: 'false'
      }).toString();
      const postResp = await axios.post('https://s69.notube.lol/recover_weight.php', postData, { headers });
      const token = postResp.data?.token;
      const name_mp4 = postResp.data?.name_mp4 || 'video.mp4';
      const titre = decodeURIComponent(postResp.data?.titre_mp4 || 'Fichier inconnu');
      if (!token) throw new Error('Token introuvable');
      const formValidation = new URLSearchParams({
        url: videoUrl,
        format: type,
        name_mp4,
        lang: 'fr',
        token,
        subscribed: 'false',
        playlist: 'false',
        adblock: 'false'
      }).toString();
      const validationResp = await axios.post('https://s66.notube.lol/recover_file.php?lang=fr', formValidation, { headers });
      if (validationResp.data?.retour !== 'OK') throw new Error('Validation échouée');
      const dlPage = await axios.get(`https://notube.lol/fr/download?token=${token}`, {
        headers: { 'Content-Type': 'text/html' }
      });
      const $ = cheerio.load(dlPage.data);
      const downloadLink = $('#downloadButton').attr('href');
      if (!downloadLink) throw new Error('Lien de téléchargement introuvable');
      return { downloadLink, titre, filename: name_mp4 };
    } catch (e) {
      if (attempt === maxAttempts) return null;
    }
  }
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cacheMap.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) {
      const filePath = path.join(DOWNLOAD_DIR, value.savedName);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
      cacheMap.delete(key);
    }
  }
}

setInterval(cleanCache, 60 * 1000);

app.get('/ovldl', async (req, res) => {
  const { url, format, id, source } = req.query;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if (id) {
    if (!cacheMap.has(id)) {
      return res.status(404).json({ status: false, error: 'ID non trouvé.' });
    }
    const data = cacheMap.get(id);
    return res.json({
      status: true,
      creator: 'Ainz',
      name: data.name,
      filename: data.filename,
      dl_link: `${baseUrl}/api/downloads/${data.savedName}`,
      stream_link: `${baseUrl}/api/stream/${data.savedName}`,
      source: data.source || null
    });
  }

  if (!url || !format || !source) {
    return res.status(400).json({ status: false, error: 'Paramètres manquants.' });
  }

  const result = await ovldl(url, format);
  if (!result) {
    return res.status(500).json({ status: false, error: 'Impossible de récupérer le lien de téléchargement.' });
  }

  const uniqueName = generateId() + path.extname(result.filename || '.mp4');
  await downloadFile(result.downloadLink, uniqueName);

  const idGen = generateId();
  cacheMap.set(idGen, {
    name: result.titre,
    filename: result.filename,
    savedName: uniqueName,
    source: source.toLowerCase(),
    timestamp: Date.now()
  });

  res.json({ status: true, id: idGen });
});

app.get('/downloads/:filename', (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath, req.params.filename);
  } else {
    res.status(404).send('Fichier non trouvé');
  }
});

app.get('/stream/:filename', (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Fichier non trouvé');
  }
});

module.exports = app;
