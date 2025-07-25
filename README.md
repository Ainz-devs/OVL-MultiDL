## 📅 OVL-YT-DL – API de Téléchargement YouTube

Une API simple et rapide pour télécharger l’audio ou la vidéo d’un lien YouTube en MP3 ou MP4.

---

### 📡 Endpoint API

#### GET `/ovl-yt-dl`

**Paramètres requis :**

| Paramètre | Description                  | Exemple                        |
| --------- | ---------------------------- | ------------------------------ |
| `url`     | Lien YouTube à télécharger   | `https://youtu.be/rLxyYIuwGa0` |
| `format`  | Format de sortie : `mp3/mp4` | `mp3` (par défaut) ou `mp4`    |

**Exemple de requête :**

```
GET /ovl-yt-dl?url=https://youtu.be/rLxyYIuwGa0&format=mp3
```

**Réponse JSON :**

```json
{
  "status": true,
  "creator": "Ainz",
  "name": "Overlord+-+Opening+3+|+4K+|+60FPS+|+Creditless+|",
  "ovl_dl_link": "https://s69.notube.lol/download.php?token=b6d60eed9af8731c8993ec389f9152d2&key=ky653p4ai940sztr"
}
```
---

### 👑 Auteur

> Développé par **Ainz** – Projet OVL 🔪
