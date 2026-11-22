"""Рисунок «Крутящий момент одного цилиндра и двигателя ВАЗ-21126 по углу поворота вала» (раздел 9)."""
import matplotlib.pyplot as plt
from common import load, save, comma, BLUE, GREY, DARK

data = load('dynamics')
curve = data['curve']
mean = data['torque']['mean']
angles = [point['th'] for point in curve]
figure, ax = plt.subplots(figsize=(6.8, 4.0))
ax.plot(angles, [point['cyl'] for point in curve], color=GREY, lw=1.3, label='цилиндр 1')
ax.plot(angles, [point['sum'] for point in curve], color=BLUE, lw=2.2, label='сумма 4 цилиндров')
ax.axhline(mean, color=DARK, lw=1, ls='--')
ax.text(625, mean + 14, f'среднее {comma(mean)} Н·м', fontsize=10)
ax.axhline(0, color=DARK, lw=0.6)
ax.set_xlabel('угол поворота вала θ, ° (0 — ВМТ вспышки в цилиндре 1)')
ax.set_ylabel('M, Н·м')
ax.set_xticks(range(0, 721, 90))
ax.legend(frameon=False, loc='upper right')
save(figure, 'torque.png')
