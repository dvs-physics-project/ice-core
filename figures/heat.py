"""Рисунок «Распределение теплоты топлива ВАЗ-21126 по статьям баланса» (раздел 8): горизонтальные столбцы в % от Q_т."""
import matplotlib.pyplot as plt
from common import load, save, comma, BLUE, GREY

balance = load('heat')['balance']
fuel_heat = balance['Qt']
items = [
    ('Эффективная работа', balance['Qe'], BLUE),
    ('Теплота в стенки', balance['Qw'], GREY),
    ('С отработавшими газами', balance['Qg'], GREY),
    ('Неполнота сгорания', balance['Qnc'], GREY),
    ('Остаточный член\n(вкл. мех. потери)', balance['Qrest'], GREY),
]
figure, ax = plt.subplots(figsize=(6.8, 3.3))
ax.grid(False)
for index, (name, heat, color) in enumerate(items):
    row = len(items) - 1 - index
    share = heat / fuel_heat * 100
    ax.barh(row, share, color=color, height=0.6)
    ax.text(share + 0.8, row, comma(share) + ' %', va='center')
ax.set_yticks(range(len(items)))
ax.set_yticklabels([name for name, _, _ in items][::-1])
ax.set_xlabel('доля теплоты топлива, %')
ax.set_xlim(0, 48)
save(figure, 'heat_balance.png')
