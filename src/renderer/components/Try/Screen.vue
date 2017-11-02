<style>
.stage {
  box-sizing: border-box;
  padding: .5em
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
</style>

<template lang="pug">
  div
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
        Card(:bordered=false)
          pre.
            PDI_minicap: {{ deviceStatus.PID_minicap.join(',') }} 
            旋转： {{ deviceStatus.orientation }} 
</template>
<script>
import { tagDevice, listDevices, checkRunning, startMinicap, getRotatorMonitor, closeRotatorMonitor } from '@/util/adbkit.js'
import { liveStream } from '@/util/getStream.js'
import _ from 'lodash'

export default {
  name: 'screen',
  data() {
    return {
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
        x: 0, y: 0, width: 100, height: 100
      },
      flag: 'NONE',
      mode: 0,
      cursorData: {
        cursor: {
          x: 10, y: 10
        },
        markLayer: [
          [{ cross: [250, 250] }]
        ]
      }
    }
  },
  created() {
    this.mark = {
      lastTimeStamp: null,
      stream: null,
      touchSocket: null,
      theend: false
    }
    listDevices().then(devices => {
      this.devices = devices //.concat({ name: 'TEST' })
      console.info({ devices })
    })
  },
  async mounted() {
    await this.startMinicap()
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
      var ctx = el.getContext('2d')
      let { cursor } = binding.value
      ctx.clearRect(0, 0, el.width, el.height)
      ctx.beginPath()
      ctx.moveTo(0, cursor.y)
      ctx.lineTo(el.width, cursor.y)
      ctx.stroke();


      ctx.beginPath();
      ctx.moveTo(cursor.x, 0)
      ctx.lineTo(cursor.x, el.height)
      ctx.stroke();


      ctx.font = '20px Microsoft YaHei';
      ctx.fillStyle = '#000000';
      ctx.fillText(`${cursor.x},${cursor.y}`, cursor.x + (cursor.x + 100 < el.width ? 5 : -100), cursor.y + (cursor.y + 50 > el.height ? -15 : +35));
    }
  },

  watch: {
    canvasWidth: function(newValue, oldValue) {
      // console.info({ newValue, oldValue })
      this.calcTouchParams()
    }
  },
  methods: {

    calcTouchParams() {
      this.$nextTick(function() {
        let targetEl = this.$el.querySelector('canvas.screen')
        this.canvasBoundary = targetEl.getBoundingClientRect()
        console.info('new Boundary Data Settled')
        let width = this.canvasBoundary.width || 1
        this.ratio = this.canvasWidth * 3 / Math.ceil(width)
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
    async gotStream() {
      this.mark.theend = false
      let vm = this
      let cb = function(err, frameBody) {
        // console.info('here is a frameBody. ')
        // console.info({ vm, frameBody })
        vm.screendata = frameBody
      }
      this.mark.stream = (await liveStream({ device: this.currentdevice, mark: this.mark, cb }))
    },
    async stopStream() {
      this.mark.theend = true
      this.mark.stream && this.mark.stream.end()
    },
    mouseAct(e) {
      // console.info(e, this.canvasBoundary)
      // return
      let x = Math.round(e.x - this.canvasBoundary.left)
      let y = Math.round(e.y - this.canvasBoundary.top)
      this.cursorData.cursor = { x, y }
      x = this.ratio * x
      y = this.ratio * y
      let hit = []
      switch (e.type) {
        case 'mousemove':
          hit[0] = {
            type: 'touch',
            data: {
              act: 'm',
              x,
              y
            }
          }
          break
        case 'mousedown':
          hit[0] = {
            type: 'touch',
            data: {
              act: 'r'
            }
          }
          hit[1] = {
            type: 'touch',
            data: {
              act: 'd',
              x,
              y
            }
          }
          break
        case 'mouseup':
          hit[0] = {
            type: 'touch',
            data: {
              act: 'u'
            }
          }
          this.$Message.info(`click @ ${x} ${y}`)
          break
      }
    }
  }
}
</script>
