"""Строит все рисунки отчёта из results/*.json. Запуск: python3 figures/make_all.py"""
import os
import runpy
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
for name in ['architecture', 'kinematics', 'cycle', 'sim_pv', 'heat', 'dynamics', 'valvetrain', 'characteristics']:
    runpy.run_path(os.path.join(HERE, name + '.py'), run_name='__main__')
