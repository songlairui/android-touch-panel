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
  padding: .5em
}

.jump {
  background: lightcoral
}

.color {
  background: lightblue
}

.current {
  border: thin solid green;
  /* color: green */
}
</style>

<template lang="pug">
  div.view
    Row(type='flex')
      Col.stage(style={flex:'1'})
        Row(type='flex')
          Col.step(v-for='(sect,idx) in sequence' :key='idx' :class="{current:idx === sequenceCurrentIdx,[sect.act]:true}")
            Select(v-model="sect.act" style="width:100px")
              Option(v-for="(v,k) in act" :value="k" :key="k") {{ k }}
            InputNumber(v-model="sect.wait" :max='20000' :min='2' :step='5')
          Col
            Button(type="primary" shape="circle" icon="plus-round" @click='addSect')
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
            //- Button(type="ghost" icon="ios-color-filter-outline" @click='tryClick') tryClick
            Button(type="ghost" icon="ios-color-filter-outline" @click='log') console.log sequenct
        
        Card(:bordered=false)
          pre.
            PDI_minicap: {{ deviceStatus.PID_minicap.join(',') }} 
            旋转： {{ deviceStatus.orientation }} 
    
</template>
<script>
import { tagDevice, listDevices, checkRunning, startMiniTouch, getRotatorMonitor, closeRotatorMonitor } from '@/util/adbkit.js'
import { getTouchSocket } from '@/util/getStream.js'
import _ from 'lodash'
import * as conf from '@/util/level1.json'
// console.info({ conf })



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
    addSect() {
      this.sequence.push({
        act: 'pause',
        wait: 10
      })
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
