<template lang="pug">
  div Form
    Input(v-model="value" placeholder="请输入..." style="width: 300px")
    br
    input(type='file' @change='fileSelect')
    br
    h1 {{ value }}
    h2 {{ filePath }}
    br
    blockquote MDN参考链接：https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader
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
      console.group('fileType')
      console.log(file.type.match(/image\/*/) ? "is image" : 'is not image')
      console.groupEnd()
      let reader = new FileReader()
      reader.onload = (e) => {
        console.info('file loaded')
        let ab = e.target.result
        console.info(Buffer.from(ab))
      }
      reader.readAsArrayBuffer(file)

    },
    debug(...x) {
      console.info('params ', x)
    }
  }
}
</script>
