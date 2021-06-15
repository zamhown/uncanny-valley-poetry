from process_img import process_img
from export import export_img


def update_img():
    process_img()
    export_img()


if __name__ == '__main__':
    update_img()
