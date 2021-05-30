from zhon.hanzi import punctuation as zh_punc
import jieba
import string
import re
import numpy as np
import pickle

def pre_process_sentence(text):
    # 句子预处理
    en_punc = string.punctuation
    text = re.sub('[a-zA-Z]', '', text) # 去除英文
    text = re.sub('[\d]', '', text) # 去除数字
    for i in zh_punc: # 去除中文符号
        text = text.replace(i, '')
    for i in en_punc: # 去除英文符号
        text = text.replace(i, '')
    return text


def get_tm(txt_file_name = "tunxing.txt"):
    # 得到词列表和转移矩阵
    with open(txt_file_name, "r", encoding="utf-8") as f:  # 打开文件
        artical = f.read()  # 读取文件

    artical = artical.replace('。', '\n') # 逗号变成换行
    artical = artical.replace('，', '\n') # 句号变成换行
    artical = artical.split() # 将文章分成句子

    word_list = [] # embedding表

    for sentence in artical: # 拆分每句为词，建立embedding表
        sentence = pre_process_sentence(sentence)
        sentence = list(jieba.cut(sentence, cut_all=False))
        for word in sentence:
            if word not in word_list:
                word_list.append(word)

    word_list.append('\n') # embedding表中加入语句结束符号
    len_wl = len(word_list)

    transfer_mat = np.zeros([len_wl, len_wl]) * 1.0 # 词转移矩阵
    first_vector = np.zeros(len_wl) * 1.0 # 词作为句首的概率
    for sentence in artical: # 学习词转移矩阵和词作为句首的概率
        sentence = pre_process_sentence(sentence)
        sentence = list(jieba.cut(sentence, cut_all=False))
        l_s = len(sentence)
        if l_s > 0: # 句子非空时学习句首分布
            first_word = sentence[0]
            first_idx = word_list.index(first_word)
            first_vector[first_idx] += 1

        for idx in range(l_s): # 学习转移概率
            ind_x = word_list.index(sentence[idx]) # 本词的embedding索引
            if idx < l_s - 1:
                ind_y = word_list.index(sentence[idx + 1]) # 下一个词的embedding索引
            else:
                ind_y = -1 # 若本词是句尾词，则下一个词是结束符号
            transfer_mat[ind_x, ind_y] += 1 # 转移计数

    for i in range(len_wl): # 转移概率 = 转移计数 / 总数
        s = np.sum(transfer_mat[i, :])
        if s > 0:
            transfer_mat[i, :] /= s
        else:
            transfer_mat[i, -1] += 1

    first_vector /= np.sum(first_vector) # 句首概率 = 句首计数 / 总数

    return first_vector, word_list, transfer_mat # 句首概率、词空间、转移矩阵


def softmax(x):
    x = np.exp(x)
    s = np.sum(x)
    x_ = x / s
    return x_


def get_nw(word, word_list, transfer_mat, theta=50):
    # 根据上一个词，生成下一个词
    idx = word_list.index(word)
    transfer_vec = transfer_mat[idx, :]
    next_indx_list = np.argsort(transfer_vec)[::-1]
    next_p = transfer_vec[next_indx_list].copy()

    next_p = next_p * theta # 通过本行和下一行可以提高大概率转移的概率，theta越大句子越正常
    next_p = softmax(next_p)

    next_word_idx = np.random.choice(next_indx_list, p=next_p)
    next_word = word_list[next_word_idx]
    return next_word

def get_sentence(first_word, word_list, transfer_mat, discount=0.99):
    word = first_word
    sentence = word
    while True:
        word = get_nw(word, word_list, transfer_mat)
        sentence = sentence + word
        if word == '\n':
            break
        # 每生成一个词，则降低转移矩阵中转移到其他词的概率（乘以discount），进而提高所有词引发句子结束的概率
        transfer_mat[:, :-1] *= discount
        transfer_mat[:, -1] *= discount
        transfer_mat[:, -1] += (1 - discount)

    return sentence

def get_first_word(first_vector, word_list):
    first_word = np.random.choice(word_list, p=first_vector) # 依句首概率选择句首词
    return first_word

def main():
    # train = True # 是否使用语料库进行训练
    train = False
    if train:
        first_vector, word_list, transfer_mat = get_tm('语料数据集.txt')
        theta = dict(zip(['first_vector', 'word_list', 'transfer_mat'],[first_vector, word_list, transfer_mat]))
        with open('theta.pkl', 'wb+') as file:
            pickle.dump(theta, file)
    else:
        with open('theta.pkl', 'rb+') as file:
            theta = pickle.load(file)
        first_vector, word_list, transfer_mat = theta['first_vector'], theta['word_list'], theta['transfer_mat']

    for i in range(20):# 每次循环生成一个句子
        first_word = get_first_word(first_vector, word_list)
        sentence = get_sentence(first_word, word_list, transfer_mat, discount=0.999)
        print(sentence)


main()
