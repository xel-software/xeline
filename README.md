# xeline computation client
[![Build Status](https://travis-ci.org/xel-software/xeline.svg?branch=master)](https://travis-ci.org/xel-software/xeline)

xeline is a client to submit tasks to the xel computation network

Important : This is not a wallet, and should not be used as one ! Some key feature to manage xel coins are missing, if you need to manage your coins use the officials wallets (desktop or web)

## installation

### binaries
Quickest way is to use the official binaries : https://github.com/xel-software/xeline/releases

### from sources
- install nodeJS (https://nodejs.org)
- clone this repository
- run `npm install` to setup dependencies
- run `npm start` to launch the client

## build
- install yarn
- run `yarn && yarn package:mac` to build a macOS client (only from a macOS host)
- run `yarn && yarn package:linux` to build a linux client
- run `yarn && yarn package:win` to build a windows client (only from a windows host)

You can also build a release using docker :
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
## Improve it

  - we love **pull requests**
  - we love issues (resolved ones actually ;-) )
  - in any case, make sure you leave **your ideas**
  - assist others on the issue tracker
  - **review** existing code and pull requests

----
## Troubleshooting (XEL Reference Software)

  - UI Errors or Stacktraces?
    - report on github

----
## Further Reading

  - on discord : https://link.xel.org/discord
