const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

app.use(express.static(path.join(__dirname, 'docs')));

app.post('/convert', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  }

  const ext = path.extname(req.file.originalname) || '.mp4';
  const inputPath = req.file.path + ext;
  const outputPath = path.join(os.tmpdir(), `wsp_${Date.now()}.mp4`);

  fs.renameSync(req.file.path, inputPath);

  const args = [
    '-i', inputPath,
    '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level', '4.0',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-ac', '2',
    '-movflags', '+faststart',
    '-r', '30',
    '-y',
    outputPath,
  ];

  const proc = spawn('ffmpeg', args);

  proc.on('error', (err) => {
    fs.unlink(inputPath, () => {});
    fs.unlink(outputPath, () => {});
    if (err.code === 'ENOENT') {
      return res.status(500).json({ error: 'FFmpeg no encontrado. Instalalo desde ffmpeg.org.' });
    }
    return res.status(500).json({ error: err.message });
  });

  proc.on('close', (code) => {
    fs.unlink(inputPath, () => {});
    if (code !== 0) {
      fs.unlink(outputPath, () => {});
      return res.status(500).json({ error: 'FFmpeg falló durante la conversión.' });
    }
    res.download(outputPath, 'status_optimized.mp4', () => {
      fs.unlink(outputPath, () => {});
    });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
