#!/bin/sh
# 将代码构建到uncanny-valley-poetry-dist仓库中
# Windows系统可在git bash下运行此脚本

rm -rf uncanny-valley-poetry-dist/static

mv .env.production assets/.env.production.1
mv assets/.env.production.2 .env.production
npm run build
mv .env.production assets/.env.production.2
mv assets/.env.production.1 .env.production

\cp -rf build/. uncanny-valley-poetry-dist