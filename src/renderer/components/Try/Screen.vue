<style>
.stage {
  box-sizing: border-box;
  padding: .5em
}

.view {
  height: 100%;
  overflow: auto;
}

.screen {
  /* border: thin solid plum; */
  border-radius: 3px;
  max-width: 100%;
}

.coverage {
  position: absolute;
  top: .5em;
  left: .5em;
  z-index: 100;
  background: rgba(123, 223, 55, .1)
}

.step {
  padding: .5em
}

.current {
  border: thin solid red;
  /* color: green */
}
</style>

<template lang="pug">
  div.view(@scroll='viewScroll')
    Row(type='flex')
      Col.stage(style={flex:'1'})
        canvas.screen(v-screen='screendata' :width='canvasWidth'  :height='canvasHeight')
        canvas.coverage(v-coverage='cursorData' @mousedown='mouseAct'  @mouseup='mouseAct'  @mousemove='mouseAct' :width='canvasBoundary.width'  :height='canvasBoundary.height')
      Col
        Row
          Dropdown(@on-select='selectDevice')
            Button(type="primary") Device列表
              Icon(type="arrow-down-b")
            DropdownMenu(slot='list')
              DropdownItem(:name='idx' v-for='(device,idx) in devices' :key='idx')
                Icon(type="social-android")
                | {{ device.name }}
          br
          Dropdown()
            Button(type="primary") Service Action
              Icon(type="arrow-down-b")
            DropdownMenu(slot='list')
              DropdownItem 
                Button(type="ghost" icon="ios-color-wand-outline" @click='checkProcess') 检查进程
              DropdownItem
                Button(type="ghost" icon="ios-sunny-outline" @click='startMinicap') 启动Minicap
              DropdownItem
                Button(type="ghost" icon="ios-crop" @click='monitorRotate') 监控Rotater
              DropdownItem
                Button(type="ghost" icon="ios-color-filter-outline" @click='gotStream') 读取Stream 
              DropdownItem
                Button(type="ghost" icon="ios-color-filter-outline" @click='stopStream') 停止Stream 
        Row
          ButtonGroup(vertical)
            Button(type="ghost" icon="ios-color-wand-outline" @click='mode=1') 截取界面
            Button(type="ghost" icon="ios-sunny-outline" @click='mode=2') 界面区域截取
            Button(type="ghost" icon="ios-crop" @click='mode=3') 寻找模板图片
            Button(type="ghost" icon="ios-color-filter-outline" @click='mode=4') 定义识别区域
        Row
          | 鼠标定位
          i-switch(v-model="configure.cursorCross" size="large")
            span(slot="open") cross
            span(slot="close") nocorss
        Row
          | 标记区域
          i-switch(v-model="configure.markMode" size="large")
            span(slot="open") 标记
            span(slot="close") 正常
        Row
          ButtonGroup(vertical)
            Button(type="ghost" icon="ios-color-filter-outline" @click='setout') 执行序列
            //- Button(type="ghost" icon="ios-color-filter-outline" @click='tryClick') tryClick
            Button(type="ghost" icon="ios-color-filter-outline" @click='log') console.log sequenct
        
        Card(:bordered=false)
          pre.
            PDI_minicap: {{ deviceStatus.PID_minicap.join(',') }} 
            旋转： {{ deviceStatus.orientation }} 
            区域： {{ rect }}
    Row(type='flex')
      Col.step(v-for='(sect,idx) in sequence' :key='idx' :class="{current:idx === sequenceCurrentIdx}")
        Select(v-model="sect.act" style="width:100px")
          Option(v-for="(v,k) in act" :value="k" :key="k") {{ k }}
        InputNumber(v-model="sect.wait" :max='20000' :min='2' :step='5')
      Col
        Button(type="primary" shape="circle" icon="plus-round" @click='addSect')
</template>
<script>
import { tagDevice, listDevices, checkRunning, startMinicap, startMiniTouch, getRotatorMonitor, closeRotatorMonitor } from '@/util/adbkit.js'
import { liveStream, getTouchSocket } from '@/util/getStream.js'
import _ from 'lodash'
import * as conf from '@/util/level1.json'
// console.info({ conf })

function drawCross(point, ctx, el) {
  let { x, y } = point
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(el.width, y)
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, 0)
  ctx.lineTo(x, el.height)
  ctx.stroke();
}


function clickPoint(point, socket, orientation = '90', ratio = 1, act) {
  if (!point || !socket) return console.info('unable click')
  let { x, y } = point
    // console.info('click @ ', x, y)
    ;[x, y] = [x, y].map(n => Math.floor(ratio * n))
  // console.info('click @ ', x, y)
  switch (orientation) {
    case '270':
      ;[x, y] = [y, 1920 - x]
      break
    case '90':
      ;[x, y] = [1080 - y, x]
      break
    case '180':
      ;[x, y] = [1080 - x, 1920 - y]
      break
  }
  let u = act === 'jump'
  socket.write(`r\n`)
  socket.write(`c\n`)
  socket.write(`d ${u ? '1' : '0'} ${x} ${y} ${u ? '20' : '60'}\n`)
  socket.write(`c\n`)
  socket.write(`u ${u ? '1' : '0'}\n`)
  socket.write(`c\n`)
}

function drawRect(pointA, pointB, ctx) {
  ctx.fillRect(Math.min(pointA.x, pointB.x), Math.min(pointA.y, pointB.y), Math.abs(pointA.x - pointB.x), Math.abs(pointA.y - pointB.y))
}

export default {
  name: 'screen',
  data() {
    return {
      modal1: false,
      devices: [],
      currentdevice: null,
      deviceStatus: {
        PID_minicap: [],
        PID_minitouch: [],
        orientation: '0'
      },
      screendata: null,
      stamp: '',
      canvasWidth: 100,
      canvasHeight: 100,
      ratio: 1,
      canvasBoundary: {
        scrollTop: 0,
        x: 0, y: 0, width: 100, height: 100
      },
      flag: 'NONE',
      mode: 0,
      cursorData: {
        cursor: {
          x: 10, y: 10
        },
        points: {
          clickin: null,
          clickout: null
        },
        markLayer: [
          [{ cross: [250, 250] }]
        ]
      },
      configure: {
        cursorCross: false,
        markMode: false
      },
      act: {
        start: [138, 924],
        pause: [1827, 90],
        color: [324, 528],
        jump: [1512, 528]
      },
      sequenceCurrentIdx: 0,
      sequence: conf
    }
  },
  created() {
    this.mark = {
      lastTimeStamp: null,
      stream: null,
      touchSocket: null,
      theend: false,
      pressing: false
    }
    listDevices().then(devices => {
      this.devices = devices //.concat({ name: 'TEST' })
      console.info({ devices })
    })
  },
  async mounted() {
    await this.startMinicap()
    await this.startMiniTouch()
    await this.getTouchServ()
    await this.checkProcess()
    await this.monitorRotate()
    window.onresize = _.debounce(this.calcTouchParams, 500)
    this.calcTouchParams()
  },
  async destroyed() {
    await closeRotatorMonitor()
    this.stopStream()
  },

  directives: {
    screen(el, binding, vNode) {
      // console.info('[canvas Screen]')
      if (!binding.value) return
      // console.info('render an image ---- ', +new Date())
      let BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
      var g = el.getContext('2d')
      var blob = new Blob([binding.value], { type: 'image/jpeg' })
      var URL = window.URL || window.webkitURL
      var img = new Image()
      img.onload = () => {
        vNode.context.canvasWidth = img.width
        vNode.context.canvasHeight = img.height
        g.drawImage(img, 0, 0)
        // firstImgLoad = true
        img.onload = null
        img.src = BLANK_IMG
        img = null
        u = null
        blob = null
      }
      var u = URL.createObjectURL(blob)
      img.src = u
    },
    coverage(el, binding, vNode) {
      // console.info('[canvas] coverage')
      if (!binding.value) return
      let y = binding.value.cursor.y
      let x = binding.value.cursor.x
      let vm = vNode.context
      let ratio = vm.ratio
      var ctx = el.getContext('2d')
      // let { cursor } = binding.value
      let { clickin, clickout } = binding.value.points
      ctx.clearRect(0, 0, el.width, el.height)

      if (vm.configure.cursorCross) {
        drawCross(binding.value.cursor, ctx, el)
      }
      if (vm.configure.markMode) {
        clickin && drawCross(clickin, ctx, el)
        clickout && drawCross(clickout, ctx, el)
        ctx.globalAlpha = 0.2
        if (clickin && clickout) {
          drawRect(clickin, clickout, ctx)
        } else if (clickin) {
          drawRect(clickin, binding.value.cursor, ctx)
        }
        ctx.globalAlpha = 1.0
      }

      ctx.font = '20px Microsoft YaHei';
      ctx.fillStyle = '#000000';
      ctx.fillText(`${Math.floor(x * ratio)},${Math.floor(ratio * y)}`, x + (x + 100 < el.width ? 5 : -100), y + (y + 50 > el.height ? -15 : +35));
    }
  },

  watch: {
    canvasWidth: function(newValue, oldValue) {
      // console.info({ newValue, oldValue })
      this.calcTouchParams()
    }
  },
  computed: {
    rect() {
      return ''
    }
  },
  methods: {
    log() {
      console.info(this)
      let result = { sequence: this.sequence }
      console.info(result)
      console.info(JSON.stringify(result, '', 2))
    },
    addSect() {
      this.sequence.push({
        act: 'pause',
        wait: 10
      })
    },
    async tryClick() {
      clickPoint(this.cursorData.points.clickin, this.mark.touchSocket, this.deviceStatus.orientation, this.ratio)
    },
    async setout() {
      console.info('set out to do this sequenct')
      if (!this.mark.touchSocket) return this.$Message.error('no TouchSocket')
      // for (let { act, wait } of this.sequence0) {
      //   wait = wait || 100
      //   let [x, y] = this.act[act]
      //   clickPoint({ x, y }, this.mark.touchSocket, this.deviceStatus.orientation, 1, act === 'jump')
      //   await new Promise(r => setTimeout(r, wait))
      // }
      let lastact = ''
      for (let [idx, { act, wait }] of this.sequence.entries()) {
        if (act !== 'start' && act !== 'pause' && lastact === 'pause') {
          console.info('break')
          break
        }
        lastact = act
        wait = wait || 100
        let [x, y] = this.act[act]
        this.sequenceCurrentIdx = idx
        clickPoint({ x, y }, this.mark.touchSocket, this.deviceStatus.orientation, 1, act)
        await new Promise(r => setTimeout(r, wait))
      }
    },
    viewScroll(e) {
      // console.info('view scroll', e.target.scrollTop)
      this.canvasBoundary.scrollTop = e.target.scrollTop
    },
    calcTouchParams() {
      this.$nextTick(function() {
        let targetEl = this.$el.querySelector('canvas.screen')
        let { width, height, left, top } = targetEl.getBoundingClientRect()
        this.canvasBoundary.width = width
        this.canvasBoundary.height = height
        this.canvasBoundary.left = left
        this.canvasBoundary.top = top
        console.info('new Boundary Data Settled')
        width = this.canvasBoundary.width || 1
        this.ratio = Math.floor(this.canvasWidth * 3 / Math.ceil(width) * 1000) / 1000
        console.info(`
        CANVAS EL: width - ${width}
        IMG width: ${this.canvasWidth}
        ratio: ${this.ratio}
      `)
      })
    },
    selectDevice(idx) {
      if (this.devices[idx]) {
        tagDevice(this.devices[idx])
        this.currentdevice = this.devices[idx] || this.devices[0]
      }
    },
    async checkProcess() {
      let { err, result } = await checkRunning()
      console.info({ err, result })
      if (!err)
        this.deviceStatus.PID_minicap = result
    },
    async startMinicap() {
      let result = await startMinicap({ orientation: this.deviceStatus.orientation })
      console.info({ result })
    },
    async startMiniTouch() {
      let result = await startMiniTouch()
      console.info({ result })
    },
    async monitorRotate() {
      let rotatorMonitorSocket = await getRotatorMonitor()
      rotatorMonitorSocket.on('readable', async () => {
        let chunk = rotatorMonitorSocket.read()
        if (!chunk) return
        this.deviceStatus.orientation = /\d+/.exec(chunk.toString())[0]
        console.info('[  set status.orientation to ', this.deviceStatus.orientation)
        await this.stopStream()
        await this.startMinicap()
        await this.gotStream()
      })
      rotatorMonitorSocket.on('close', () => {
        console.info('[ rotatorMonitorSocket closed] ')
      })
    },

    async stopTouchServ() {
      this.mark.touchSocket && this.mark.touchSocket.end()
    },

    async getTouchServ() {
      // let vm = this
      if (!this.mark.touchSocket) {
        this.mark.touchSocket = (await getTouchSocket({ mark: this.mark }))
      }
    },
    async gotStream() {
      this.mark.theend = false
      let vm = this
      let cb = function(err, frameBody) {
        // console.info('here is a frameBody. ')
        // console.info({ vm, frameBody })
        vm.screendata = frameBody
      }
      if (!this.mark.stream) {
        this.mark.stream = (await liveStream({ device: this.currentdevice, mark: this.mark, cb }))
      }
    },
    async stopStream() {
      this.mark.theend = true
      this.mark.stream && this.mark.stream.end()
    },
    mouseAct(e) {
      // console.info(e, this.canvasBoundary)
      // return
      let ox = Math.round(e.x - this.canvasBoundary.left)
      let oy = Math.round(e.y - this.canvasBoundary.top + this.canvasBoundary.scrollTop)
      this.cursorData.cursor = { x: ox, y: oy }
      let [x, y] = [ox, oy].map(n => Math.floor(this.ratio * n))
      // 转换点击坐标值
      switch (this.deviceStatus.orientation) {
        case '270':
          ;[x, y] = [y, 1920 - x]
          break
        case '90':
          ;[x, y] = [1080 - y, x]
          break
        case '180':
          ;[x, y] = [1080 - x, 1920 - y]
          break
      }
      let hit = []
      switch (e.type) {
        case 'mousemove':
          if (this.mark.pressing) {
            if (this.mark.touchSocket && !this.configure.markMode) {
              this.mark.touchSocket.write(`m 0 ${x} ${y} 50\n`)
              this.mark.touchSocket.write(`c\n`)
            }
          }
          break
        case 'mousedown':
          // console.info(this.mark)
          if (this.mark.touchSocket && !this.configure.markMode) {
            this.mark.touchSocket.write(`r\n`)
            this.mark.touchSocket.write(`d 0 ${x} ${y} 50\n`)
            this.mark.touchSocket.write(`c\n`)
          }
          this.cursorData.points.clickin = { x: ox, y: oy }
          this.cursorData.points.clickout = null
          this.mark.pressing = true
          break
        case 'mouseup':
          this.cursorData.points.clickout = { x: ox, y: oy }
          if (this.mark.touchSocket && !this.configure.markMode) {
            this.mark.touchSocket.write(`u\n`)
            this.mark.touchSocket.write(`c\n`)
          }
          // this.$Message.info(`mouseup @ ${x} ${y}`)
          break
      }
    }
  }
}
</script>
