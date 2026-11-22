"""Рисунок «p–V-диаграммы двигателей симуляции» (раздел 7): пошаговый расчёт, у V8 — ещё смешанный цикл уровня 1."""
import matplotlib.pyplot as plt
from common import load, save, BLUE, GREY

engines = load('sim_engines')
diesel_level1 = load('diesel')['level1Curve']
figure, axes = plt.subplots(1, 3, figsize=(10.5, 3.5))
for ax, key in zip(axes, ['I4', 'B4', 'V8']):
    curve = engines[key]['curve']
    ax.plot([point[1] for point in curve], [point[2] for point in curve], color=BLUE, lw=2, label='уровень 2')
    if key == 'V8':
        ax.plot([point[1] for point in diesel_level1], [point[2] for point in diesel_level1], color=GREY, lw=1.2, label='уровень 1 (λ, ρ)')
        ax.legend(frameon=False, fontsize=9)
    ax.set_title(f"{key}, {engines[key]['rpm']} об/мин", fontsize=12)
    ax.set_xlabel('V, см³')
    ax.set_ylabel('p, бар')
figure.tight_layout()
save(figure, 'sim_pv.png')
