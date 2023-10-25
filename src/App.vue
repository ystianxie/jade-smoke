<template>
  <div style="height: 40px;width: auto;-webkit-app-region: drag;"></div>
  <div>
    <router-view/>
    <el-tabs tab-position="left" style="height: 400px" class="demo-tabs" @tab-click="judgmentSystem">
      <el-tab-pane label="文档合并">
        <MergeTables/>
      </el-tab-pane>
      <el-tab-pane label="字段追加">
        <FieldAdd/>
      </el-tab-pane>
      <el-tab-pane label="联合去重">
        <JointDeduplication/>
      </el-tab-pane>
      <el-tab-pane label="设置" name="设置">
        <div class="container" style="display: flex; justify-content: center;">
          <div style="display: flex; flex-direction: column;">

            <div class="settingItems">
              <h3 style="margin-right: 20px;">自动隐藏: </h3>
              <div style="display: flex; align-items: center;">
                <el-switch v-model="winAutoHide" class="ml-2" @change="changeSettingAutoHide"
                           style="--el-switch-on-color: #13ce66; "/>
              </div>
            </div>

            <div class="settingItems">
              <h3 style="margin-right: 20px;">显示边框: </h3>
              <div style="display: flex; align-items: center;">
                <el-switch v-model="winShowFrame" class="ml-2" @change="changeSettingShowFrame"
                           style="--el-switch-on-color: #13ce66; " :disabled="winShowFrameDisabled"/>
              </div>
            </div>

            <div class="settingItems">
              <h3 style="margin-right: 20px;">呼出快捷键[{{ systemType }}]:</h3>
              <div style="display: flex; align-items: center;">
                <el-input v-model="showKeyValue" ref="showKey" placeholder="请输入" @keydown="handleShortcut"
                          @input="showKeyInput" @blur="confirmShowKey"></el-input>
              </div>
            </div>
          </div>

        </div>

      </el-tab-pane>
    </el-tabs>
  </div>
  <el-divider>
    <el-icon>
      <star-filled/>
    </el-icon>
  </el-divider>


  <div class="logFrame">
    <el-scrollbar max-height="150px" wrap-class="logFrame">
      <div v-for="log in logs" :key="log.id">
        <el-alert :title="log.info" :type="log.level" show-icon/>
      </div>

    </el-scrollbar>
  </div>
</template>

<script>


import FieldAdd from './components/FieldAdd.vue'
import JointDeduplication from './components/JointDeduplication.vue'
import MergeTables from './components/MergeTables.vue'

export default {
  data() {
    return {
      firstOpen: true,
      systemType: "Mac",
      showKeyValue: '',
      showKeyValueOld: null,
      shortcutKeysLegal: false,
      shortcutKeys: [''],
      logIndex: 1,
      logs: [],
      winAutoHide: true,
      winShowFrame: false,
      winShowFrameDisabled: false
    };
  },
  components: {
    FieldAdd,
    JointDeduplication,
    MergeTables,
  },
  methods: {
    judgmentSystem(tab) {
      if (tab.props.label === "设置" && this.firstOpen) {
        if (navigator.platform.indexOf('Win') === 0) {
          this.systemType = "Win"
        } else {
          this.systemType = "Mac"
        }
        this.firstOpen = false
        window.ipcRenderer.send("getSettingInfo", this.systemType)
        window.ipcRenderer.once("SettingInfo", (e, setting_info) => {
          console.log(setting_info)
          this.showKeyValue = setting_info.shortcutKeys
          this.showKeyValueOld = setting_info.shortcutKeys
          this.winAutoHide = setting_info.winAutoHide
          this.winShowFrame = setting_info.winShowFrame
        })
      }
    },
    handleShortcut(event) {
      console.log(event.keyCode);
      if (this.shortcutKeysLegal) {
        this.showKeyValueOld = this.showKeyValue;
      }
      this.showKeyValue = null
      this.shortcutKeys = []
      this.shortcutKeysLegal = false
      let macCommandError = false
      let shortcutKeysLegalTemp = false
      event.preventDefault();
      if (navigator.platform.indexOf('Win') === 0) {
        if (event.shiftKey) {
          this.shortcutKeys.push("Shift")
        }
        if (event.ctrlKey) {
          this.shortcutKeys.push("Ctrl")
        }
        if (event.altKey) {
          this.shortcutKeys.push("Alt")
        }
      } else {
        if (event.shiftKey) {
          this.shortcutKeys.push("⇧")
        }
        if (event.ctrlKey) {
          this.shortcutKeys.push("⌃")
        }
        if (event.altKey) {
          this.shortcutKeys.push("⌥")
        }
        if (event.metaKey) {
          this.shortcutKeys.push("⌘")
          if (event.keyCode === 91 || event.keyCode === 93) {
            macCommandError = true
          }
        }
      }
      if (this.shortcutKeys.length >= 1) shortcutKeysLegalTemp = true
      if (event.keyCode && !macCommandError && event.keyCode >= 32 && event.keyCode <= 126) {
        let keyCode = String.fromCharCode(event.keyCode)
        this.shortcutKeys.push(keyCode)
        if (shortcutKeysLegalTemp) this.shortcutKeysLegal = true
      }
      this.showKeyValue = this.shortcutKeys.join("+")
      console.log(this.shortcutKeys);
    },
    showKeyInput(value) {
      if (!this.shortcutKeys.includes(value)) {
        this.showKeyValue = "";
      }
    },
    confirmShowKey() {
      if (this.showKeyValue === this.showKeyValueOld) return
      if (!this.shortcutKeysLegal) {
        this.showKeyValue = this.showKeyValueOld
        return
      }
      window.ipcRenderer.send("saveShortcutKeys", {shortcutKeys: this.showKeyValue, platform: this.systemType})
    },
    changeSettingAutoHide() {
      window.ipcRenderer.send("changeSettingAutoHide", this.winAutoHide)
    },
    changeSettingShowFrame() {
      window.ipcRenderer.send("changeSettingShowFrame", this.winShowFrame)
    }

  },
  mounted() {
    if (window.navigator.platform.startsWith("Mac")) {
      this.winShowFrame = true;
      this.winShowFrameDisabled = true;
    }
  },
  created() {
    if (window.ipcRenderer) {
      window.ipcRenderer.on('log', (event, arg) => {
        console.log('接收到日志:', arg)
      })

      window.ipcRenderer.on("buildLog", (event, arg) => {
        this.logs.unshift({level: arg.level, info: arg.info, id: this.logIndex})
        this.logIndex += 1;
      })
    }

  },

}

if (require && !window.ipcRenderer) {
  window.ipcRenderer = window.require('electron').ipcRenderer
}

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
//margin-top: 60px;
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

body {
  /* overflow: hidden; */
  margin-top: 0;
}

.settingItems {
  display: flex;
  flex-direction: row;
}
</style>

