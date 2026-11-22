"""Рисунки раздела 11: внешняя скоростная характеристика ВАЗ-21126 рядом с паспортом и формулой Лейдермана,
и характеристики трёх двигателей симуляции (мощность — левая ось, момент — правая)."""
import matplotlib.pyplot as plt
from common import load, save, BLUE, DARK, RED

data = load('characteristics')
points = data['vazChar']
passport = data['passport']
rpms = [point['rpm'] for point in points]

figure, ax = plt.subplots(figsize=(6.8, 4.2))
torque_axis = ax.twinx()
torque_axis.spines['right'].set_visible(True)
torque_axis.grid(False)
ax.plot(rpms, [point['Ne'] for point in points], color=BLUE, lw=2.2, label='$N_e$, модель')
ax.plot(rpms, [point['leid'] for point in points], color=BLUE, lw=1, ls='--', label='$N_e$ по формуле Лейдермана (паспорт)')
torque_axis.plot(rpms, [point['Me'] for point in points], color=DARK, lw=2.2, label='$M_e$, модель')
ax.plot([passport['nN']], [passport['Ne']], 's', color=RED, ms=8, label=f"паспорт: {passport['Ne']} кВт при {passport['nN']}")
torque_axis.plot([passport['nM']], [passport['Me']], 'D', color=RED, ms=8, label=f"паспорт: {passport['Me']} Н·м при {passport['nM']}")
ax.set_xlabel('частота вращения n, об/мин')
ax.set_ylabel('мощность $N_e$, кВт')
torque_axis.set_ylabel('крутящий момент $M_e$, Н·м')
ax.set_ylim(0, 80)
torque_axis.set_ylim(80, 160)
power_handles, power_labels = ax.get_legend_handles_labels()
torque_handles, torque_labels = torque_axis.get_legend_handles_labels()
ax.legend(power_handles + torque_handles, power_labels + torque_labels, frameon=False, fontsize=9.5, loc='upper left')
save(figure, 'speed_vaz.png')

engines = load('sim_engines')
figure, axes = plt.subplots(1, 3, figsize=(10.5, 3.6))
for ax, key, title in zip(axes, ['I4', 'B4', 'V8'], ['I4 (бензин)', 'B4 (бензин)', 'V8 (дизель с наддувом)']):
    characteristic = engines[key]['char']
    engine_rpms = [point['rpm'] for point in characteristic]
    torque_axis = ax.twinx()
    torque_axis.grid(False)
    torque_axis.spines['right'].set_visible(True)
    ax.plot(engine_rpms, [point['Ne'] for point in characteristic], color=BLUE, lw=2)
    torque_axis.plot(engine_rpms, [point['Me'] for point in characteristic], color=DARK, lw=2, ls='--')
    ax.set_title(title, fontsize=12)
    ax.set_xlabel('n, об/мин')
    ax.set_ylabel('$N_e$, кВт', color=BLUE)
    torque_axis.set_ylabel('$M_e$, Н·м')
    ax.set_ylim(0, max(point['Ne'] for point in characteristic) * 1.15)
    torque_axis.set_ylim(0, max(point['Me'] for point in characteristic) * 1.25)
figure.tight_layout()
save(figure, 'speed_sim.png')
