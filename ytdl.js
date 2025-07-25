const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cookie = require("cookie");
const app = express.Router();

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ytdl(videoUrl, type = 'mp3') {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const postData = new URLSearchParams({
        url: videoUrl,
        format: type,
        lang: 'fr'
      }).toString();

      const postResp = await axios.post('https://s69.notube.lol/recover_weight.php', postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Referer': 'https://notube.lol/fr/'
        }
      });

      const token = postResp.data?.token;
      const titre = decodeURIComponent(postResp.data?.titre_mp4 || 'Fichier inconnu');

      if (!token) throw new Error('❌ Token non trouvé dans la réponse.');

      await wait(5000); // délai de 5 secondes

      const dlPage = await axios.get(`https://notube.lol/fr/download?token=${token}`, {
        headers: {
          'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        }
      });

      const $ = cheerio.load(dlPage.data);
      const downloadLink = $('#downloadButton').attr('href');

      if (!downloadLink) throw new Error('❌ Lien de téléchargement introuvable.');

      return { downloadLink, titre };

    } catch (e) {
      if (attempt === maxAttempts) return null;
    }
  }
}

app.get('/ovl-yt-dl', async (req, res) => {
  const { url, format = 'mp3' } = req.query;

  if (!url || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) {
    return res.status(400).json({ status: false, error: '❌ Lien YouTube non valide.' });
  }

  const result = await ytdl(url, format);

  if (!result) {
    return res.status(500).json({ status: false, error: '❌ Impossible de récupérer le lien de téléchargement.' });
  }

  res.json({
    status: true,
    creator: 'Ainz',
    name: result.titre,
    ovl_dl_link: result.downloadLink,
  });
});

module.exports = app;
