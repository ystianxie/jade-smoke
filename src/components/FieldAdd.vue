<template>
  <div class="container" style="display: flex; justify-content: center;">
    <div style="display: flex; align-items: center;">
      <div style="position: relative;">
        <div id="excel_select" ref="excelBox">
          <div style="display: flex; ">
            <label style="margin-top: 5px;">主表：</label>
            <el-upload drag ref="upload_master" action="#" :on-change="onMasterTableChange" :limit="1"
                       :on-exceed="handleExceed" :auto-upload="false" :before-remove="onMasterTableRemove"
                       :accept="'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'">

              <template #trigger>
                <el-icon class="el-icon--upload" style="width: 40px;height: 40px;">
                  <upload-filled/>
                </el-icon>

              </template>


              <el-button type="primary" style="width: 120px; margin-top: 10px;" @click="masterDialogFormVisible = true">
                匹配键
              </el-button>
              <el-button type="info" style="width: 120px; margin-top: 10px;" @click="buildDialogFormVisible = true">
                输出键
              </el-button>


              <el-dialog v-model="buildDialogFormVisible" title="选择要输出的键">
                <div>
                  <label>输出字段选择</label>
                  <el-checkbox-group v-model="masterValues.export_headers">
                    <el-checkbox-button style="padding: 2px;"
                                        v-for="(header, index) in masterValues.excel_headers.filter(ele => ele)"
                                        :key="index"
                                        :label="header" :checked="true"/>
                  </el-checkbox-group>
                </div>

                <template #footer>
                  <span class="dialog-footer">
                    <el-button type="primary" @click="buildDialogFormVisible = false">
                      确定
                    </el-button>
                  </span>
                </template>
              </el-dialog>

              <el-dialog v-model="masterDialogFormVisible" title="选择用于数据匹配的键">
                <el-form :model="masterValues">
                  <el-form-item label="主表键" label-width="140px">
                    <el-select v-model="masterValues.onlyKey" placeholder="匹配键">
                      <el-option v-for="(header, index) in masterValues.excel_headers.filter(ele => ele)" :key="index"
                                 :label="header" :value="header"/>
                    </el-select>
                  </el-form-item>
                </el-form>
                <template #footer>
                  <span class="dialog-footer">
                    <el-button type="primary" @click="masterDialogFormVisible = false">
                      确定
                    </el-button>
                  </span>
                </template>
              </el-dialog>
            </el-upload>
          </div>

          <div style="display: flex;  margin: 10px 20px 0 0px;">
            <label style="margin-top: 5px;">副表：</label>
            <el-upload drag v-model:file-list="slaveFiles" ref="upload_slave" class="upload-demo" action="#"
                       :on-change="onSlaveTableChange" :auto-upload="false" :before-remove="onSlaveTableRemove"
                       :accept="'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'">
              <template #trigger>
                <div>
                  <!-- <el-button style="margin-top: 2px;" class="ml-3" type="success">上传</el-button> -->
                  <el-icon class="el-icon--upload" style="width: 40px;height: 40px;">
                    <upload-filled/>
                  </el-icon>

                </div>
              </template>
              <el-button type="primary" style="width: 120px; margin-top: 10px;"
                         @click="slaveMatchDialogFormVisible = true">
                匹配键
              </el-button>
              <el-button type="info" style="width: 120px; margin-top: 10px;" @click="slaveDialogFormVisible = true">
                追加键
              </el-button>

              <el-dialog v-model="slaveMatchDialogFormVisible" title="选择用于数据匹配的键">
                <el-form :model="slaveValues">

                  <el-form-item v-for="(slave_table, file) in slaveValues.excel_headers" :key="file"
                                :label="getFileName(file)" label-width="200px">
                    <el-select v-model="slaveValues.onlyKeys[file]" placeholder="匹配键">
                      <el-option v-for="(header, index) in slave_table" :key="index" :label="header" :value="header"/>
                    </el-select>
                  </el-form-item>
                </el-form>
                <template #footer>
                  <span class="dialog-footer">
                    <el-button type="primary" @click="slaveMatchDialogFormVisible = false">
                      确定
                    </el-button>
                  </span>
                </template>
              </el-dialog>

              <el-dialog v-model="slaveDialogFormVisible" title="选择需要追加的键">
                <div style="margin-bottom: 15px; display: flex; flex-direction: row; align-items:center;">
                  <div style="margin-right: 50px">
                    <span>重复字段处理</span>
                    <el-slider v-model="duplicateFieldsValue" :marks="duplicateFieldsMarks" show-stops :min="1"
                               :max="3"/>
                  </div>
                  <div style="margin-right: 50px">
                    <span>重复内容处理</span>
                    <el-slider v-model="duplicateContentValue" :marks="duplicateContentMarks" show-stops :min="1"
                               :max="3"/>
                  </div>
                  <div>
                    <div style="padding-top: 5px">
                      <span style="padding-right: 10px;" @mouseover="setMergeSeparator('合并值分隔符')" @mouseout="setMergeSeparator('值分隔符...')">{{
                          mergeSeparatorTitle
                        }}</span>
                      <el-input v-model="mergeSeparator" style="width: 40px"/>
                    </div>
                    <div>
                      <span style="padding-right: 10px;" @mouseover="setStripSpaceTitle('忽略首尾空格')" @mouseout="setStripSpaceTitle('忽略空格...')">{{
                          stripSpaceTitle
                        }}</span>
                      <el-switch v-model="stripSpace"/>
                    </div>
                  </div>

                </div>
                <div v-for="(slave_table, index) in slaveValues.excel_headers" :key="index">
                  <label>副表：{{ index }}</label>
                  <el-checkbox-group v-model="slaveValues.export_headers[index]">
                    <el-checkbox-button style="padding: 2px;" v-for="(header, key) in slave_table" :key="key"
                                        :label="header"/>
                  </el-checkbox-group>
                </div>

                <template #footer>
                  <span class="dialog-footer">
                    <el-button type="primary" @click="slaveDialogFormVisible = false">
                      确定
                    </el-button>
                  </span>
                </template>
              </el-dialog>
            </el-upload>

          </div>
        </div>
        <div style="margin-left: 50px; right: 20px;">
          <el-button type="success" style="width: 250px; margin-top: 15px;" @click="build">生成</el-button>
          <el-progress v-show="buildInfo.buildShow" style="width: 280px;" :percentage="buildInfo.buildProgress"
                       :status="buildInfo.buildStatus"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>


import {genFileId} from 'element-plus';
import {reactive} from 'vue';

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export default {
  data() {
    return {
      mergeSeparatorTitle:"值分隔符...",
      stripSpaceTitle:"忽略空格...",
      masterFile: null,
      slaveFiles: [],
      masterDialogFormVisible: false,
      slaveDialogFormVisible: false,
      slaveMatchDialogFormVisible: false,
      buildDialogFormVisible: false,
      masterValues: reactive({
        onlyKey: '',
        excel_headers: [],
        export_headers: []
      }),
      slaveValues: reactive({
        onlyKeys: {},
        excel_headers: {},
        export_headers: {}
      }),
      buildInfo: {
        buildShow: false,
        buildStatus: "",
        buildProgress: 0
      },
      duplicateFieldsValue: 1,
      duplicateFieldsMarks: reactive({
        1: "填充",
        2: "覆盖",
        3: "新增"
      }),
      duplicateContentValue: 1,
      duplicateContentMarks: reactive({
        1: "最旧",
        2: "最新",
        3: "合并"
      }),
      mergeSeparator: ",",
      stripSpace: true
    };
  },
  methods: {
    setMergeSeparator(value){
      this.mergeSeparatorTitle = value
    },
    setStripSpaceTitle(value){
      this.stripSpaceTitle = value
    },
    getFileName(val) {
      val = val.replace(/\\/g, "/");
      return val.split('/')[val.split('/').length - 1]
    },

    onMasterTableChange(event) {
      window.ipcRenderer.send('check-window-focus');
      this.masterFile = event;
      console.log("已选择文件：" + this.masterFile.raw.path);
      if (this.masterFile) {
        this.masterValues.excel_headers = []
        this.masterValues.onlyKey = ""
        let res = {
          file_type: "master",
          file_path: this.masterFile.raw.path
        }
        window.ipcRenderer.send('parseExcelFileField', res)
        window.ipcRenderer.once("showExcelFileField", (event, file_info) => {
          console.log('接收到文件信息:', file_info)
          if (file_info.file_type === "master") {
            if (this.masterFile) {
              this.masterValues.excel_headers = file_info.headers
              this.masterValues.export_headers = []
              this.masterFile.status = "success"
              for (let i = 0; i < file_info.headers.length; i++) {
                this.masterValues.export_headers[i] = file_info.headers[i]
              }
            }
          }
        })
      }
    },
    onSlaveTableChange(event) {
      window.ipcRenderer.send('check-window-focus');
      console.log("已选择文件：" + event.raw.path);
      if (event) {
        let res = {
          file_type: "slave",
          file_path: event.raw.path
        }
        window.ipcRenderer.send('parseExcelFileField', res)
        window.ipcRenderer.once("showExcelFileField", (event, file_info) => {
          console.log('接收到文件信息:', file_info)
          if (file_info.file_type === "slave") {
            var result = this.slaveFiles.find(function (obj) {
              return obj.raw.path === file_info.file_path;
            });
            console.log(result);

            if (result) {
              this.slaveValues.excel_headers[file_info.file_path] = file_info.headers
              this.slaveValues.onlyKeys[file_info.file_path] = ""
              result.status = "success"
            }

          }
        })
      }
    },
    onMasterTableRemove() {
      this.masterValues.excel_headers = []
      this.masterValues.onlyKey = ""
      this.masterFile = null
    },
    onSlaveTableRemove(event) {
      var result = this.slaveFiles.find(function (obj) {
        return obj.raw.path === event.raw.path;
      });
      if (result) {
        console.log("删除", event.raw.path);
        delete this.slaveValues.onlyKeys[event.raw.path]
        delete this.slaveValues.excel_headers[event.raw.path]
        delete this.slaveValues.export_headers[event.raw.path]

        console.log(this.slaveValues);
      }
    },
    handleExceed(files) {
      console.log(this.$refs.upload_master);
      this.$refs.upload_master.clearFiles();
      const file = files[0];
      file.uid = genFileId();
      this.$refs.upload_master.handleStart(file);
    },
    closeWindow() {
      window.close()
    },
    showPopover() {
      this.$refs.popover.visible = true;
    },
    build() {
      if (!this.masterFile || !this.masterValues.onlyKey) {
        this.$message.error('主表未选择或匹配键为空！');
        return
      }
      if (isObjectEmpty(this.slaveFiles) || isObjectEmpty(this.slaveValues.export_headers)) {
        this.$message.error('副表未选择或追加键为空！');
        return
      }
      this.buildInfo.buildShow = true
      this.buildInfo.buildStatus = ""
      let progress = 0
      const intervalId = setInterval(() => {
        console.log(progress);
        if (progress >= 99) {
          clearInterval(intervalId);
          return;
        }
        progress += Math.floor(Math.random() * 7) + 1;
        if (progress >= 98) progress = 99
        this.buildInfo.buildProgress = progress;
      }, 500);


      this.$message.success("表格生成中，请稍等")
      let export_data = {
        "master": this.masterFile.raw.path,
        "command": "FieldAdd",
        "only_key": this.masterValues.onlyKey,
        "export_key": Array.from(this.masterValues.export_headers),
        "slave": Object.values(this.slaveFiles).map(slave => slave.raw.path),
        "slave_key": JSON.parse(JSON.stringify(this.slaveValues.onlyKeys)),
        "slave_add_key": JSON.parse(JSON.stringify(this.slaveValues.export_headers)),
        "duplicate_fields_operation": this.duplicateFieldsValue,
        "duplicate_content_operation": this.duplicateContentValue,
        "merge_separator": this.mergeSeparator,
        "strip_space": this.stripSpace,
      }
      console.log(export_data);
      window.ipcRenderer.send('buildData', export_data)
      window.ipcRenderer.once('buildResult', (event, arg) => {
        console.log('接收到消息:', arg)
        if (arg.msg === "操作成功") {
          this.$message.success('操作成功:' + arg.file_path);
          this.buildInfo.buildProgress = 100
          this.buildInfo.buildStatus = "success"
        } else {
          this.$message.error("操作失败：" + arg.msg)
          this.buildInfo.buildStatus = "exception"
        }
        clearInterval(intervalId);

      })
    }
  }
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

.el-form-item :deep(.el-form-item__label) {
  white-space: nowrap;
  /* 不换行 */
  overflow: hidden;
  /* 溢出隐藏 */
  text-overflow: ellipsis;
  /* 显示省略号 */
}

.el-tabs__content {
  height: 400px;
}

::v-deep .el-upload-dragger {
  padding: 0;
  height: 50px;
}

::v-deep .is-dragover {
  padding: 0 !important;
  height: 50px;
}


::v-deep .el-upload-list {
  width: 250px;
}

.hoverable-div:hover,
.hovered {
  /* 添加自定义样式 */
  display: block;
}
</style>
  
  