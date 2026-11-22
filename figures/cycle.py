"""Рисунки раздела 6: p–V-диаграммы трёх уровней расчёта цикла ВАЗ-21126, давление по углу,
закон Вибе и коэффициент теплоотдачи.

    closed_curve(key, before_tdc) — замкнутая кривая закрытой части цикла 180–540°. У уровней 0 и 1 теплота
                                    подводится мгновенно в ВМТ, поэтому перед точкой 360° вставляется давление
                                    конца сжатия — получается вертикальный скачок.
"""
import matplotlib.pyplot as plt
from common import load, save, comma, BLUE, GREY, DARK, RED

data = load('cycle_vaz')
curve = data['curve']
LEVELS = [('p0', GREY, 'идеальный цикл Отто', 1.2), ('p1', DARK, 'расчётный цикл', 1.4), ('p2', BLUE, 'пошаговый расчёт', 2.2)]


def closed_curve(key, before_tdc):
    closed_part = [point for point in curve if 180 <= point['ph'] <= 540]
    points = [(point['V'], point[key]) for point in closed_part]
    if before_tdc is not None:
        tdc = next(i for i, point in enumerate(closed_part) if point['ph'] == 360)
        points.insert(tdc, (points[tdc][0], before_tdc))
    points.append((points[-1][0], 0.85))
    return points


figure, ax = plt.subplots(figsize=(6.8, 4.4))
before_tdc = {'p0': data['pre360']['p0'], 'p1': data['pre360']['p1'], 'p2': None}
for key, color, label, width in LEVELS:
    points = closed_curve(key, before_tdc[key])
    ax.plot([v for v, _ in points], [p for _, p in points], color=color, lw=width, label=label)
ax.set_xlabel('V, см³')
ax.set_ylabel('p, бар')
ax.legend(frameon=False)
ax.set_xlim(0, 470)
ax.set_ylim(0, 140)
save(figure, 'cycle_pv.png')

figure, ax = plt.subplots(figsize=(6.8, 4.0))
around_tdc = [point for point in curve if 300 <= point['ph'] <= 480]
for key, color, label, width in LEVELS:
    ax.plot([point['ph'] for point in around_tdc], [point[key] for point in around_tdc], color=color, lw=width, label=label)
ax.axvline(360, color=RED, lw=0.8, ls=':')
ax.text(357, 128, 'ВМТ', color=RED, ha='right')
ax.set_xlabel('угол цикла Φ, °')
ax.set_ylabel('p, бар')
ax.legend(frameon=False)
ax.set_ylim(0, 140)
save(figure, 'cycle_p_phi.png')

figure, axes = plt.subplots(2, 1, figsize=(6.8, 5.6), sharex=True)
combustion = [point for point in curve if 320 <= point['ph'] <= 480]
axes[0].plot([point['ph'] for point in combustion], [point['xb'] for point in combustion], color=BLUE, lw=2)
axes[0].set_ylabel('доля сгоревшего\nтоплива x')
half_burned = next(point['ph'] for point in curve if point['xb'] >= 0.5)
axes[0].axhline(0.5, color=GREY, lw=0.8, ls='--')
axes[0].text(372, 0.42, f'x = 0,5 при Φ ≈ {comma(half_burned, 1)}°', fontsize=10)
series = data['series']
heat_transfer = [(phase, h) for phase, h in zip(series['phi'], series['h']) if 320 <= phase <= 480]
axes[1].plot([phase for phase, _ in heat_transfer], [h for _, h in heat_transfer], color=BLUE, lw=2)
axes[1].set_ylabel('коэффициент теплоотдачи\nα, Вт/(м²·К)')
axes[1].set_xlabel('угол цикла Φ, °')
save(figure, 'combustion_heat.png')
