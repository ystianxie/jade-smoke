<template>
  <div class="container" style="display: flex; justify-content: center;">
    <div style="display: flex; align-items: center;">
      <div style="position: relative;">
        <div id="excel_select" ref="excelBox">
          <div style="display: flex; ">
            <label style="margin-top: 5px;">表格：</label>
            <el-upload drag ref="upload_master" action="#" :on-change="onMasterTableChange" :limit="1"
              :on-exceed="handleExceed" :auto-upload="false" :before-remove="onMasterTableRemove"
              :accept="'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'">
              <template #trigger>
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              </template>
              <el-button type="primary" style="width: 120px; margin-top: 10px;" @click="masterDialogFormVisible = true">
                去重键
              </el-button>
              <el-button type="info" style="width: 120px; margin-top: 10px;"
                @click="buildDialogFormVisible = true">输出键</el-button>

              <el-dialog v-model="buildDialogFormVisible" title="选择要输出的键">
                <div>
                  <label>输出字段选择</label>
                  <el-checkbox-group v-model="masterValues.export_headers">
                    <el-checkbox-button style="padding: 2px;"
                      v-for="(header, index) in masterValues.excel_headers.filter(ele => ele)" :key="index"
                      :label="header.value" :checked="true" />
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

              <el-dialog v-model="masterDialogFormVisible" title="选择用于数据去重的键">
                <div style="display: flex;justify-content: center;align-items: center;">
                  <el-switch v-model="masterValues.hold" active-text="保留最新" inactive-text="保留最旧"></el-switch>
                </div>

                <el-form :model="masterValues">
                  <el-form-item label="表格键" label-width="140px">
                    <el-select-v2 v-model="masterValues.onlyKeys" filterable :options="masterValues.excel_headers"
                      placeholder="请选择" style="width: 240px" multiple />
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

        </div>
        <div style="margin-left: 50px; right: 20px;">
          <el-button type="success" style="width: 250px; margin-top: 15px;" @click="build">生成</el-button>
          <el-progress v-show="buildInfo.buildShow" style="width: 280px;" :percentage="buildInfo.buildProgress"
            :status="buildInfo.buildStatus" />
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>


import { genFileId } from 'element-plus';
import { reactive } from 'vue';

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export default {
  data() {
    return {
      masterFile: null,
      masterDialogFormVisible: false,
      buildDialogFormVisible: false,
      masterValues: reactive({
        onlyKeys: {},
        hold: false,
        excel_headers: [],
        export_headers: []
      }),
      buildInfo: {
        buildShow: false,
        buildStatus: "",
        buildProgress: 0
      }
    };
  },
  methods: {
    onDrop(event) {
      event.preventDefault();
      // const files = Array.from(event.dataTransfer.files).map((file) => file.path);
      // 处理拖拽过来的文件
      console.log(Array.from(event.dataTransfer.files));
    },
    onMasterTableChange(event) {
      window.ipcRenderer.send('check-window-focus');
      this.masterFile = event;
      console.log("已选择文件：" + this.masterFile.raw.path);
      if (this.masterFile) {
        this.masterValues.excel_headers = []
        this.masterValues.onlyKeys = {}
        let res = {
          file_type: "master",
          file_path: this.masterFile.raw.path
        }
        window.ipcRenderer.send('parseExcelFileField', res)
        window.ipcRenderer.once("showExcelFileField", (event, file_info) => {
          console.log('接收到文件信息:', file_info)
          if (file_info.file_type === "master") {
            if (this.masterFile) {
              this.masterValues.export_headers = []
              this.masterFile.status = "success"
              for (let i = 0; i < file_info.headers.length; i++) {
                this.masterValues.export_headers[i] = file_info.headers[i]
                this.masterValues.excel_headers.push({ "label": file_info.headers[i], "value": file_info.headers[i] })

              }
            }
          }
        })
      }
    },
    onMasterTableRemove() {
      this.masterValues.excel_headers = []
      this.masterValues.onlyKeys = {}
      this.masterFile = null
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
      console.log(this.masterValues.hold ? "First" : "Finally");
      if (!this.masterFile || isObjectEmpty(this.masterValues.onlyKeys)) {
        this.$message.error('表格未选择或去重键为空！');
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
        progress += Math.floor(Math.random() * 10) + 1;
        if (progress >= 98) progress = 99
        this.buildInfo.buildProgress = progress;
      }, 500);

      this.$message.success("表格生成中，请稍等")
      let export_data = {
        "master": this.masterFile.raw.path,
        "command": "JointDeduplication",
        "hold": this.masterValues.hold ? "First" : "Finally",
        "only_keys": Array.from(this.masterValues.onlyKeys),
        "export_key": Array.from(this.masterValues.export_headers)
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

::v-deep .el-upload-dragger {
  padding: 0;
  /* width: 80px; */
  height: 80px;
}
::v-deep .is-dragover {
  padding: 0 !important;
  height: 80px;
}


::v-deep .el-upload-list {
  width: 250px;
}
</style>
  
  