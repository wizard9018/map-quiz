"""Compose 30 original instrumental loops; requires numpy and ffmpeg."""
from pathlib import Path
import subprocess
import tempfile
import wave
import json
import numpy as np

ROOT = Path(__file__).resolve().parent / 'assets' / 'focus-music'
SR = 32000
TRACKS = [
    ('sunny-steps', 100, [60, 65, 57, 67], False, [4, 7, 9, 7, 2, 4, 7, 4]),
    ('garden-bells', 92, [65, 60, 62, 67], False, [7, 4, 2, 4, 9, 7, 4, 2]),
    ('cloud-picnic', 96, [60, 57, 65, 67], False, [0, 4, 7, 12, 9, 7, 4, 2]),
    ('curious-path', 108, [57, 53, 60, 55], True, [0, 7, 3, 10, 7, 5, 3, 7]),
    ('quiet-mission', 112, [62, 58, 65, 60], True, [7, 3, 0, 7, 10, 7, 5, 3]),
    ('puzzle-spark', 104, [64, 60, 67, 62], True, [0, 3, 7, 5, 3, 10, 7, 3]),
]


def compose(name, bpm, roots, tense, melody):
    beat = 60 / bpm
    length = int(round(64 * beat * SR))
    mix = np.zeros((length, 2), dtype=np.float64)
    rng = np.random.default_rng(sum(map(ord, name)))
    style = name.split('-2')[0].split('-3')[0].split('-4')[0].split('-5')[0]

    def add(at, duration, midi, volume, instrument='bell', pan=0):
        n = int(duration * SR)
        t = np.arange(n) / SR
        f = 440 * 2 ** ((midi - 69) / 12)
        if instrument == 'pad':
            signal = sum(np.sin(2 * np.pi * f * h * t) / h ** 2 for h in [1, 2, 3])
            envelope = np.minimum(t / .18, 1) * np.minimum((duration - t) / .3, 1) * .65
        elif instrument == 'bass':
            signal = np.sin(2 * np.pi * f * t) + .18 * np.sin(4 * np.pi * f * t)
            envelope = np.minimum(t / .015, 1) * np.exp(-t * 3) * np.minimum((duration - t) / .04, 1)
        else:
            phase = 2 * np.pi * f * t
            if style == 'sunny-steps':
                signal = sum(np.sin(phase * h) / h ** 1.6 * np.exp(-t * h * 1.4) for h in range(1, 7))
                decay = 3.2  # Bright, gently plucked strings.
            elif style == 'garden-bells':
                signal = np.sin(phase) + .3 * np.sin(phase * 2.76) * np.exp(-t * 5) + .1 * np.sin(phase * 5.4) * np.exp(-t * 8)
                decay = 2.4  # Soft bell overtones.
            elif style == 'cloud-picnic':
                signal = sum(np.sin(phase * h) / h ** 2 * np.exp(-t * h * .7) for h in range(1, 6))
                decay = 2.6  # Rounded electric-piano tone.
            elif style == 'curious-path':
                signal = np.sin(phase) + .35 * np.sin(phase * 4) * np.exp(-t * 14)
                decay = 6  # Short, wooden marimba-like notes.
            elif style == 'quiet-mission':
                signal = np.sin(phase + .4 * np.sin(phase * 2) * np.exp(-t * 5))
                decay = 4  # Mellow electronic pulse.
            else:
                signal = np.sin(phase) + .22 * np.sin(phase * 3) + .07 * np.sin(phase * 5)
                decay = 5  # Softened arcade synth, without sharp square waves.
            envelope = np.minimum(t / .008, 1) * np.exp(-t * decay)
            envelope *= np.minimum((duration - t) / .03, 1)
        samples = signal * envelope * volume
        stereo = samples[:, None] * np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)])
        # Wrap note tails around the loop rather than clipping them at the seam.
        indices = (int(round(at * SR)) + np.arange(n)) % length
        for delay, scale in [(0, 1), (int(.19 * SR), .14), (int(.31 * SR), .08)]:
            mix[(indices + delay) % length] += stereo * scale

    for bar in range(16):
        root = roots[bar % 4]
        minor = tense or (not tense and root % 12 in [2, 9])
        chord = [0, 3 if minor else 4, 7, 10 if minor else 11]
        for interval in chord[:3]:
            add(bar * 4 * beat, 4 * beat, root + interval, .025 if style == 'curious-path' else .042, 'pad', -.3)
        for b in [0, 2]:
            add((bar * 4 + b) * beat, 1.6 * beat, root - 12, .13, 'bass')
        for step in range(8):
            if not tense and step in [3, 7]:
                continue
            note = root + 12 + melody[(step + (bar // 4) * 2) % 8]
            add((bar * 4 + step / 2) * beat, 1.1 * beat, note, .075 if tense else .1, pan=.35)
        # Soft brushed percussion: no startling hits or answer-related cues.
        for step in range(8):
            at = int(round((bar * 4 + step / 2) * beat * SR))
            n = int(.06 * SR)
            noise = rng.normal(0, 1, n)
            noise = np.diff(noise, prepend=noise[0]) * np.exp(-np.arange(n) / (SR * .012)) * .006
            mix[(at + np.arange(n)) % length] += noise[:, None]
    mix *= .55 / np.max(np.abs(mix))
    pcm = (mix * 32767).astype('<i2')
    with tempfile.TemporaryDirectory(prefix='focus-music-') as temporary:
        wav_path = Path(temporary) / 'loop.wav'
        with wave.open(str(wav_path), 'wb') as output:
            output.setnchannels(2)
            output.setsampwidth(2)
            output.setframerate(SR)
            output.writeframes(pcm.tobytes())
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav_path),
                        '-codec:a', 'libmp3lame', '-b:a', '96k', str(ROOT / (name + '.mp3'))], check=True)
    print(f'{name}: {length / SR:.2f}s, {bpm} BPM, peak 0.55', flush=True)


if __name__ == '__main__':
    ROOT.mkdir(parents=True, exist_ok=True)
    catalog = []
    titles = ['晴天脚步', '花园风铃', '云上野餐', '好奇小径', '安静任务', '谜题火花']
    for track in TRACKS:
        name, bpm, roots, tense, melody = track
        for variation in range(5):
            suffix = '' if variation == 0 else '-' + str(variation + 1)
            shift = [0, 2, -2, 5, -5][variation]
            notes = melody[variation:] + melody[:variation]
            if variation in [2, 4]:
                notes = list(reversed(notes))
            tempo = bpm + [0, -6, 4, -3, 6][variation]
            compose(name + suffix, tempo, [root + shift for root in roots], tense, notes)
            catalog.append({'file': name + suffix + '.mp3', 'title': titles[TRACKS.index(track)] + (' ' + str(variation + 1)),
                            'mood': 'tense' if tense else 'relaxed', 'bpm': tempo, 'seconds': round(64 * 60 / tempo, 2)})
    (ROOT / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
