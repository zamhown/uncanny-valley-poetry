import os, shutil
import json
import random

import cv2
import numpy as np

from utils import get_path
from grad_cam import get_net, get_img_and_mask

def get_word_img_map():
    with open(get_path('params/synsets.json'), 'r', encoding='utf-8') as f:
        context = f.read()
        synsets = json.loads(context)

    with open(get_path('params/word_list.json'), 'r', encoding='utf-8') as f:
        context = f.read()
        word_list = json.loads(context)

    # 筛选可以用到的图片
    word_img_map = {}
    img_class_map = {}
    with open(get_path('img_datasets/caffe_ilsvrc12/val.txt'), 'r') as file:
        lines = file.readlines()
        for line in lines:
            ptr = line.index(' ')
            fn = line[:ptr]
            idx = int(line[ptr + 1:].strip())

            if os.path.exists(get_path('img_datasets/ILSVRC2012_img_val/' + fn)):
                flag = False
                for w in synsets[idx]:
                    if w in word_list:
                        if w not in word_img_map:
                            word_img_map[w] = []
                        word_img_map[w].append(fn)
                        flag = True
                
                if flag:
                    img_class_map[fn] = idx

    return word_img_map, img_class_map


# 对word_img_map进行压缩，每个词随机挑选k张图片
def random_sample_word_img_map(word_img_map, k):
    for w in word_img_map:
        word_img_map[w] = random.sample(word_img_map[w], k)


# 生成图片与cam mask
def process_cam(net, img_path, class_id, output_dir):
    img, mask = get_img_and_mask(net, img_path, class_id)
    # 拼接图片
    pic = np.concatenate([img, mask], axis=1)
    pic = np.uint8(pic * 255)

    path = os.path.join(output_dir, os.path.basename(img_path))
    cv2.imwrite(path, pic, [int(cv2.IMWRITE_JPEG_QUALITY), 50])


def process_img():
    print('生成插图中...')

    if not os.path.exists(get_path('img_datasets/ILSVRC2012_img_val')) or not os.path.exists(get_path('img_datasets/caffe_ilsvrc12')):
        print('生成插图跳过')
        return

    net = get_net()
    word_img_map, img_class_map = get_word_img_map()
    print(list(word_img_map.keys()))
    random_sample_word_img_map(word_img_map, 3)

    with open(get_path('params/word_img_map.json'), 'w', encoding='utf-8') as file:
        file.write(json.dumps(word_img_map, ensure_ascii=False))

    output_dir = get_path('imgs')
    if not os.path.exists(output_dir):
        os.mkdir(output_dir)

    imgs = set(fn for w in word_img_map for fn in word_img_map[w])
    i = 0
    for fn in imgs:
        if not os.path.exists(get_path('imgs/' + fn)):
            process_cam(net, get_path('img_datasets/ILSVRC2012_img_val/' + fn), img_class_map[fn], output_dir)
        i += 1
        print(f'({i}/{len(imgs)})')

    print('插图生成完成')


if __name__ == '__main__':
    process_img()
