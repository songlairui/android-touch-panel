<style>
.stage {
  height: 220px;
}

canvas.target {
  border: thin solid darkblue
}
</style>

<template lang="pug">
  div Canvas
    div.stage
      canvas.target(v-canvas='title')
    Button(type='primary' @click='randomTitle') Random Title
    Button(type='ghost' @click='randomTitle') Random Title
    Button(type='dashed' @click='randomTitle') Random Title
    Button(type='text' @click='randomTitle') Random Title
    Button(@click='randomTitle') Random Title
    br
    Button(type='primary' @click='size()') Set Size
    br
    Button(type='primary' @click='aniCircle()') Ani Circle
    Button(type='primary' @click='stopAni()') Stop Ani Circle
    Button(type='primary' @click='drawText()') Draw Text
    Button(type='primary' @click='clear()') Clear
</template>
<script>
export default {
  name: 'try-canvas',
  data() {
    return {
      title: 'try canvas'
    }
  },
  mounted() {
    this.bakCanvas = document.createElement('canvas')
    this.bakCanvas.width = this.canvas.el.width
    this.bakCanvas.height = this.canvas.el.height
  },
  methods: {
    randomTitle() {
      this.title = Math.ceil(Math.random() * 25 + 10)
    },
    size() {
      if (this.canvas) {
        this.canvas.el.width = Math.ceil(Math.random() * 5) * 10 + 200
        this.canvas.el.height = Math.ceil(Math.random() * 5) * 10 + 150
        this.canvas.width = this.canvas.el.width
        this.canvas.height = this.canvas.el.height
      }
    },
    drawText() {
      let context = this.canvas.context
      if (context) {
        context.font = '20px Microsoft YaHei';
        context.fillStyle = '#000000';
        context.fillText('canvas 绘制文字', Math.random() * 150, Math.random() * 100);
      }
    },
    aniCircle() {
      let context = this.canvas.context
      if (context) {
        this.drawCircle(id => this.requesterID = id)
      }
    },
    stopAni() {
      if (this.requesterID !== undefined)
        window.cancelAnimationFrame(this.requesterID)
    },
    drawCircle(callback) {

      let context = this.canvas.context
      if (context) {
        let backCtx = this.bakCanvas.getContext('2d')
        // console.info(this.bakCanvas, this.canvas)
        backCtx.drawImage(this.canvas.el, 0, 0, this.canvas.width, this.canvas.height);

        context.clearRect(0, 0, this.canvas.width, this.canvas.height)

        let radius = 10
        callback = callback || ((id) => { this.requesterID = id })
        context.beginPath();
        let [x, y] = [Math.random() * 150, Math.random() * 100]
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.closePath();
        context.lineWidth = 2; //线条宽度
        context.strokeStyle = 'rgba(250,50,50,1)'; //颜色
        context.stroke();
        context.drawImage(this.bakCanvas, 0, 0, this.canvas.width, this.canvas.height);

        // radius += 0.5; //每一帧半径增加0.5
        // //半径radius大于30时，重置为0
        // if (radius > 30) {
        //   radius = 0;
        // }
        let me = this.drawCircle.bind(this)
        // console.info(`${new Date()} ${x} - ${y}`)
        // console.info(me)
        // console.info(JSON.stringify(me.toString()))
        callback(window.requestAnimationFrame(() => me(callback)))
      }
    },
    clear() {
      this.canvas.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
      let ctx = this.bakCanvas.getContext('2d')
      ctx.clearRect(0, 0, this.bakCanvas.width, this.bakCanvas.height)
    }
  },
  directives: {
    canvas: {
      bind(el, binding, vNode) {
        let vm = vNode.context
        let context = el.getContext('2d')
        context.globalAlpha = 0.95;

        vm.canvas = {
          el,
          context,
          width: el.width,
          height: el.height
        }
        console.info('[canvas -d] binded')
      },
      inserted(el, binding, vNode) {
        console.info('[canvas -d] inserted')
      },
      update(el, binding, vNode) {
        // console.info('[canvas -d] update')
      },
      componentUpdated() {
        // console.info('[canvas -d] componentUpdated')
      },
      unbind() {
        // console.info('[canvas -d] unbind')
      }
    }
  }
}
</script>
