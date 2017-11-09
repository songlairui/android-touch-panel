<style>
.stage {
  box-sizing: border-box;
  padding: .5em
}

.view {
  height: 100%;
  overflow: auto;
}

.coverage {
  position: absolute;
  top: .5em;
  left: .5em;
  z-index: 100;
  background: rgba(123, 223, 55, .1)
}

.step {
  padding: .5em;
  margin: 3px;
  border-radius: 3px;
  border: thin solid transparent;
}

.jump {
  background: lightgreen
}

.color {
  background: lightblue
}

.pause {
  background: lightslategray
}

.start {
  background: lightsalmon
}

.current {
  border: thin solid red;
  /* color: green */
}
</style>

<template lang="pug">
  div.view
    Row.view(type='flex')
      Col.view.stage(style={flex:'1'})
        Row(type='flex')
          Col.step(v-for='(sect,idx) in sequence' :key='idx' :class="{current:idx === sequenceCurrentIdx,[sect.act]:true}")
            //- RadioGroup(v-model="sect.act" style="width:150px")
            //-   Radio(v-for="(v,k) in act" :label="k" :key="k")
            Select(v-model="sect.act" style="width:100px")
              Option(v-for="(v,k) in act" :value="k" :key="k") {{ k }}
            br
            InputNumber(v-model="sect.duration" :max='20000' :min='0' size="small")
            Button(type="text" shape="circle" icon="close-round" size="small" @click='removeSect(idx)')
            br
            InputNumber(v-model="sect.wait" :max='20000' :min='1' :step='5' size="small")
            Button(type="primary" shape="circle" size="small" icon="plus-round" @click='addSect(idx)')
            //- br
            //- Input(v-model="sect.description" size="small"  style="width:100px")
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
                Button(type="ghost" icon="ios-crop" @click='monitorRotate') 监控Rotater
        Row
          ButtonGroup(vertical)
            Button(type="ghost" icon="ios-color-filter-outline" @click='setout') 执行序列
            Button(type="ghost" icon="ios-color-filter-outline" @click='crash') 停止序列
            i-switch(v-model="sequenceAct.tryStop")
            //- Button(type="ghost" icon="ios-color-filter-outline" @click='setout') 取消执行序列
            //- Button(type="ghost" icon="ios-color-filter-outline" @click='tryClick') tryClick
            Button(type="ghost" icon="ios-color-filter-outline" @click='log') console.log sequenct
        Row
          ButtonGroup()
            Button(type='primary' shape="circle" icon="pause" @click='actClick("pause")')
            Button(type='primary' shape="circle" icon="play" @click='actClick("start")')
            Button(type='primary' shape="circle" icon="ios-color-wand" @click='actClick("color")')
            Button(type='primary' shape="circle" icon="ios-redo" @click='actClick("jump")')
        Card(:bordered=false)
          pre.
            Pause: {{ sequenceAct.tryStop }} 
            旋转： {{ deviceStatus.orientation }} 
    
</template>
<script>
import { tagDevice, listDevices, checkRunning, startMiniTouch, getRotatorMonitor, closeRotatorMonitor } from '@/util/adbkit.js'
import { getTouchSocket } from '@/util/getStream.js'
import _ from 'lodash'
import { sequence } from '@/util/level1.js'
// console.info({ sequence })
async function clickPoint(point, socket, orientation = '90', ratio = 1, act, duration = 0) {
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
  let pointNum = 0
  switch (act) {
    case 'jump':
      pointNum = 1;
      break;
    case 'color':
      pointNum = 0;
      break;
    case 'color2':
      pointNum = 2;
      break;
    case 'start':
      pointNum = 3;
      break;
    case 'pause':
      pointNum = 4;
      socket.write(`r\n`)
      break;
  }
  if (duration) {
    await new Promise(resolve => setTimeout(resolve, +duration))
  }
  // socket.write(`r\n`)
  socket.write(`d ${pointNum} ${x} ${y} ${u ? '10' : '60'}\n`)
  socket.write(`c\n`)
  socket.write(`u ${pointNum}\n`)
  socket.write(`c\n`)
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
        jump: [1512, 528],
        ju: [1512, 528],
        mp: [1512, 528]
      },
      sequenceCurrentIdx: 0,
      sequence,
      sequenceAct: {
        tryStop: false
      }
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
    await this.startMiniTouch()
    await this.getTouchServ()
    await this.checkProcess()
    await this.monitorRotate()
  },
  async destroyed() {
    await closeRotatorMonitor()
    this.stopStream()
  },
  methods: {
    log() {
      console.info(this)
      let result = { sequence: this.sequence }
      console.info(result)
      console.info(JSON.stringify(result, '', 2))
    },
    addSect(idx) {
      idx = idx || this.sequence.length - 1
      this.sequence.splice(idx + 1, 0, {
        act: 'pause',
        wait: 10
      })
    },
    removeSect(idx) {
      if (idx) {
        this.sequence.splice(idx, 1)
      }
    },
    crash() {
      console.info({ r: this._tmpResolve })
      if (this._tmpResolve) {
        this.tryStop = true
        this._tmpResolve()
      } else {
        console.info('no resolve')
      }
    },
    async setout() {
      console.info('set out to do this sequenct')
      if (!this.mark.touchSocket) return this.$Message.error('no TouchSocket')
      // this.sequenceAct.tryStop = true
      // await new Promise(r => setTimeout(r, 500))
      // this.sequenceAct.tryStop = false
      let lastact = ''
      let vm = this
      for (let [idx, { act, wait, duration }] of this.sequence.entries()) {
        if (act !== 'start' && act !== 'pause' && lastact === 'pause') {
          console.info('break')
          break
        }
        if (this.sequenceAct.tryStop) {
          this.sequenceAct.tryStop = false
          break
        }
        if (lastact in ['color', 'color2'] && act == 'color') {
          act = 'color2'
        }
        lastact = act
        wait = wait || 100
        let [x, y] = this.act[act]
        this.sequenceCurrentIdx = idx
        clickPoint({ x, y }, this.mark.touchSocket, this.deviceStatus.orientation, 1, act, duration)
        await new Promise(r => {
          // console.info(vm)
          vm._tmpResolve = r
          setTimeout(r, wait)
        })
      }
    },
    actClick(act) {
      if (this.act[act]) {
        let [x, y] = this.act[act]
        clickPoint({ x, y }, this.mark.touchSocket, this.deviceStatus.orientation, 1, act)
      } else {
        this.$Message.warning("unvalid act")
      }
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
    }
  }
}
</script>
