const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express.Router();

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
        lang: 'fr'
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

app.get('/ovldl', async (req, res) => {
  const { url, format } = req.query;
  const userAgent = req.headers['user-agent'];
 
  if (!url || !format) {
    return res.status(400).json({ status: false, error: 'Paramètres manquants.' });
  }

  const result = await ovldl(url, format, userAgent);

  if (!result) {
    return res.status(500).json({ status: false, error: 'Impossible de récupérer le lien de téléchargement.' });
  }

  res.json({
    status: true,
    creator: 'Ainz',
    name: result.titre,
    ovl_dl_link: result.downloadLink,
  });
});

module.exports = app;
