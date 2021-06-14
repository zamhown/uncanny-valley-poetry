import time
import json
import string
from zhon.hanzi import punctuation as zh_punc
import jieba

from utils import get_path

def get_imagenet_map():
    en_punc = string.punctuation
    synset_map = {}
    with open(get_path('params/synset_words_cn.txt'), 'r', encoding='utf-8') as file:
        lines = file.readlines()
        for line in lines:
            key = line[:9]
            value = line[10:]
            words = set(jieba.cut(value, cut_all=True))
            synset_map[key] = [w for w in words if w not in en_punc and w not in zh_punc and w not in string.whitespace]

    synsets = []
    with open(get_path('img_datasets/caffe_ilsvrc12/synsets.txt'), 'r') as file:
        lines = file.readlines()
        for line in lines:
            synsets.append(synset_map[line.strip()])

    content = json.dumps(synsets, ensure_ascii=False)
    with open(get_path('params/synsets.json'), 'w', encoding='utf-8') as file:
        file.write(content)


if __name__ == '__main__':
    get_imagenet_map()