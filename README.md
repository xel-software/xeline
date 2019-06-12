# xeline 算力客户端
[![Build Status](https://travis-ci.org/xel-software/xeline.svg?branch=master)](https://travis-ci.org/xel-software/xeline)

xeline是一个用于发布任务到xel算力网络的客户端

重要提示:这并不是一个钱包，请不要把它用作钱包！某些代币的管理功能，该客户端并不具备，如果你需要管理您的代币，
请使用正式的官方钱包（桌面版或者网页钱包）

## 安装

### 程序文件
最快捷的方式是使用官方程序文件：
Quickest way is to use the official binaries : https://github.com/xel-software/xeline/releases

### 使用源码
## 准备
- install nodeJS (https://nodejs.org)
- clone this repository
- run `npm install` to setup dependencies
- run `npm start` to launch the client

## 创建
- install yarn
- run `yarn && yarn package:mac` to build a macOS client (only from a macOS host)
- run `yarn && yarn package:linux` to build a linux client
- run `yarn && yarn package:win` to build a windows client (only from a windows host)

您也可以通过docker创建分发文件:
```
docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:wine \
 /bin/bash -c "yarn && yarn package:windows"
 ```


----
## 改进xeline

  - 我们喜欢更多的推送/ pull requests
  - 我们也喜欢更多的问题/issues(提出必解决;-) )
  - 无论如何，都欢迎您提出任何的想法/ideas
  - 欢迎解决和跟进其他人提出的问题/issuse
  - 欢迎查看现有的代码和推送/pull requeset

----
## 故障排除 (XEL相关的软件)

  - UI 错误或者堆栈复写
    -可以在github上提交

----
## 了解更多

  - on discord : https://link.xel.org/discord
