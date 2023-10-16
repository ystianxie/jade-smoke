<template>
  <div>
    <router-view />
    <el-tabs tab-position="left" style="height: 400px" class="demo-tabs">
      <el-tab-pane label="文档合并">
        <MergeTables />
      </el-tab-pane>
      <el-tab-pane label="字段追加">
        <FieldAdd />
      </el-tab-pane>
      <el-tab-pane label="联合去重">
        <JointDeduplication />
      </el-tab-pane>
      <el-tab-pane label="设置">
        <div class="container" style="display: flex; justify-content: center;">
          <div style="display: flex; flex-direction: column;">
            <span style="color: red;">设置个鬼</span>
            <span>呼出快捷键：</span>
            <span>Mac: Option + F</span>
            <span>Win: Alt + Ctrl + F</span>

          </div>

        </div>

      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>



import FieldAdd from './FieldAdd.vue'
import JointDeduplication from './JointDeduplication.vue'
import MergeTables from './MergeTables.vue'
// import screenshotTranslation from './components/screenshotTranslation.vue'


export default {
  data() {
    return {

    };
  },
  components: {
    FieldAdd,
    JointDeduplication,
    MergeTables,
  //   // "screenshotTranslation": screenshotTranslation
  },
  methods: {

  },
  // mounted(){
  //   this.$electron.ipcRenderer.on('log', (event, arg) => {
  //     console.log('接收到日志:', arg)
  //   })

  // }
  // created() {
  //   this.$electron.ipcRenderer.on('log', (event, arg) => {
  //     console.log('接收到日志:', arg)
  //   })

  // },

};
// window.ipcRenderer = window.require('electron').ipcRenderer
</script>
<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.container {
  text-align: left;
  margin-top: 50px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.icon-close {
  display: block;
  width: 100%;
  height: 100%;
  background-size: cover;
}
</style>

