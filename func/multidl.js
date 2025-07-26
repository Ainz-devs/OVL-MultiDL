const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express.Router();

const cacheMap = new Map();

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function ovldl(videoUrl, type, userAgent) {
  const maxAttempts = 5;
  const defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': userAgent || defaultUserAgent,
        'Referer': 'https://notube.lol/fr/'
      };

      const postData = new URLSearchParams({
        url: videoUrl,
        format: type,
        lang: 'fr',
        subscribed: 'true',
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
        subscribed: 'true',
        playlist: 'false',
        adblock: 'false'
      }).toString();

      const validationResp = await axios.post(
        'https://s66.notube.lol/recover_file.php?lang=fr',
        formValidation,
        { headers }
      );

      if (validationResp.data?.retour !== 'OK') throw new Error('Validation échouée');

      const dlPage = await axios.get(`https://notube.lol/fr/download?token=${token}`, {
        headers: {
          'User-Agent': userAgent || defaultUserAgent,
          'Content-Type': 'text/html'
        }
      });

      const $ = cheerio.load(dlPage.data);
      const downloadLink = $('#downloadButton').attr('href');

      if (!downloadLink) throw new Error('Lien de téléchargement introuvable');

      return { downloadLink, titre };

    } catch (e) {
      console.error(`Tentative ${attempt} échouée :`, e.message);
      if (attempt === maxAttempts) return null;
    }
  }
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cacheMap.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) {
      cacheMap.delete(key);
      console.log(`Cache supprimé pour l'id ${key} (plus de 5 minutes)`);
    }
  }
}

setInterval(cleanCache, 60 * 1000);

app.get('/', async (req, res) => {
  const { url, format, id, source } = req.query;
  const userAgent = req.headers['user-agent'];

  if (id) {
    if (!cacheMap.has(id)) {
      return res.status(404).json({ status: false, error: 'ID non trouvé.' });
    }
    const data = cacheMap.get(id);
    console.log(`Requête réussie pour ID: ${id} (source: ${data.source || 'inconnu'})`);
    return res.json({
      status: true,
      creator: 'Ainz',
      name: data.name,
      ovl_dl_link: data.link,
      source: data.source || null,
    });
  }

  if (!url || !format || !source) {
    return res.status(400).json({ status: false, error: 'Paramètres manquants.' });
  }

  const result = await ovldl(url, format, userAgent);

  if (!result) {
    return res.status(500).json({ status: false, error: 'Impossible de récupérer le lien de téléchargement.' });
  }

  const idGen = generateId();
  cacheMap.set(idGen, {
    name: result.titre,
    link: result.downloadLink,
    source: source.toLowerCase(),
    timestamp: Date.now()
  });

  console.log(`Nouvelle requête générée ID: ${idGen} (source: ${source.toLowerCase()})`);

  res.json({
    status: true,
    id: idGen
  });
});

module.exports = app;
