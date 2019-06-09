<!-- TITLE: Linux Xeline -->

<!-- SUBTITLE: A quick summary of Linux Xeline -->

## #Linux- xeline 教程

## 从文件安装：

```text
# Make sure unzip is installed
sudo apt-get install -y unzip
​
# Download the latest linux zip archive from:
https://github.com/xel-software/xeline/releases/latest
​
# Unzip the downloaded zip archive
unzip xeline-linux.zip
​
# Go into the directory containing the binary and launch it
cd Xeline-linux-x64
./Xeline
```

## 程序安装：

```text
# Make sure curl and git are installed
sudo apt-get install -y curl git
​
# Install a recent version of nodejs first, if you haven't already.
#For Ubuntu/Debian is works like this
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
​
# Get the repository
git clone https://github.com/xel-software/xeline.git
​
# Or if you already have it, cd into the directory containing your xeline sources and update the code
cd xeline
git pull
​
# Now, go into the directory containing your xeline sources and install all dependencies
# (needs to be done only once)
cd xeline
npm install
​
# And finally, run the application
npm start
```

## 视频教程

[视频](https://vimeo.com/265864522 ""){.vimeo}

[![Build Status](https://travis-ci.org/xel-software/xeline.svg?branch=master)](https://travis-ci.org/xel-software/xeline)
