const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express.Router();

const DOWNLOAD_DIR = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

function generateUniqueId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function ytdlp(videoUrl, format = 'mp3') {
  const uniqueId = generateUniqueId();
  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const outputPath = path.join(DOWNLOAD_DIR, `yt-${uniqueId}-%(title).50s.%(ext)s`);

  const metadata = await new Promise((resolve, reject) => {
    exec(`yt-dlp --dump-json "${videoUrl}"`, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
      if (err) return reject(err);
      try {
        const info = JSON.parse(stdout);
        resolve(info);
      } catch {
        reject(new Error("Erreur de parsing JSON yt-dlp"));
      }
    });
  });

  const downloadCmd = `yt-dlp -f bestaudio --extract-audio --audio-format ${format} -o "${outputPath}" "${videoUrl}"`;

  await new Promise((resolve, reject) => {
    exec(downloadCmd, { maxBuffer: 1024 * 1024 * 10 }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  const files = fs.readdirSync(DOWNLOAD_DIR).filter(f =>
    f.startsWith(`yt-${uniqueId}`) && f.endsWith(`.${ext}`)
  );

  if (files.length === 0) throw new Error("Aucun fichier téléchargé.");
  const lastFile = files[0];

  setTimeout(() => {
    const filePath = path.join(DOWNLOAD_DIR, lastFile);
    if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
  }, 5 * 60 * 1000);

  return {
    title: metadata.title,
    channel: metadata.uploader,
    duration: metadata.duration,
    thumbnail: metadata.thumbnail,
    fichier: `/downloads/${encodeURIComponent(lastFile)}`,
    format: ext
  };
}

app.get('/ovl-yt-dl', async (req, res) => {
  const { url, format = 'mp3' } = req.query;

  if (!url || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) {
    return res.status(400).json({ status: false, error: '❌ Lien YouTube non valide.' });
  }

  try {
    const result = await ytdlp(url, format);

    res.json({
      status: true,
      creator: 'Ainz',
      title: result.title,
      channel: result.channel,
      duration: result.duration,
      thumbnail: result.thumbnail,
      file: result.fichier,
      format: result.format
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
});

module.exports = app;
