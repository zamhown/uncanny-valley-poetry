from zhon.hanzi import punctuation as zh_punc
import jieba
import string
import re
import numpy as np
import pickle
import os
import json

from utils import get_path, get_poet_params_path


# 句子预处理
def pre_process_sentence(text):
    en_punc = string.punctuation
    text = re.sub('[a-zA-Z]', '', text) # 去除英文
    text = re.sub('[\d]', '', text) # 去除数字
    for i in zh_punc: # 去除中文符号
        text = text.replace(i, '')
    for i in en_punc: # 去除英文符号
        text = text.replace(i, '')
    return text


# 得到词列表和转移矩阵
def get_tm(dataset_dir):
    word_list = ['\n'] # embedding表，第一项为语句结束符号
    articles = [] # 文章列表

    for fn in os.listdir(dataset_dir):
        if fn.endswith('.txt'):
            with open(os.path.join(dataset_dir, fn), 'r', encoding='utf-8') as f:
                article = f.read()  # 读取文件

            article = article.replace('。', '\n') # 逗号变成换行
            article = article.replace('，', '\n') # 句号变成换行
            article = article.split() # 将文章分成句子
            new_article =[]

            for sentence in article: # 拆分每句为词，建立embedding表
                sentence = pre_process_sentence(sentence)
                sentence = list(jieba.cut(sentence, cut_all=False))
                for word in sentence:
                    if word not in word_list:
                        word_list.append(word)
                if len(sentence):
                    new_article.append(sentence)
            if len(new_article):
                articles.append(new_article)

    len_wl = len(word_list)
    transfer_mat = np.zeros([len_wl, len_wl]) * 1.0 # 词转移矩阵，第一个行向量为词作为句首的概率
    sen_transfer_mat = np.zeros([len_wl, len_wl]) * 1.0 # 句转移矩阵，用句首词-句首词的转移概率表示
    
    for article in articles:
        for sentence in article: # 学习词转移矩阵和词作为句首的概率
            # 学习句首分布
            l_s = len(sentence)
            first_word = sentence[0]
            first_idx = word_list.index(first_word)
            transfer_mat[0, first_idx] += 1 # 转移计数

            # 学习转移概率
            for idx in range(l_s): 
                ind_x = word_list.index(sentence[idx]) # 本词的embedding索引
                if idx < l_s - 1:
                    ind_y = word_list.index(sentence[idx + 1]) # 下一个词的embedding索引
                else:
                    ind_y = 0 # 若本词是句尾词，则下一个词是结束符号
                transfer_mat[ind_x, ind_y] += 1 # 转移计数

        # 学习句间转移
        l_a = len(article)
        first_word = article[0][0]
        first_idx = word_list.index(first_word)
        sen_transfer_mat[0, first_idx] += 1 # 转移计数
        for idx in range(l_a): 
            ind_x = word_list.index(article[idx][0]) # 本句首的embedding索引
            if idx < l_a - 1:
                ind_y = word_list.index(article[idx + 1][0]) # 下一个句首的embedding索引
            else:
                ind_y = 0 # 若本词是文章结尾词，则下一个词是结束符号
            sen_transfer_mat[ind_x, ind_y] += 1 # 转移计数

    for i in range(len_wl): # 转移概率 = 转移计数 / 总数
        s = np.sum(transfer_mat[i, :])
        if s > 0:
            transfer_mat[i, :] /= s
        else:
            transfer_mat[i, 0] += 1

        s = np.sum(sen_transfer_mat[i, :])
        if s > 0:
            sen_transfer_mat[i, :] /= s
        else:
            sen_transfer_mat[i, 0] += 1

    return word_list, transfer_mat, sen_transfer_mat # 词空间、转移矩阵、句转移矩阵


def train():
    word_list, transfer_mat, sen_transfer_mat = get_tm(get_path('text_datasets'))
    params = dict(zip(['word_list', 'transfer_mat', 'sen_transfer_mat'], [word_list, transfer_mat, sen_transfer_mat]))
    with open(get_poet_params_path(), 'wb+') as file:
        pickle.dump(params, file)
    
    word_list_content = json.dumps(word_list, ensure_ascii=False)
    with open(get_path('params/word_list.json'), 'w', encoding='utf-8') as file:
        file.write(word_list_content)


if __name__ == '__main__':
    train()
