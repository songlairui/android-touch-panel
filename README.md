# electron-vue in win  

> An electron-vue project  
> with opencv 3.x installed  
> **用途** 尝试在electron中使用opencv，写一下布局交互页面，备作它用。

### 预览方法  

**必要** 要安装opencv，3.x版本  

**special for windows**  
 windows 下安装，需要全局安装 windows-build-tools ，自动安装vc运行时。  
 打包时，windows需要下载nsis，会遇到CONNECT TIMEOUT问题。  
 这里同时给cmd和npm设置http_proxy 成功下载。

**Mac 下安装`opencv`**  

```bash
brew tap homebrew/science
brew install opencv3  
# 或者 Easy install for beginners
brew install opencv3 --with-contrib 
# 或者 For intermediate and advanced users. 
brew install opencv3 --with-contrib --with-cuda --with-ffmpeg --with-tbb --with-qt5

```

[参考链接](https://www.learnopencv.com/install-opencv-3-on-yosemite-osx-10-10-x/)  


#### Build Setup

``` bash
# install dependencies
npm install

# rebuild electron， 让opencv生效。
npm run electron-rebuild

# serve with hot reload at localhost:9080
npm run dev

# build electron application for production
npm run build:dir  # 在build/windows_unpacked 目录下有exe文件。  

npm run build  # 在build 目录下有exe文件，点击会进行安装。需要nsis,如果网络超时，可以忽略这个。


```

#### TODO LIST

- [x] eslint 选择 prettier 配置文件
- [x] 选择 iview 作为ui

#### 常见问题  

1. CONNECT TIMEOUT  
为终端和npm设置代理， set http_proxy 、 https_proxy  
Mac 下，使用proxychains4，竟然出了问题。  

```
export http_proxy="socks5://127.0.0.1:8086"
export https_proxy="socks5://127.0.0.1:8086"
npm config set proxy http://127.0.0.1:8087
npm config set https-proxy http://127.0.0.1:8087
```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
