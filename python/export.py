import pickle
import json
import os, shutil

from skimage import io
import numpy as np

from utils import get_path, get_poet_params_path

# 截断小数
def cut_num(num):
    num = round(num, 6)
    if num - int(num) == 0:
        num = int(num)
    return num

# 压缩数据格式
def transform(word_list, transfer_mat, sen_transfer_mat):
    transfer_list = []
    RESERVE_COUNT = 10 # 每个行向量除句尾概率外最大保留的元素数
    for i in range(len(word_list)):
        item = {'k':[0], 'v':[cut_num(transfer_mat[i, 0])]} # 句尾概率保留
        vec = [list(t) for t in enumerate(transfer_mat[i, :]) if t[0] > 0 and t[1] > 0]
        vec = sorted(vec, key=lambda t: t[1], reverse=True)
        if i > 0:
            vec = vec[:RESERVE_COUNT] # 第一个行向量（句首概率）完全保留，其余行向量截断一部分以压缩
        for t in vec:
            item['k'].append(t[0])
            item['v'].append(cut_num(t[1]))
        transfer_list.append([item['k'], item['v']])

    sen_transfer_list = [[], [], []] # k1, k2, v
    for i in range(len(word_list)):
        for j in range(len(word_list)):
            if sen_transfer_mat[i, j] > 0:
                sen_transfer_list[0].append(i)
                sen_transfer_list[1].append(j)
                sen_transfer_list[2].append(cut_num(sen_transfer_mat[i, j]))

    return word_list, transfer_list, sen_transfer_list


def export_poet():
    with open(get_poet_params_path(), 'rb+') as file:
        params = pickle.load(file)

    word_list, transfer_mat, sen_transfer_mat = params['word_list'], params['transfer_mat'], params['sen_transfer_mat']
    word_list, transfer_list, sen_transfer_list = transform(word_list, transfer_mat, sen_transfer_mat)
    prefix = 'export const params: {wordList: string[], transferList: [number[], number[]][], senTransferList: [number[], number[], number[]]} = '
    content = prefix + json.dumps({
        'wordList': word_list,
        'transferList': transfer_list,
        'senTransferList': sen_transfer_list
    }, ensure_ascii=False)

    with open(get_path('../src/params/params.ts'), 'w', encoding='utf-8') as file:
        file.write(content)


def export_img():
    with open(get_path('params/word_img_map.json'), 'r', encoding='utf-8') as file:
        context = file.read()
        word_img_map = json.loads(context)

    img_output_dir = get_path('../src/assets/illustration/')
    if os.path.exists(img_output_dir):
        shutil.rmtree(img_output_dir)
    os.mkdir(img_output_dir)
    
    # 对图片文件名做哈希，缩短文件名
    new_word_img_map = {}
    img_hash_map = {}
    img_len = 0
    for w in word_img_map:
        new_word_img_map[w] = []
        for fn in word_img_map[w]:
            if fn not in img_hash_map:
                img_hash_map[fn] = str(img_len) + '.jpg'
                img_len += 1

                # 导出文件
                shutil.copy(get_path('imgs/' + fn), img_output_dir + img_hash_map[fn])

            new_word_img_map[w].append(img_hash_map[fn])

    # 导出word_img_map
    prefix = 'export const wordImgMap: {[word: string]: string[]} = '
    content = prefix + json.dumps(new_word_img_map, ensure_ascii=False)

    with open(get_path('../src/params/wordImgMap.ts'), 'w', encoding='utf-8') as file:
        file.write(content)


if __name__ == '__main__':
    export_poet()
    export_img()