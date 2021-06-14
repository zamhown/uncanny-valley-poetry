import numpy as np
import pickle

from numpy.core.defchararray import index

from utils import get_poet_params_path


def softmax(x):
    x = np.exp(x)
    s = np.sum(x)
    x_ = x / s
    return x_


# 根据上一个词，生成下一个词
def get_nw(word, word_list, transfer_mat, theta):
    idx = word_list.index(word)
    transfer_vec = transfer_mat[idx, :]
    next_indx_list = np.argsort(transfer_vec)[::-1]
    next_p = transfer_vec[next_indx_list].copy()

    next_p = next_p * theta # 通过本行和下一行可以提高大概率转移的概率，theta越大句子越正常
    next_p = softmax(next_p)

    next_word_idx = np.random.choice(next_indx_list, p=next_p)
    next_word = word_list[next_word_idx]
    return next_word


def get_sentence(first_word, word_list, transfer_mat, theta, beta):
    last_word = transfer_mat[:, 0].copy() # 备份所有词引发句子结束的概率

    word = first_word
    sentence = word
    while True:
        word = get_nw(word, word_list, transfer_mat, theta)
        sentence = sentence + word
        if word == '\n':
            break
        # 每生成一个词，则提升转移矩阵中转移到句尾的概率（乘以beta），进而提高所有词引发句子结束的概率
        transfer_mat[:, 0] *= beta

    transfer_mat[:, 0] = last_word # 恢复所有词引发句子结束的概率

    return sentence


def get_sen_first_word(word_list, transfer_mat, sen_transfer_mat, last_word = '', alpha = 0):
    if not last_word: # 整个文章第一词
        first_word = np.random.choice(word_list, p=transfer_mat[0, :]) # 依句首概率选择句首词
    else:
        last_word_idx = word_list.index(last_word)
        first_words = transfer_mat[0, :] + sen_transfer_mat[last_word_idx, :] * alpha # 句首全局概率叠加句首转移概率
        first_words = softmax(first_words)
        first_word = np.random.choice(word_list, p=first_words)
    return first_word


def eval(count, theta, alpha, beta):
    with open(get_poet_params_path(), 'rb+') as file:
        params = pickle.load(file)
    word_list, transfer_mat, sen_transfer_mat = params['word_list'], params['transfer_mat'], params['sen_transfer_mat']

    first_word = ''
    for i in range(count):# 每次循环生成一个句子
        first_word = get_sen_first_word(word_list, transfer_mat, sen_transfer_mat, first_word, alpha)
        sentence = get_sentence(first_word, word_list, transfer_mat, theta, beta)
        print(sentence)


if __name__ == '__main__':
    eval(50, 60, 0.5, 1.01)