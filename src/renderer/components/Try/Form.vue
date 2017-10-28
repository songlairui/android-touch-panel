<template lang="pug">
  div Form
    Input(v-model="value" placeholder="请输入..." style="width: 300px")
    br
    input(type='file' @change='fileSelect')
    br
    h1 {{ value }}
    h2 {{ filePath }}
</template>
<script>
export default {
  data() {
    return {
      value: '',
      filePath: ''
    }
  },
  methods: {
    fileSelect(e) {
      let file = (e.target.files || e.dataTransfer.files)[0]
      console.info({ file })
      this.filePath = file && file['path']
    },
    debug(...x) {
      console.info('params ', x)
    }
  }
}
</script>
