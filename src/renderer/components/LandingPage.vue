<template>
  <div id="wrapper">
    <img id="logo" src="~@/assets/logo.png" alt="electron-vue">
    <canvas id='test' width="400" height="400"></canvas>
    <main>
      <div class="left-side">
        <span class="title">
          Welcome to your new project!
        </span>
        <system-information></system-information>
      </div>
      <div class="right-side">
        <div class="doc">
          <div class="title">Current Folder: {{ currentFolder }}</div>
          <pre>{{ files.join(' \n - ') }}
            </pre>
          <button @click="open('https://simulatedgreg.gitbooks.io/electron-vue/content/')">Read the Docs</button><br><br>
        </div>
        <div class="doc">
          <div class="title alt">Other Documentation</div>
          <button class="alt" @click="open('https://electron.atom.io/docs/')">Electron</button>
          <button class="alt" @click="open('https://vuejs.org/v2/guide/')">Vue.js</button>
          <button @click='debug'>Debug OpenCV</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import SystemInformation from './LandingPage/SystemInformation'
import fs from 'fs'
import path from 'path'
import cv from 'opencv4nodejs'

export default {
  name: 'landing-page',
  components: { SystemInformation },
  data() {
    return {
      cv: null,
      currentFolder: ' - ',
      files: [],
      fs: null,
      path: null
    }
  },
  created() {
    // this.cv = this.$electron.remote.require('opencv4nodejs')
    // this.fs = this.$electron.remote.require('fs')
    // this.path = this.$electron.remote.require('path')
    this.currentFolder = path.resolve('./')
    this.files = fs.readdirSync('./')
  },
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link)
    },
    debug() {
      window.cv = cv
      window.vm = this
      let file = 'G:\\myrepo\\testopencv\\node-opencv-templatematching-test\\'
      let img = cv.imread(file + 'c01.jpg')
      let b = cv.imread(file + 'c02.jpg')
      let c = img.matchTemplate(b, 3)
      // // let img = a

      // console.info(img.cols * 2 * img.rows * 2, matRGBA.getData().length)
      let result = c.minMaxLoc()
      let { minLoc, maxLoc } = result
      console.info(JSON.stringify(result, '', 2))
      const color = new cv.Vec(1, 55, 20)
      let thickness = 2
        ;[minLoc, maxLoc].forEach(({ x, y }) => {
          img.drawRectangle(
            new cv.Point(x, y),
            new cv.Point(x + 40, y + 40),
            color,
            {
              thickness
            }
          )
        })

      const matRGBA =
        img.channels === 1
          ? img.cvtColor(cv.COLOR_GRAY2RGBA)
          : img.cvtColor(cv.COLOR_BGR2RGBA)
      let imgData = new ImageData(
        new Uint8ClampedArray(matRGBA.getData()),
        img.cols,
        img.rows
      )
      const canvas = document.getElementById('test')
      canvas.height = img.rows
      canvas.width = img.cols
      const ctx = canvas.getContext('2d')
      ctx.putImageData(imgData, 0, 0)
      // let raw = fs.readFileSync(file)
      // let im = cv.imread(file)
      // console.info({ raw, im })
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
}

#wrapper {
  background: radial-gradient( ellipse at top left,
  rgba(255, 255, 255, 1) 40%,
  rgba(229, 229, 229, 0.9) 100%);
  min-height: 100vh;
  padding: 60px 80px;
  width: 100vw;
}

#logo {
  height: auto;
  margin-bottom: 20px;
  width: 420px;
}

main {
  display: flex;
  justify-content: space-between;
}

main>div {
  flex-basis: 50%;
}

.left-side {
  display: flex;
  flex-direction: column;
}

.welcome {
  color: #555;
  font-size: 23px;
  margin-bottom: 10px;
}

.title {
  color: #2c3e50;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 6px;
}

.title.alt {
  font-size: 18px;
  margin-bottom: 10px;
}

.doc p {
  color: black;
  margin-bottom: 10px;
}

.doc button {
  font-size: 0.8em;
  cursor: pointer;
  outline: none;
  padding: 0.75em 2em;
  border-radius: 2em;
  display: inline-block;
  color: #fff;
  background-color: #4fc08d;
  transition: all 0.15s ease;
  box-sizing: border-box;
  border: 1px solid #4fc08d;
}

.doc button.alt {
  color: #42b983;
  background-color: transparent;
}
</style>
