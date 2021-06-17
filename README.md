# 语言恐怖谷效应产生器

- GitHub Pages: [点此链接](https://zamhown.github.io/uncanny-valley-poetry/)

- 腾讯云版本（国内适用）: [点此链接](https://serverless-page-bucket-0m2wmngy-1253352899.cos-website.ap-hongkong.myqcloud.com/)

- 项目背景及技术简介: [点此链接](https://www.zhihu.com/question/449596775/answer/1944375749)


## 项目配置

本项目由一个React项目和一个Python3项目组成。Python项目用于语料库的预处理、训练以及插图的预处理，并在生成参数文件和插图素材后传递给React项目进行打包。

在配置项目前需手动下载ILSVRC2012数据集：
1. 在项目根目录的`python`目录下新建`img_datasets`文件夹
2. 下载ILSVRC2012_img_val.tar（[官方地址](http://www.image-net.org/challenges/LSVRC/2012/nnoupb/ILSVRC2012_img_val.tar)）
3. 将ILSVRC2012_img_val.tar中的所有内容解压至`python/img_datasets/ILSVRC2012_img_val`路径下
4. 下载标签文件包caffe_ilsvrc12.tar.gz（[官方地址](http://dl.caffe.berkeleyvision.org/caffe_ilsvrc12.tar.gz)）
5. 将caffe_ilsvrc12.tar.gz中的所有内容解压至`python/img_datasets/caffe_ilsvrc12`路径下

最后，在项目根目录下执行以下命令：
```shell
npm install
npm run init
```

第一行会安装React项目的相关依赖，第二行则会自动安装Python项目的相关依赖并执行初始化脚本。


## 语料库和超参数

训练长诗所用的语料库位于`python/text_datasets`目录下。可以在这个目录下自行放置任意个`.txt`文件，在训练时都会自动加载。

超参数配置文件位于`src/params/hyperParams.json`文件中，包含了θ、α、β三个超参数的声明（关于这些参数的介绍可见[这里](https://www.zhihu.com/question/449596775/answer/1944375749)）。

语料库和超参数将直接影响长诗生成效果。


## 项目使用

在项目的根目录下可以选择性地运行以下命令：

### `npm start`

在开发模式下运行网页。运行脚本后打开 [http://localhost:3000](http://localhost:3000) 即可在浏览器中预览。

### `npm run build`

构建网页并生成到`docs`文件夹下，用于部署在GitHub Pages。

### `npm run train-poet`

根据`python/text_datasets`目录下的语料库，重新训练马尔可夫模型的参数。这个参数是临时的，并不将更改传递到React项目中。

### `npm run eval-poet`

训练好模型参数后可以运行此命令在控制台中预览长诗生成效果，默认一次输出一段50行的长诗。可以通过更改`src/params/hyperParams.json`文件来微调超参数并预览效果。

### `npm run update-img`

更新所有插图：重新根据语料库的词典来随机挑选插图、并将插图进行预处理（通过DenseNet前向传播获取CAM热图）、将所有插图素材导入到React项目中。

### `npm run update`

运行全部Python脚本：重新训练马尔可夫模型、将模型参数传递到React项目中（更新到网页上）、更新所有插图、将所有插图素材导入到React项目中。

---

Have fun!
