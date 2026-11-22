"""Рисунок «Путь, скорость и ускорение поршня ВАЗ-21126 за оборот вала» (раздел 4): точные и приближённые формулы."""
import matplotlib.pyplot as plt
from common import load, save, BLUE, GREY

curve = load('kinematics')['curve']
angles = [point['a'] for point in curve]
figure, axes = plt.subplots(3, 1, figsize=(6.8, 7.6), sharex=True)
rows = [(axes[0], 'x', 'xa', 'x, мм'), (axes[1], 'v', 'va', 'v, м/с'), (axes[2], 'acc', 'aa', 'a, м/с²')]
for ax, exact, approx, label in rows:
    ax.plot(angles, [point[exact] for point in curve], color=BLUE, lw=2, label='точная формула')
    ax.plot(angles, [point[approx] for point in curve], color=GREY, lw=1.3, ls='--', label='приближённая')
    ax.set_ylabel(label)
axes[0].legend(frameon=False)
axes[2].set_xlabel('угол поворота кривошипа α, °')
axes[2].set_xticks(range(0, 361, 45))
save(figure, 'kinematics.png')
