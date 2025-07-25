const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express.Router();

async function ytdl(videoUrl, type = 'mp3') {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Tentative ${attempt} pour récupérer le lien...`);

      const postData = new URLSearchParams({
        url: videoUrl,
        format: type,
        lang: 'fr'
      }).toString();

      const postResp = await axios.post('https://s69.notube.lol/recover_weight.php', postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'GoogleBot',
          'Referer': 'https://notube.lol/fr/'
        }
      });

      const token = postResp.data?.token;
      const titre = decodeURIComponent(postResp.data?.titre_mp4);
      console.log(`[Tentative ${attempt}] 🔑 Token :`, token);
      console.log(`[Tentative ${attempt}] 📄 Nom du fichier :`, titre);

      if (!token) throw new Error('❌ Token non trouvé dans la réponse.');

      const dlPage = await axios.get(`https://notube.lol/fr/download?token=${token}`, {
        headers: {
          'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'User-Agent': 'GoogleBot',
          'Referer': 'https://notube.lol/fr/youtube-app-206',
        }
      });
console.log(dlPage.data);
      const $ = cheerio.load(dlPage.data);
      const downloadLink = $('#downloadButton').attr('href');
      console.log(`[Tentative ${attempt}] 🔗 Lien :`, downloadLink);

      if (!downloadLink) throw new Error('❌ Lien de téléchargement introuvable.');

      return { downloadLink, titre };

    } catch (e) {
      console.warn(`⚠️ Erreur tentative ${attempt} :`, e.message);
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
    url: result.downloadLink,
    name: result.titre,
    format
  });
});

module.exports = app;
