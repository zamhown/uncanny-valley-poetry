from init import init
from process_poet import train
from process_img import process_img
from export import export_poet, export_img


def process_all():
    print('\n任务 1/5:')
    init()
    print('\n任务 2/5:')
    train()
    print('\n任务 3/5:')
    process_img()
    print('\n任务 4/5:')
    export_poet()
    print('\n任务 5/5:')
    export_img()


if __name__ == '__main__':
    process_all()