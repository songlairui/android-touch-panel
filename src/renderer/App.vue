<style scoped>
.layout {
  border: 1px solid #d7dde4;
  background: #f5f7f9;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
}

.layout>div {
  height: 100%;
}

.layout-breadcrumb {
  padding: 10px 15px 0;
}

.layout-content {
  min-height: 200px;
  margin: 15px;
  overflow: auto;
  background: #fff;
  border-radius: 4px;
  flex: 1
}

.layout-content-main {
  padding: 10px;
  height: 100%;
}

.layout-copy {
  text-align: center;
  padding: 10px 0 20px;
  color: #9ea7b4;
}

.layout-menu-left {
  background: #464c5b;
}

.layout-header {
  height: 60px;
  background: #fff;
  box-shadow: 0 1px 1px rgba(0, 0, 0, .1);
}

.layout-logo-left {
  width: 90%;
  /* height: 30px; */
  background: #5b6270;
  border-radius: 3px;
  margin: 15px auto;
}

.layout-ceiling-main a {
  color: #9ba7b5;
}

.layout-hide-text .layout-text {
  display: none;
}

.ivu-col {
  transition: width .2s ease-in-out;
}

.flexVcol {
  display: flex;
  flex-flow: column;
}
</style>
<template>
  <div class="layout" :class="{'layout-hide-text': spanLeft < 5}">
    <Row type="flex">
      <Col :span="spanLeft" class="layout-menu-left">
      <Menu active-name="1" theme="dark" width="auto" @on-select='menuClick'>
        <div class="layout-logo-left">
          <Button type="text" @click="toggleClick">
            <Icon type="navicon" size="32"></Icon>
          </Button>
        </div>
        <MenuItem name="canvas-try" :to="{name:'canvas-try'}">
        <Icon type="ios-navigate" :size="iconSize"></Icon>
        <span class="layout-text">canvas</span>
        </MenuItem>
        <MenuItem name="form-try">
        <Icon type="ios-analytics" :size="iconSize"></Icon>
        <span class="layout-text">Form</span>
        </MenuItem>
        <MenuItem name="opencv-try">
        <Icon type="ios-keypad" :size="iconSize"></Icon>
        <span class="layout-text">OpenCV</span>
        </MenuItem>
        <MenuItem name="screen-try">
        <Icon type="android-phone-landscape" :size="iconSize"></Icon>
        <span class="layout-text">Screen</span>
        </MenuItem>
        <MenuItem name="chameleon-run">
        <Icon type="code-working" :size="iconSize"></Icon>
        <span class="layout-text">ChameleonRun</span>
        </MenuItem>
        <MenuItem name="decode-event">
        <Icon type="code" :size="iconSize"></Icon>
        <span class="layout-text">ChameleonRun</span>
        </MenuItem>
      </Menu>
      </Col>
      <Col :span="spanRight" class='flexVcol'>
      <div class="layout-breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <!-- <BreadcrumbItem href="#">应用中心</BreadcrumbItem> -->
          <BreadcrumbItem>某应用</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div class="layout-content">
        <div class="layout-content-main">
          <router-view></router-view>
        </div>
      </div>
      <div class="layout-copy">
        2011-2016 &copy; TalkingData
      </div>
      </Col>
    </Row>
  </div>
</template>
<script>
export default {
  data() {
    return {
      spanLeft: 2,
      spanRight: 22
    }
  },
  computed: {
    iconSize() {
      return this.spanLeft === 5 ? 14 : 24
    }
  },
  methods: {
    toggleClick() {
      if (this.spanLeft === 5) {
        this.spanLeft = 2
        this.spanRight = 22
      } else {
        this.spanLeft = 5
        this.spanRight = 19
      }
    },
    menuClick(name) {
      this.$router.push({ name: name })
    }
  }
}
</script>
