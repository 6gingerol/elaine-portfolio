// Run with FFMPEG_PATH pointing to an FFmpeg build with libvpx-vp9/libx264.
// Decode real WebM alpha offline; Safari does not preserve it during playback.
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const sharp = require('sharp');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const root = path.resolve(__dirname, '..');
const clips = [
  // The first phone is left of the landscape frame's centre. These fixed crops
  // centre the actual phone, retain its bezel, and preserve square pixels.
  { name: 'group-session', source: 'jellybreak-group-session-nobg.webm', original: 'jellybreak-group-session.mp4', crop: '500:920:656:78' },
  { name: 'choose-break', source: 'jellybreak-choose-break-nobg.webm', original: 'jellybreak-choose-break.mp4', crop: '500:920:708:76' },
  { name: 'transition', source: 'jellybreak-chroma-keyed-video.webm', crop: '850:1564:1036:94' }
];

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', ...args],
      { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    child.stderr.on('data', data => { errors += data; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors)));
  });
}

(async () => {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'jelly-phone-build-'));
  for (const clip of clips) {
    const mask = path.join(scratch, `${clip.name}-mask.png`);
    // The phone is stationary. Freeze its first-frame silhouette to stop the
    // old background-removal mask from eroding the bezel during playback.
    const sourceMask = path.join(scratch, `${clip.name}-source-mask.png`);
    await run(['-c:v', 'libvpx-vp9', '-i', `assets/${clip.source}`,
      '-vf', `crop=${clip.crop},alphaextract`, '-frames:v', '1', '-y', sourceMask]);
    const { data, info } = await sharp(sourceMask).greyscale().raw().toBuffer({ resolveWithObject: true });
    const silhouette = Buffer.alloc(info.width * info.height);
    for (let y = 0; y < info.height; y++) {
      let left = info.width, right = -1;
      for (let x = 0; x < info.width; x++) {
        if (data[y * info.width + x] >= 128) {
          left = Math.min(left, x); right = Math.max(right, x);
        }
      }
      // Fill interior holes too: the third WebM's old chroma key mistakenly
      // made black text and the camera cutout transparent.
      if (right >= left) silhouette.fill(255, y * info.width + left, y * info.width + right + 1);
    }
    await sharp(silhouette, {raw:{width:info.width, height:info.height, channels:1}})
      .blur(0.5).png().toFile(mask);
    for (const [theme, color] of [['light', 'white'], ['dark', '0x0f0f10']]) {
      const output = `assets/jellybreak-${clip.name}-phone-${theme}.mp4`;
      // Every crop has the same 25:46 aspect ratio, so this scale is uniform.
      const input = [
        ...(clip.original ? [] : ['-c:v', 'libvpx-vp9']),
        '-i', `assets/${clip.original || clip.source}`, '-loop', '1', '-i', mask
      ];
      const foreground = `[0:v]crop=${clip.crop},format=rgb24,scale=500:920:flags=lanczos,setsar=1,fps=30[rgb];` +
        '[1:v]scale=500:920:flags=lanczos,format=gray[mask];[rgb][mask]alphamerge=shortest=1[phone];';
      const filter = foreground +
        `color=c=${color}:s=500x920:r=30[bg];` +
        '[bg][phone]overlay=shortest=1:format=auto,format=yuv420p[v]';
      await run([...input,
        '-filter_complex', filter, '-map', '[v]', '-an', '-c:v', 'libx264',
        '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-level', '3.1',
        '-movflags', '+faststart', '-y', output]);
      // A matching first-frame poster avoids an empty frame during loading.
      await run(['-i', output, '-frames:v', '1', '-y', output.replace('.mp4', '.png')]);
      console.log(output);
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
