"""Generates stylish SVG artwork used as placeholders until real AI images are added.
Run: python3 scripts/gen-images.py   -> writes public/images/*.svg
Replace any file with a .jpg/.webp from your AI tool and update the path in the admin panel."""
import random, os, math

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'images')
os.makedirs(OUT, exist_ok=True)
W, H = 1600, 1000

# name: (sky_top, sky_bottom, sun, layers[3], motif)
ART = {
  'hero':       ('#1b3a4b', '#f4a261', '#ffe8c2', ['#3d5a6c', '#2a4256', '#14212c'], 'mountain'),
  'turkiye':    ('#1d3557', '#f7b267', '#fff1d6', ['#3b6e8f', '#25506b', '#12304a'], 'sea'),
  'maldives':   ('#7fd6e8', '#e9fbff', '#ffffff', ['#38b6c9', '#1b9bb4', '#0b7f9c'], 'sea'),
  'thailand':   ('#fdb87b', '#ffe5c4', '#fff6e0', ['#5a8f6a', '#3a6b4c', '#1e4733'], 'mountain'),
  'seychelles': ('#9ad0ec', '#fdf0d5', '#ffffff', ['#2a9d8f', '#1f7a6f', '#124a45'], 'sea'),
  'vietnam':    ('#f6bd60', '#f7ede2', '#fff4d9', ['#6a994e', '#386641', '#1f3d29'], 'mountain'),
  'uae':        ('#f28482', '#fcd5ce', '#fff1e6', ['#b5838d', '#6d6875', '#2b2d42'], 'city'),
  'hotel-aegean': ('#274c77', '#a3cef1', '#ffffff', ['#6096ba', '#3c6e8f', '#1b3a57'], 'sea'),
  'hotel-lagoon': ('#48cae4', '#caf0f8', '#ffffff', ['#00b4d8', '#0096c7', '#0077b6'], 'sea'),
  'hotel-orchid': ('#ffafcc', '#ffe5ec', '#fff', ['#7a9e7e', '#4f7355', '#2d4a35'], 'mountain'),
  'news-new-resort': ('#6d597a', '#eaac8b', '#ffe3d1', ['#b56576', '#6d597a', '#355070'], 'city'),
  'news-winter': ('#a8dadc', '#f1faee', '#ffffff', ['#457b9d', '#1d3557', '#0b1f3a'], 'mountain'),
  'news-flights': ('#0b132b', '#5bc0be', '#fff', ['#1c2541', '#162033', '#0b132b'], 'city'),
  'about':      ('#264653', '#e9c46a', '#fff3c4', ['#2a9d8f', '#1f7a6f', '#14463f'], 'sea'),
}

def ridge(rng, base, amp, color, peaks=7):
    pts = [(0, H)]
    xs = [W * i / (peaks * 3) for i in range(peaks * 3 + 1)]
    for x in xs:
        y = base - amp * (0.5 + 0.5 * math.sin(x / W * peaks * math.pi + rng.random() * 2)) * (0.5 + rng.random() * 0.6)
        pts.append((x, y))
    pts.append((W, H))
    d = ' '.join(f'{x:.0f},{y:.0f}' for x, y in pts)
    return f'<polygon points="{d}" fill="{color}"/>'

def waves(rng, base, color, n=1):
    d = f'M0 {H} L0 {base}'
    for i in range(0, W + 100, 100):
        d += f' Q {i + 50} {base - 20 - rng.random() * 25} {i + 100} {base}'
    d += f' L{W} {H} Z'
    return f'<path d="{d}" fill="{color}"/>'

def city(rng, base, color):
    out, x = [], 0
    while x < W:
        w, h = rng.randint(40, 110), rng.randint(120, 420)
        out.append(f'<rect x="{x}" y="{base - h}" width="{w}" height="{h + 400}" fill="{color}"/>')
        x += w + rng.randint(0, 14)
    return ''.join(out)

for name, (top, bot, sun, layers, motif) in ART.items():
    rng = random.Random(name)
    sx, sy = rng.randint(400, 1200), rng.randint(280, 480)
    body = ''
    if motif == 'mountain':
        body = ridge(rng, 700, 320, layers[0], 6) + ridge(rng, 800, 260, layers[1], 8) + ridge(rng, 920, 160, layers[2], 10)
    elif motif == 'sea':
        body = f'<rect y="620" width="{W}" height="{H}" fill="{layers[0]}"/>' + waves(rng, 700, layers[1]) + waves(rng, 820, layers[2]) \
             + f'<ellipse cx="{sx}" cy="690" rx="140" ry="14" fill="{sun}" opacity=".55"/>'
    else:
        body = ridge(rng, 760, 120, layers[0], 4) + city(rng, 800, layers[1]) + f'<rect y="820" width="{W}" height="200" fill="{layers[2]}"/>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top}"/><stop offset="1" stop-color="{bot}"/></linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="28"/></filter>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="{rng.randint(1, 99)}"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0"/></filter>
</defs>
<rect width="{W}" height="{H}" fill="url(#g)"/>
<circle cx="{sx}" cy="{sy}" r="170" fill="{sun}" opacity=".55" filter="url(#b)"/>
<circle cx="{sx}" cy="{sy}" r="78" fill="{sun}"/>
{body}
<rect width="{W}" height="{H}" filter="url(#n)" opacity=".10"/>
</svg>'''
    open(os.path.join(OUT, name + '.svg'), 'w').write(svg)
print('Generated', len(ART), 'images in', os.path.abspath(OUT))
