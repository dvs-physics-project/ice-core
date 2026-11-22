"""Общий стиль рисунков отчёта и загрузка результатов расчётов.

    load(name)            — results/<name>.json
    save(figure, name)    — сохранить рисунок в figures/png/<name> (200 dpi) и закрыть его
    comma(x, digits)      — число с десятичной запятой для подписей
    BLUE, GREY, DARK, RED — цвета линий
"""
import json
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS = os.path.join(ROOT, 'results')
OUT = os.path.join(ROOT, 'figures', 'png')

plt.rcParams.update({
    'font.family': 'Liberation Serif', 'font.size': 12,
    'axes.spines.top': False, 'axes.spines.right': False,
    'axes.grid': True, 'grid.color': '#dddddd', 'grid.linewidth': 0.6,
})
BLUE, GREY, DARK, RED = '#1f5fbf', '#9a9a9a', '#333333', '#c0392b'


def load(name):
    with open(os.path.join(RESULTS, name + '.json'), encoding='utf8') as file:
        return json.load(file)


def save(figure, name):
    os.makedirs(OUT, exist_ok=True)
    figure.savefig(os.path.join(OUT, name), dpi=200, bbox_inches='tight')
    plt.close(figure)
    print('figures/png/' + name)


def comma(x, digits=1):
    return f'{x:.{digits}f}'.replace('.', ',')
