"""Рисунок «Подъём, скорость и ускорение клапанов I4 симуляции» (раздел 10).

Подъём — из 3D-модели (results/valvetrain.json). Скорость и ускорение — аналитические производные
закона h = H(1 − u²)², u = (Φ − Φmax)/(2β) по времени при наибольших оборотах (функция motion).
"""
import math
import matplotlib.pyplot as plt
from common import load, save, BLUE, GREY, RED

data = load('valvetrain')
lift_curve = data['liftCurveI4']
CAM_LIFT_MM, HALF_WIDTH = 8.0, math.radians(75)
rpm = data['valves']['I4']['in']['rpm']
omega = rpm * math.pi / 30
peaks = {'in': data['valves']['I4']['in']['peak'], 'ex': data['valves']['I4']['ex']['peak']}


def motion(phase, peak):
    from_peak = ((phase - peak + 360) % 720) - 360
    u = math.radians(from_peak) / (2 * HALF_WIDTH)
    if abs(u) >= 1:
        return 0.0, 0.0
    dudt = omega / (2 * HALF_WIDTH)
    lift = CAM_LIFT_MM / 1000
    return -4 * lift * u * (1 - u * u) * dudt, lift * (12 * u * u - 4) * dudt ** 2


figure, axes = plt.subplots(3, 1, figsize=(6.8, 6.6), sharex=True)
phases = [point[0] for point in lift_curve]
axes[0].plot(phases, [point[1] for point in lift_curve], color=BLUE, lw=2, label='впускной')
axes[0].plot(phases, [point[2] for point in lift_curve], color=RED, lw=2, label='выпускной')
axes[0].set_ylabel('h, мм')
axes[0].legend(frameon=False, fontsize=9, loc='upper center')
fine = [i * 0.5 for i in range(1440)]
for side, color in [('in', BLUE), ('ex', RED)]:
    axes[1].plot(fine, [motion(phase, peaks[side])[0] for phase in fine], color=color, lw=1.6)
    axes[2].plot(fine, [motion(phase, peaks[side])[1] for phase in fine], color=color, lw=1.6)
axes[1].set_ylabel('v, м/с')
axes[2].set_ylabel('a, м/с²')
for ax in axes:
    for dead_centre in (0, 360, 720):
        ax.axvline(dead_centre, color=GREY, lw=0.8, ls=':')
axes[2].set_xlabel(f'угол цикла Φ, ° (I4 симуляции, {rpm} об/мин)')
axes[2].set_xticks(range(0, 721, 90))
save(figure, 'valve_motion.png')
