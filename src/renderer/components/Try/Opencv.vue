<template lang="pug">
  div Opencv
    .control
      Button(type='primary' @click='newmat') test New Mat
      Button(type='primary' @click='matfromfile') New Mat from file
      Button(type='primary' @click='mattocanvas()') draw mat to canvas
      Button(type='primary' @click='matfromcanvas') grab arrayData from canvas
      br
      input(type='file' @change='fileHere')
      br
      Button(type='primary' @click='setImg("oriImg")') set Ori Image
      Button(type='primary' @click='setImg("tmpImg")') set template Image
      Button(type='primary' @click='matchTemplate') cv.matchTemplate
      Button(type='primary' @click='sift') cv.sift
      br 
      Button(@click='drawRect()') Draw Rect
    canvas.forDisplay

</template>
<style>
.forDisplay {
  border: thin solid red;
  max-width: 80%;
}
</style>

<script>
export default {
  name: 'try-opencv',
  data() {
    return {
      msg: ''
    }
  },
  methods: {
    setImg(varName) {
      let mat = this.matfromcanvas()
      this[varName] = mat
    },
    matchTemplate() {
      if (this.oriImg && this.tmpImg) {
        console.info(this.oriImg, this.tmpImg)
        let result = this.oriImg.matchTemplate(this.tmpImg, 3).minMaxLoc()
        this.mattocanvas(null, this.oriImg)
        const canvas = document.querySelector('.forDisplay');
        const ctx = canvas.getContext('2d');
        let { cols, rows } = this.tmpImg
        ctx.strokeRect(result.maxLoc.x, result.maxLoc.y, cols, rows);

        ctx.font = '20px Microsoft YaHei';
        ctx.fillStyle = '#000000';
        ctx.fillText(result.maxVal, result.maxLoc.x, result.maxLoc.y - 20);

        // this.mattocanvas(null, result)
      } else {
        this.$message.error('No Source')
      }
    },
    sift() {

    },
    fileHere(e) {
      let file = (e.target.files || e.dataTransfer.files)[0]
      // let reader = new FileReader()
      // reader.onload = (e) => {
      //   console.info('file loaded')
      //   let ab = e.target.result
      //   console.info(ab)
      // }
      // // reader.readAsArrayBuffer(file)
      // reader.readAsDataURL(file)
      if (file) {
        console.info({ file })
        let a = window.URL.createObjectURL(file)
        console.info({ a })
        let tmpimg = document.createElement('img')
        tmpimg.src = a
        tmpimg.onload = () => {
          let canvas = document.querySelector('canvas')
          canvas.width = tmpimg.width
          canvas.height = tmpimg.height
          let ctx = canvas.getContext('2d')
          ctx.drawImage(tmpimg, 0, 0)
        }
      }
    },
    newmat() {
      const rows = 100; // height
      const cols = 100; // width      
      let mat = new this.cv.Mat(rows, cols, this.cv.CV_8UC3, [255, 155, 55]);
      return mat
    },
    matfromfile() {

    },
    matfromBuffer() {
      let { imageData, height, width } = this.imgDatafromcanvas()
      let matRGBA = new this.cv.Mat(Buffer.from(imageData.data), height, width, this.cv.CV_8UC4)
    },
    mattocanvas(e, data) {
      let mat = data || this.newmat()
      console.info({ mat })
      let rows = mat.rows
      let cols = mat.cols
      console.info('length of matBGR', mat.getData().length)
      mat = mat.channel === 1 ? mat.cvtColor(this.cv.COLOR_GRAY2RGBA) : mat.cvtColor(this.cv.COLOR_BGR2RGBA)
      console.info(mat.getData().length, cols, rows)
      const imgData = new ImageData(
        new Uint8ClampedArray(mat.getData()),
        cols,
        rows
      );
      const canvas = document.querySelector('.forDisplay');
      canvas.height = rows;
      canvas.width = cols;

      // set image data
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imgData, 0, 0);
    },
    imgDatafromcanvas() {
      const canvas = document.querySelector('.forDisplay');
      let width = canvas.width
      let height = canvas.height
      const ctx = canvas.getContext('2d');
      let imageData = ctx.getImageData(0, 0, width, height)
      // console.info({ imageData })
      return { imageData, width, height }
    },
    matfromcanvas() {
      let { imageData, height, width } = this.imgDatafromcanvas()
      let matRGBA = new this.cv.Mat(Buffer.from(imageData.data), height, width, this.cv.CV_8UC4)
      let matBGR = matRGBA.cvtColor(this.cv.COLOR_RGBA2BGR)
      return matBGR
    },
    drawRect(data) {
      let { x = 1, y = 1, w = 10, h = 10 } = data || { x: 1, y: 1, w: 10, h: 10 }
      const canvas = document.querySelector('.forDisplay');
      const ctx = canvas.getContext('2d');
      ctx.fillRect(25, 25, 100, 100);
      ctx.clearRect(45, 45, 60, 60);
      ctx.strokeRect(50, 50, 50, 50);
    }
  },
  created() {
    console.info('created')
    this.cv = this.$electron.remote.require('opencv4nodejs')
    console.info(this)
    window.vm = this
  }
}
</script>
