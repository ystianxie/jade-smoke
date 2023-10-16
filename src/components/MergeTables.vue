<template>
    <div class="container" style="display: flex; justify-content: center;">
        <div style="display: flex; align-items: center;">
            <div style="position: relative;">
                <div id="excel_select" ref="excelBox">
                    <div style="display: flex; ">
                        <label style="margin-top: 5px;">表格：</label>
                        <el-upload drag ref="upload" v-model:file-list="Files" action="#" :on-change="onTableChange"
                            :auto-upload="false" :before-remove="onTableRemove"
                            :accept="'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'">
                            <template #trigger>
                                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                            </template>
                            <el-button type="info" style="width: 250px; margin-top: 10px;"
                                @click="buildDialogFormVisible = true">输出键</el-button>

                            <el-dialog v-model="buildDialogFormVisible" title="选择要输出的键">
                                <div v-for="(table, index) in TableValues.excel_headers" :key="index">
                                    <label>表：{{ index }}</label>
                                    <el-checkbox-group v-model="TableValues.export_headers[index]">
                                        <el-checkbox-button style="padding: 2px;" v-for="(header, key) in table" :key="key"
                                            :label="header" :checked="true" />
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


import { reactive } from 'vue';

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

export default {
    data() {
        return {
            Files: [],
            buildDialogFormVisible: false,
            TableValues: reactive({
                excel_headers: {},
                all_headers: [],
                export_headers: {}
            }),
            buildInfo: {
                buildShow: false,
                buildStatus: "",
                buildProgress: 0
            }

        };
    },
    methods: {
        onTableChange(event) {
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
                        var result = this.Files.find(function (obj) {
                            return obj.raw.path === file_info.file_path;
                        });
                        console.log(result);

                        if (result) {
                            this.TableValues.excel_headers[file_info.file_path] = file_info.headers
                            this.TableValues.export_headers[file_info.file_path] = []
                            result.status = "success"
                            for (let i = 0; i < file_info.headers.length; i++) {
                                this.TableValues.export_headers[file_info.file_path][i] = file_info.headers[i]
                            }
                        }

                    }
                })
            }
        },
        onTableRemove(event) {
            var result = this.Files.find(function (obj) {
                return obj.raw.path === event.raw.path;
            });
            if (result) {
                console.log("删除", event.raw.path);
                delete this.TableValues.excel_headers[event.raw.path]
                delete this.TableValues.export_headers[event.raw.path]

                console.log(this.TableValues);
            }
        },
        closeWindow() {
            window.close()
        },
        showPopover() {
            this.$refs.popover.visible = true;
        },
        build() {
            if (isObjectEmpty(this.Files) || this.Files.length < 2) {
                this.$message.error('未选择表格或者数量不足');
                return
            }
            this.$message.success("表格生成中，请稍等")
            this.buildInfo.buildShow = true
            this.buildInfo.buildStatus = ""
            let export_data = {
                "tables": Object.values(this.Files).map(slave => slave.raw.path),
                "command": "MergeTables",
                "export_key": JSON.parse(JSON.stringify(this.TableValues.export_headers))
            }
            console.log(export_data);
            window.ipcRenderer.send('buildData', export_data)
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
    width: 250px;
    height: 80px;
}

::v-deep .is-dragover {
  padding: 0 !important;
  height: 80px;
}

</style>
    
    