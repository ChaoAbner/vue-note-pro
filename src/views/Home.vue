<template>
    <el-container>
        <!-- 头部 -->
        <el-header>
            <el-row>
                <el-col :span="3">
                    <div class="grid-content bg-purple"
                         style="border: 1px #e8e8e8 solid; border-radius: 50px; padding: 10px 0;cursor: pointer;"
                         type="text" @click="newNote">
                       <i class="el-icon-circle-plus"></i> 新建笔记
                    </div>
                </el-col>

                <el-col :span="10">
                    <div class="grid-content bg-purple-light">
                        在线状态:
                        <el-button @click="changeStatus" v-if="isOnline" type="success">在线</el-button>
                        <el-button @click="changeStatus" v-else type="danger">离线</el-button>
                        <el-button @click="deleteNote" v-if="noteData.length !== 0" type="warning">删除当前笔记</el-button>
                        <el-button type="text" @click="openDeleteNotes">垃圾箱</el-button>
                    </div>
                </el-col>
<!--                :auto-upload="false"-->

                <el-col :span="3">
                    <div class="grid-content bg-purple-light" v-if="noteData.length !== 0">
                        <el-upload
                                class="upload-demo"
                                :action="aaa"
                                :auto-upload="false"
                                :on-preview="handlePreview"
                                :on-remove="handleRemove"
                                :headers="uploadHeaders"
                                :limit="1"
                                :before-upload="beforeUpload"
                                :on-change="onChange"
                                :file-list="fileList">
                            <el-button style="margin-right: 1em" slot="trigger" size="small">选取</el-button>
                            <el-button @click="uploadFile" size="small" type="primary">上传</el-button>
                        </el-upload>
                    </div>
                </el-col>

                <el-col :span="8">
                    <div v-model="username" class="grid-content bg-purple-light" style="color: #409EFF">
                        {{user.username}}
                        <el-button v-on:click="logout" style="margin-left: 50px;" type="danger" round>退出登录</el-button>
                    </div>
                </el-col>
            </el-row>
        </el-header>

        <!-- 内容 -->
        <el-container>
            <!--侧边栏-->
            <el-aside width="200px">
                <el-menu
                        default-active="0"
                        class="el-menu-vertical-demo"
                        @open="handleOpen"
                        @close="handleClose">
<!--                        default-openeds="1">-->
<!--                    <el-scrollbar>-->

                    <el-submenu index="1">
                        <template slot="title">
                            <i class="el-icon-notebook-1"></i>
                            <span>我的笔记</span>
                        </template>
                            <el-menu-item-group>
                                <!--  笔记存储  -->
                                <el-menu-item @click="showDetail(item, i)"
                                              v-for="(item, i) in noteData" :index="i" >
                                    {{item.title}}
                                </el-menu-item>
                            </el-menu-item-group>
                    </el-submenu>
<!--                    </el-scrollbar>-->
                </el-menu>
            </el-aside>
            <!-- 笔记编辑区-->
<!--            v-model="editor.info"-->
            <editor-bar :isClear="isClear" :value="editor.value" v-model="editor.value"
                        @change="change" ></editor-bar>
        </el-container>

    </el-container>
</template>

<style>

</style>


<script>
    import EditorBar from '@/components/EditorBar'

    let token = localStorage.getItem("token")

    export default {


        name: "Home",
        props: {
            shardSize: {
                default: 1 * 1024 * 1024
            }
        },
        data() {
            return {
                user: {
                    username: ''
                },
                isOnline: true,
                editor: {
                    value: ''
                },
                isClear: false,
                noteData: [],
                noteIndex: 0,
                deleteData: [],
                sync: false,
                start: 0,
                limit: 20,
                visible: false,
                domain: "http://127.0.0.1:8899/image/note/",
                uploadUrl: "",
                fileList: [],
                file: null,
                uploadHeaders: {
                    Authorization: token
                },
            }
        },

        methods: {

            submitUpload() {
                console.log("submit upload")
                console.log(this.file)
                let _this = this
                let formData = new FormData();
                formData.append("file", this.file)
                this.$axios.post(`image/note/${this.noteData[this.noteIndex].id}`, formData)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            _this.fileList.push(data.link)
                        }
                    })
            },

            onChange(file, fileList) {
                console.log("onchange")
                console.log(file)
                this.file = file
            },

            handleRemove(file, fileList) {
                console.log(file, fileList);
                this.file = file
            },

            handlePreview(file) {
                console.log(file);
                this.file = file
            },

            beforeUpload(file) {
                this.file = file
                console.log("before upload")
                console.log(file)
            },

            uploadFile() {
                let file = this.file.raw
                // console.log(`file size: ${file.size}, file type: ${file.type}, file name: ${file.name}`)
                let key = this.$md5(file.name, file.size, file.type)
                // console.log("md5:" + key)
                // md5转十进制
                let key10 = parseInt(key, 16);
                // console.log("key10：" + key10)
                // 十进制转62进制
                let key62 = this._10to62(key10);
                // console.log("key62: " + key62)

                // 文件分片
                let shardSize = this.shardSize      // 分片大小
                let shardIndex = 1      // 分片索引
                let size = file.size
                let shardTotal = Math.ceil(size / shardSize)    // 总片数
                let fileName = file.name
                let suffix = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length).toLowerCase();
                let param = {
                    shardIndex: shardIndex,
                    shardSize: shardSize,
                    shardTotal: shardTotal,
                    name: fileName,
                    suffix: suffix,
                    size: size,
                    md5Key: key62
                }
                // console.log(param)

                this.check(param)
            },

            _10to62: function (number) {
                let chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ';
                let radix = chars.length;
                let arr = [];
                do {
                    let mod = number % radix;
                    number = (number - mod) / radix;
                    arr.unshift(chars[mod]);
                } while (number);
                return arr.join('');
            },

            /**
             * 检查是否有过上传分片
             */
            check(param) {
                let _this = this
                this.$axios.get(`/image/shard/check?key=${param.md5Key}`).then(res => {
                    let data = res.data
                    if (data.code === 0) {
                        let obj = data.data
                        // console.log(obj)
                        if (!obj) {
                            // 分片从1开始上传
                            _this.upload(param)
                        } else if (obj.shardIndex === obj.shardTotal) {
                            // 秒传
                            console.log("秒传成功")
                            this.$message({
                                message: "秒传成功",
                                type: "success"
                            })
                        } else {
                            // 获取当前分片，设置当前分片，断点续传
                            param.shardIndex = obj.shardIndex + 1
                            console.log("找到分片记录，从第" + param.shardIndex + "个分片开始上传")
                            _this.upload(param)
                        }
                    }
                })
            },

            upload(param) {
                let _this = this;
                let shardIndex = param.shardIndex;
                let shardTotal = param.shardTotal;
                let shardSize = param.shardSize;
                let fileShard = _this.getFileShard(shardIndex, shardSize);
                // 将图片转为base64进行传输
                let fileReader = new FileReader();

                fileReader.onload = function (e) {
                    // console.log("base64:", base64);
                    param.shard = e.target.result;
                    let data = JSON.stringify(param)
                    _this.$axios.post(`/image/shard/note/${_this.noteData[_this.noteIndex].id}`, data).then((response) => {
                        let resp = response.data;
                        console.log(resp)
                        if (resp.code === 0) {
                            // 递归上传
                            if (shardIndex < shardTotal) {
                                param.shardIndex += 1
                                _this.upload(param)
                            }
                        } else {
                            _this.upload(param)
                        }
                    });
                };
                fileReader.readAsDataURL(fileShard);
            },

            getFileShard (shardIndex, shardSize) {
                let file = this.file.raw
                let start = (shardIndex - 1) * shardSize;	//当前分片起始位置
                let end = Math.min(file.size, start + shardSize); //当前分片结束位置
                 //从文件中截取当前的分片数据
                return file.slice(start, end);
            },

            reload() {
                location.reload()
            },

            success(msg) {
                this.$message({
                    message: msg,
                    type: 'success'
                });
            },

            openDeleteNotes() {
                this.$router.push("/del")
            },

            /**
             * 时间戳转格式化时间
             */
            timestampToFormatTime(tempStamp) {
                let date = new Date(tempStamp)
                let Y = date.getFullYear() + '-'
                let M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-'
                let D = date.getDate() + ' '
                let h = date.getHours() + ':'
                let m = date.getMinutes() + ':'
                let s = date.getSeconds();
                return Y + M + D + h + m + s
            },

            formatTimeToTimeStamp(formatTime) {
                let date = new Date(formatTime)
                return date.getTime()
            },

            /**
             * 改变编辑器内容
             */
            change(val) {
                 // 同步编辑器中的信息
                this.editor.value = val
                if (this.noteData.length === 0) {
                    return
                }
                let note = this.noteData[this.noteIndex]
                // 如果是在线状态并且没有在同步中，则更新到服务器
                if (this.isOnline && !this.sync && val !== note.content && note.id) {
                    console.log("同步 ==> 服务器")
                    this.sync = true
                    setTimeout(() => {
                        this.syncToServer(note.id, note.title, note.content)
                    }, 500)
                }
                // 离线状态
                if (!this.isOnline && val !== note.content) {
                    // 如果存在，则更新离线数据
                    let b = this.updateOfflineDataContent(note, val);
                    console.log(b)
                    if (!b) {
                        console.log("添加新的离线数据")
                        // 如果不存在，则添加新的离线数据
                        this.addOfflineData(note)
                    }
                }
                if (note.id) {
                    // 更新本地data的内容
                    note.content = this.editor.value
                    // 更新本地缓存，笔记内容
                    this.updateLocalNoteContent(note.id, note.content)
                }
            },

            /**
             * 改变状态
             */
            changeStatus() {
                this.isOnline = !this.isOnline;
                if (this.isOnline) {
                    localStorage.setItem("lastOnlineStatus", "1")
                    // 如果是离线变成在线，则检查需要同步的笔记
                    this.checkSync()
                } else {
                    localStorage.setItem("lastOnlineStatus", "0")
                }
            },


            /**
             * 对所有的笔记列表进行检查同步
             */
            checkSync() {
                const _this = this
                // 1、对当前的笔记进行更新
                let note = this.noteData[this.noteIndex]
                if (note.id) {
                    // 判断本地是否更新
                    let isNeedUpdate = _this.getIsNeedUpdate(note.id);
                    // console.log(isNeedUpdate)
                    if (isNeedUpdate)
                        this.syncToServer(note.id, note.title, note.content)
                }
                // 判断是否有离线的创建的笔记，进行同步
                this.pushOfflineData()
            },

            pushOfflineData(){
                let offlineData = this.getLocalInfo("offlineData");
                // 有离线的数据
                if (offlineData && offlineData.length !== 0) {
                    offlineData.forEach(item => {
                        if (item.id) {
                            // 判断数据中是否有id，有id说明已存在于数据库, 更新笔记到数据库
                            this.syncToServer(item.id, item.title, item.content)
                        } else {
                            // 无id，则是新建笔记
                            this.pushNoteToServer(item.title, item.content, item.updateTime, false)
                        }
                    })
                    // 清空离线数据
                    localStorage.setItem("offlineData", JSON.stringify([]))
                }
            },

            /**
             * 查看同步时间与修改时间的差别，判断是否需要更新
             */
            getIsNeedUpdate(noteId) {
                let key = "noteId_" + noteId
                let notesInfo = this.getLocalInfo("notesInfo")
                if (!notesInfo || !notesInfo[key]) return false
                let updateTime = notesInfo[key]['updateTime']
                let syncTime = notesInfo[key]['syncTime']
                if (!syncTime) return true
                return syncTime < updateTime
            },

            /**
             * 展示详情
             * @param item
             */
            showDetail(item, i) {
                this.noteIndex = i
                let note = this.noteData[i]
                if (note.id) {
                    this.uploadUrl = this.domain + note.id
                }
                if (this.getIsNeedUpdate(note.id) && this.isOnline && note.id) {
                    // 查看本地是否更新，更新则push笔记，然后修改syncTime
                    this.syncToServer(note.id, note.title, note.content)
                } else {
                    // 否则查看更新时间，不同则拉取数据
                    if (note.id)
                        this.checkUpdateTime(note.id, this.getUpdateTimeStamp(note.id), i)
                }
                // 更改显示内容
                this.editor.value = note.content
            },

            /**
             * 检查是否需要更新
             */
            checkUpdateTime(noteId, localUpdateTime, index) {
                const _this = this
                this.$axios.get(`sync/note/${noteId}/need?timestamp=${localUpdateTime}`)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            if (data.data.need) {
                                // 需要拉去最新内容
                                _this.pullNoteFromServer(noteId, index)
                            }
                        }
                    })
            },

            /**
             * 获取笔记的更新时间
             */
            getUpdateTimeStamp(noteId) {
                let key = "noteId_" + noteId
                let notesInfo = this.getLocalInfo("notesInfo")
                if (!notesInfo || !notesInfo[key]) return 1
                return notesInfo[key]['updateTime']
            },

            /**
             * 获取本地笔记信息
             */
            getLocalInfo(key) {
                let infos = localStorage.getItem(key);
                if (infos === undefined || !infos)
                    return null
                else
                    return JSON.parse(infos)
            },

            /**
             * 从服务器拉取最新的笔记
             */
            pullNoteFromServer(id, index) {
                const _this = this

                this.$axios.get(`/sync/note/${id}`)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            let note = data.data
                            _this.noteData[index] = note
                            _this.editor.value = note.content
                            // 更新本地内容
                            _this.updateLocalNoteContent(note.id, note.content)
                            // 更新本地更新时间和同步时间
                            _this.updateLocalNoteSyncTime(note.id)
                        }
                    })
            },

            /**
             * 同步笔记到服务器
             */
            syncToServer(noteId, title, content) {
                console.log("同步笔记")
                const _this = this
                let data = JSON.stringify({
                    id: noteId,
                    title: title,
                    content: content,
                    status: 1,
                })
                this.$axios.put(`sync/note?timestamp=${this.getUpdateTimeStamp(noteId)}`, data)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            // 更新同步时间
                            _this.updateLocalNoteSyncTime(noteId)
                            _this.sync = false
                        }
                    })
            },


            /**
             * 创建新的笔记
             */
            newNote() {
                let title = prompt("请输入笔记的标题",""); // 弹出input框
                if (title != null) {
                    if (title.length > 30) {
                        this.$message("标题长度不能超过30")
                        return
                    }
                    console.log("新建笔记")
                    if (this.isOnline) {
                        // 在线直接push
                        this.pushNoteToServer(title, "", new Date().getTime())
                    } else {
                        // 如果是离线创建的笔记，先保存到缓存，添加一个字段offlineCreate
                        // 等下次在线的时候遍历缓存，找出离线创建的笔记，统一进行push
                        let offlineData = this.addOfflineData({title: title, content: ""});
                        this.noteData.unshift(offlineData[offlineData.length - 1])
                        // 更改显示内容
                        this.editor.value = offlineData[offlineData.length - 1].content
                    }
                }
            },

            /**
             * push笔记到服务器
             */
            pushNoteToServer(title, content, updateTime, unshift = true) {
                let _this = this
                let data = JSON.stringify({
                    title: title,
                    content: content,
                })
                this.$axios.post(`note/?timestamp=${updateTime}`, data)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            let note = data.data
                            // 设置到第一位
                            if (unshift) {
                                _this.noteData.unshift(note)
                                _this.noteIndex = 0
                                // 显示当前笔记的详情
                                _this.showDetail(note, 0)
                            }
                            // 更新本地同步时间
                            _this.updateLocalNoteSyncTime(note.id)
                        }
                    })
            },

            /**
             * 删除笔记
             */
            deleteNote: function () {
                let note = this.noteData[this.noteIndex]
                let _this = this
                // 先判断是否只是离线数据，如果只是离线数据，则删除离线数据即可
                if (!note.id) {
                    let offlineData = this.getLocalInfo("offlineData");
                    if (offlineData) {
                        for (let i = 0; i < offlineData.length; i++) {
                            if (offlineData[i].updateTime === note.updateTime) {
                                // TODO 保存到垃圾箱
                                offlineData.splice(i, 1)
                                break
                            }
                        }
                        localStorage.setItem("offlineData", JSON.stringify(offlineData))
                        _this.success("删除成功")
                        setTimeout(() => {
                            _this.reload()
                        }, 1000)
                    }
                } else {
                    this.$axios.delete(`note/${note.id}?timestamp=${new Date().getTime()}`)
                        .then(res => {
                            let data = res.data
                            if (data.code === 0) {
                                // console.log(data)
                                _this.success("删除成功")
                                setTimeout(() => {
                                    _this.reload()
                                }, 1000)
                            }
                        })
                }
                this.visible = false
            },

            /**
             * 添加离线数据
             */
            addOfflineData(note) {
                let offlineData = this.getLocalInfo("offlineData");
                if (!offlineData) {
                    offlineData = []
                    offlineData = this.addLocalOfflineDataHelper(offlineData, note)
                } else {
                    offlineData = this.addLocalOfflineDataHelper(offlineData, note)
                }
                localStorage.setItem("offlineData", JSON.stringify(offlineData))
                return offlineData
            },

            addLocalOfflineDataHelper(offlineData, note) {
                if (note.id) {
                    offlineData.push({id: note.id, title: note.title, content: note.content,
                        updateTime: new Date().getTime()})
                } else {
                    offlineData.push({title: note.title, content: note.content, updateTime: new Date().getTime()})
                }
                return offlineData
            },

            /**
             * 更新离线内容
             */
            updateOfflineDataContent(item, content) {
                // console.log("需要更新的note:")
                // console.log(item)
                // console.log("更新的内容：" + content)
                let offlineData = this.getLocalInfo("offlineData");
                if (!offlineData || offlineData.length === 0) {
                    // console.log("创建新的离线数据")
                    offlineData = []
                    // push新的离线数据
                    item.updateTime = new Date().getTime()
                    offlineData.push(item)
                    localStorage.setItem("offlineData", JSON.stringify(offlineData))
                    return true
                } else {
                    // console.log("offlineData：")
                    // console.log(offlineData)
                    for (let i = 0; i < offlineData.length; i++) {
                        if (item.id) {
                            if (offlineData[i].id === item.id) {
                                offlineData[i] = item
                                offlineData[i].content = content
                                // this.noteData[this.noteIndex] = offlineData[i]
                                localStorage.setItem("offlineData", JSON.stringify(offlineData))
                                return true
                            }
                        } else {
                            if (offlineData[i].updateTime === item.updateTime) {
                                offlineData[i].content = content
                                offlineData[i].updateTime = new Date().getTime()
                                this.noteData[this.noteIndex] = offlineData[i]
                                localStorage.setItem("offlineData", JSON.stringify(offlineData))
                                return true
                            }
                        }
                    }
                }
                return false
            },

            /**
             * 更新同步时间
             */
            updateLocalNoteSyncTime(noteId) {
                let notesInfo = localStorage.getItem("notesInfo");
                let key = "noteId_" + noteId
                if (!notesInfo) {
                    notesInfo = {}
                    notesInfo[key] = {syncTime: new Date().getTime()}
                } else {
                    notesInfo = JSON.parse(notesInfo);
                    notesInfo[key]['syncTime'] = new Date().getTime()
                }
                localStorage.setItem("notesInfo", JSON.stringify(notesInfo))
            },

            /**
             * 更新本地笔记内容
             */
            updateLocalNoteContent(noteId, content) {
                // console.log("更新本地内容")
                // console.log("noteId: " + noteId + " content: " + content)
                let key = "noteId_" + noteId
                let notesInfo = localStorage.getItem("notesInfo");
                if (!notesInfo) {
                    notesInfo = {}
                    notesInfo[key] = {content: content, updateTime: new Date().getTime()}
                } else {
                    notesInfo = JSON.parse(notesInfo)
                    console.log(notesInfo)
                    if (!notesInfo[key]) {
                        notesInfo[key] = {content: content, updateTime: new Date().getTime()}
                    } else {
                        notesInfo[key]['content'] = content
                        notesInfo[key]['updateTime'] = new Date().getTime()
                    }
                }
                localStorage.setItem("notesInfo", JSON.stringify(notesInfo))
            },

            /**
             * 退出登录
             */
            logout() {
                this.$store.commit('REMOVE_INFO')
                window.location.reload()
            },

            /**
             * 初始化笔记列表
             */
            initNotes() {
                const _this = this
                // 拉取笔记
                this.$axios.get(`note/user?start=${this.start}&limit=${this.limit}`,)
                    .then(res => {
                    let data = res.data
                    if (data.code === 0 || data.code === 10001) {
                        // if (data.data.length !== 0) {
                            data.data.forEach(item => {
                                // 判断有无本地更新时间
                                let updateTimeStamp = _this.getUpdateTimeStamp(item.id)
                                if (updateTimeStamp !== 1) {
                                    item.updateTime = updateTimeStamp
                                } else {
                                    // 转换时间为时间戳
                                    item.updateTime = _this.formatTimeToTimeStamp(item.updateTime)
                                }

                                let content = _this.haveAndGetContent(item.id);
                                if (content) {
                                    // 如果有本地笔记，则使用本地笔记
                                    item.content = content
                                    console.log("使用本地")
                                }
                            })
                            // 获取离线数据
                            let offlineData = _this.getOfflineData();
                            offlineData.forEach(item => {
                                if (!item.id) {
                                    data.data.push(item)
                                }
                            })
                            // data.data = data.data.concat(offlineData)
                            // 根据更新时间来进行排序
                            data.data.sort(this.compare("updateTime"))
                            _this.noteData = data.data
                            if (_this.noteData.length !== 0) {
                                _this.editor.value = _this.noteData[0].content
                                if (_this.noteData[0].id) {
                                    _this.uploadUrl = _this.domain + _this.noteData[0].id
                                }
                            }
                        // }
                    }
                })
            },

            compare(property) {
                return function(a, b) {
                    let v1 = a[property]
                    let v2 = b[property]
                    return v2 - v1
                }
            },

            getOfflineData() {
                let offlineData = this.getLocalInfo("offlineData")
                if (!offlineData || offlineData.length === 0) {
                    return []
                }
                return offlineData
            },

            haveAndGetContent(noteId) {
                let key = "noteId_" + noteId
                let notesInfo = this.getLocalInfo("notesInfo")
                if (!notesInfo || !notesInfo[key] || !notesInfo[key]['content']) {
                    return false
                }
                return notesInfo[key]['content']
            },

            initLastOnlineStatus() {
                let lastOnlineStatus = localStorage.getItem("lastOnlineStatus");
                if (!lastOnlineStatus) {
                    this.isOnline = true
                    localStorage.setItem("lastOnlineStatus", '1')
                    return
                }
                this.isOnline = lastOnlineStatus === '1'
            }
        },

        components: {
            EditorBar
        },

        created() {
            // 判断是否已登录，登录状态不能回到login页面
            if (this.$store.getters.getUser) {
                this.user.username = this.$store.getters.getUser.username
            } else {
                this.$router.push("/login")
            }
            this.uploadHeaders = {
                Authorization: this.$store.getters.getToken
            }
            // 初始化笔记
            this.initNotes()
            this.initLastOnlineStatus()
        }
    }


</script>
