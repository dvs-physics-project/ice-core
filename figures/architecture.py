"""Рисунок «Схема реализации: от исходных данных к симуляции» (раздел 2): четыре блока со стрелками."""
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from common import save, DARK

BLOCKS = [
    ('Исходные данные', 'размеры, ε, n,\nтопливо, наддув'),
    ('ice-core', 'расчётное ядро:\n7 блоков, 38 тестов'),
    ('physics.js', 'пересчёт цикла\nпри смене оборотов'),
    ('3D-симуляция', 'Three.js: детали,\nгаз, графики'),
]
GAP = 0.5

figure, ax = plt.subplots(figsize=(10, 2.8))
ax.axis('off')
ax.grid(False)
ax.set_xlim(0, 10)
ax.set_ylim(0, 2.8)
width = 10 / len(BLOCKS) - GAP
for index, (title, subtitle) in enumerate(BLOCKS):
    left = index * (width + GAP) + 0.1
    ax.add_patch(FancyBboxPatch((left, 0.6), width, 1.6, boxstyle='round,pad=0.05', fc='#e8eef8', ec=DARK))
    ax.text(left + width / 2, 1.75, title, ha='center', va='center', fontsize=12, weight='bold')
    ax.text(left + width / 2, 1.1, subtitle, ha='center', va='center', fontsize=10)
    if index < len(BLOCKS) - 1:
        ax.annotate('', xy=(left + width + 0.45, 1.4), xytext=(left + width + 0.07, 1.4),
                    arrowprops=dict(arrowstyle='->', lw=1.8, color=DARK))
save(figure, 'architecture.png')
