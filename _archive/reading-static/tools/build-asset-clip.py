"""원본 픽셀을 읽어 CSS 표시용 외곽선을 만든다. 이미지 파일은 수정하지 않는다."""
from collections import deque
from math import hypot
from pathlib import Path
from PIL import Image

image = Image.open('assets/enemies/e04-hide-and-seek-mole-v1.png').convert('RGB')
width, height = image.size
pixels = list(image.get_flattened_data())
background = bytearray(width * height)
queue = deque()
for x in range(width):
    queue.extend((x, (height - 1) * width + x))
for y in range(height):
    queue.extend((y * width, y * width + width - 1))
while queue:
    index = queue.popleft()
    if background[index]:
        continue
    color = pixels[index]
    if max(color) - min(color) > 42 or max(color) < 105:
        continue
    background[index] = 1
    x, y = index % width, index // width
    if x: queue.append(index - 1)
    if x < width - 1: queue.append(index + 1)
    if y: queue.append(index - width)
    if y < height - 1: queue.append(index + width)

# 배경의 작은 색 잡음을 제외하고 가장 큰 연결 영역만 사용한다.
visited = bytearray(width * height)
main = []
for start in range(width * height):
    if background[start] or visited[start]:
        continue
    queue = deque([start]); visited[start] = 1; component = []
    while queue:
        index = queue.popleft(); component.append(index)
        x, y = index % width, index // width
        neighbors = []
        if x: neighbors.append(index - 1)
        if x < width - 1: neighbors.append(index + 1)
        if y: neighbors.append(index - width)
        if y < height - 1: neighbors.append(index + width)
        for other in neighbors:
            if not background[other] and not visited[other]:
                visited[other] = 1; queue.append(other)
    if len(component) > len(main): main = component
mask = set(main)
edges = {}
for index in main:
    x, y = index % width, index // width
    if index - width not in mask: edges[(x, y)] = (x + 1, y)
    if index + 1 not in mask: edges[(x + 1, y)] = (x + 1, y + 1)
    if index + width not in mask: edges[(x + 1, y + 1)] = (x, y + 1)
    if index - 1 not in mask: edges[(x, y + 1)] = (x, y)
loops = []
while edges:
    start = next(iter(edges)); point = start; loop = []
    while point in edges:
        loop.append(point); point = edges.pop(point)
        if point == start: break
    if len(loop) > 10: loops.append(loop)
points = max(loops, key=len)

def simplify(points, tolerance=1.3):
    if len(points) < 3: return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    denominator = hypot(dx, dy)
    distances = [abs(dy * (x - a[0]) - dx * (y - a[1])) / denominator if denominator else hypot(x - a[0], y - a[1]) for x, y in points]
    index = max(range(len(distances)), key=distances.__getitem__)
    if distances[index] <= tolerance: return [a, b]
    return simplify(points[:index + 1])[:-1] + simplify(points[index:])

points = simplify(points)
polygon = ','.join(f'{x / width * 100:.3f}% {y / height * 100:.3f}%' for x, y in points)
Path('css/asset-clips.css').write_text('/* 원본 RGB는 보존하고 CSS로 외곽 배경만 숨긴다. tools/build-asset-clip.py로 재생성. */\n.enemy-art { clip-path: polygon(' + polygon + '); }\n')
print('Character outline:', len(points), 'vertices')
