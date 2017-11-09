<template lang="pug">
div
  Row(type='flex')
    Col(:span='12')
      Input(type="textarea" v-model='raw' :autosize="{minRows: 2,maxRows: 15}")
    Col(:span='12')
      Input(type="textarea" v-model='raw2' :autosize="{minRows: 2,maxRows: 15}")
  Row(type='flex')
    Col(:span='12')
      i-table(:columns='column' :data='data')
    Col(:span='12')
      i-table(:columns='column2' :data='data2')
</template>
<script>
export default {
  name: 'decode-event',
  data() {
    return {
      result: '',
      raw: `/dev/input/event1: 0003 0039 0000ca58
/dev/input/event1: 0001 014a 00000001
/dev/input/event1: 0001 0145 00000001
/dev/input/event1: 0003 0035 000002d3
/dev/input/event1: 0003 0036 0000050a
/dev/input/event1: 0003 0030 00000004
/dev/input/event1: 0003 0031 00000003
/dev/input/event1: 0000 0000 00000000
/dev/input/event1: 0003 0030 00000005
/dev/input/event1: 0003 0031 00000005
/dev/input/event1: 0000 0000 00000000
/dev/input/event1: 0003 0039 ffffffff
/dev/input/event1: 0001 014a 00000000
/dev/input/event1: 0001 0145 00000000
/dev/input/event1: 0000 0000 00000000
下面是 使用 工具 点的
/dev/input/event1: 0003 0039 00000001
/dev/input/event1: 0001 014a 00000001
/dev/input/event1: 0003 0030 00000006
/dev/input/event1: 0003 0035 000002d6
/dev/input/event1: 0003 0036 00000558
/dev/input/event1: 0000 0000 00000000
/dev/input/event1: 0003 0039 ffffffff
/dev/input/event1: 0001 014a 00000000
/dev/input/event1: 0000 0000 00000000`,
      raw2: `/dev/input/event1: EV_ABS       ABS_MT_TRACKING_ID   0000ca58
/dev/input/event1: EV_KEY       BTN_TOUCH            DOWN
/dev/input/event1: EV_KEY       BTN_TOOL_FINGER      DOWN
/dev/input/event1: EV_ABS       ABS_MT_POSITION_X    000002d3
/dev/input/event1: EV_ABS       ABS_MT_POSITION_Y    0000050a
/dev/input/event1: EV_ABS       ABS_MT_TOUCH_MAJOR   00000004
/dev/input/event1: EV_ABS       ABS_MT_TOUCH_MINOR   00000003
/dev/input/event1: EV_SYN       SYN_REPORT           00000000
/dev/input/event1: EV_ABS       ABS_MT_TOUCH_MAJOR   00000005
/dev/input/event1: EV_ABS       ABS_MT_TOUCH_MINOR   00000005
/dev/input/event1: EV_SYN       SYN_REPORT           00000000
/dev/input/event1: EV_ABS       ABS_MT_TRACKING_ID   ffffffff
/dev/input/event1: EV_KEY       BTN_TOUCH            UP
/dev/input/event1: EV_KEY       BTN_TOOL_FINGER      UP
/dev/input/event1: EV_SYN       SYN_REPORT           00000000
下面是 使用 工具 点的
/dev/input/event1: EV_ABS       ABS_MT_TRACKING_ID   00000001
/dev/input/event1: EV_KEY       BTN_TOUCH            DOWN
/dev/input/event1: EV_ABS       ABS_MT_TOUCH_MAJOR   00000006
/dev/input/event1: EV_ABS       ABS_MT_POSITION_X    000002d6
/dev/input/event1: EV_ABS       ABS_MT_POSITION_Y    00000558
/dev/input/event1: EV_SYN       SYN_REPORT           00000000
/dev/input/event1: EV_ABS       ABS_MT_TRACKING_ID   ffffffff
/dev/input/event1: EV_KEY       BTN_TOUCH            UP
/dev/input/event1: EV_SYN       SYN_REPORT           00000000`
    }
  },
  computed: {
    decoded() {
      return this.raw
    },
    column() {
      let line = this.raw.split('\n')[0]
      return line.split(/\s+/).map((v, key) => ({ title: `Col-${key}`, key }))
    },
    data() {
      return this.raw.split('\n').map(line => {
        return line.split(/\s+/)
      })
    },
    column2() {
      let line = this.raw2.split('\n')[0]
      return line.split(/\s+/).map((v, key) => ({ title: `Col-${key}`, key }))
    },
    data2() {
      return this.raw2.split('\n').map(line => {
        return line.split(/\s+/)
      })
    }
  }
}
</script>
