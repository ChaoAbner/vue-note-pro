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
                    </div>

                </el-col>

                <el-col :span="11">
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
    import Qs from 'qs'

    export default {
        name: "Home",
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
                sync: false,
                start: 0,
                limit: -1
            }
        },

        methods: {

            reload() {
                location.reload()
            },

            success(msg) {
                this.$message({
                    message: msg,
                    type: 'success'
                });
            },

            /**
             * 改变编辑器内容
             */
            change(val) {
                console.log("change")
                 // 同步编辑器中的信息
                this.editor.value = val
                let note = this.noteData[this.noteIndex]
                // 如果是在线状态并且没有在同步中，则更新到服务器
                if (this.isOnline && !this.sync && val !== note.content) {
                    console.log("同步 ==> 服务器")
                    this.sync = true
                    setTimeout(() => {
                        this.syncToServer(note.id, note.title, note.content)
                    }, 300)
                }
                if (val !== note.content) {
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
                // 如果是离线变成在线，则检查需要同步的笔记
                if (this.isOnline) {
                    this.checkSync()
                }
            },

            /**
             * 对所有的笔记列表进行检查同步
             */
            checkSync() {
                const _this = this
                // 1、对当前的笔记进行更新
                let note = this.noteData[this.noteIndex]
                // 判断本地是否更新
                let isNeedUpdate = _this.getIsNeedUpdate(note.id);
                console.log(isNeedUpdate)
                if (isNeedUpdate)
                    this.syncToServer(note.id, note.title, note.content)
            },

            getIsNeedUpdate(noteId) {
                let key = "noteId_" + noteId
                let notesInfo = this.getNotesInfo()
                if (!notesInfo || !notesInfo[key]) return false
                return notesInfo[key]['update']
            },

            /**
             * 展示详情
             * @param item
             */
            showDetail(item, i) {
                this.noteIndex = i
                let note = this.noteData[i]
                if (this.getIsNeedUpdate(note.id) && this.isOnline) {
                    // 查看本地是否更新，更新则push笔记，然后修改update
                    this.syncToServer(note.id, note.title, note.content)
                } else {
                    // 否则查看版本，不同则拉取数据
                    this.checkVersion(note.id, this.getVersion(note.id), i)
                }
                // 更改显示内容
                this.editor.value = note.content
            },

            /**
             * 检查版本
             */
            checkVersion(noteId, version, index) {
                const _this = this
                this.$axios.get(`sync/${version}/note/${noteId}`)
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
             * 获取本地的版本
             */
            getVersion(noteId) {
                let key = "noteId_" + noteId
                let notesInfo = this.getNotesInfo()
                if (!notesInfo || !notesInfo[key]) return -1
                return notesInfo[key]['version']
            },

            /**
             * 获取本地笔记信息
             */
            getNotesInfo() {
                let notesInfo = localStorage.getItem("notesInfo");
                return JSON.parse(notesInfo)
            },

            /**
             * 从服务器拉取最新的笔记
             */
            pullNoteFromServer(id, index) {
                const _this = this

                this.$axios.get(`/sync/note/${id}`, )
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            let note = data.data
                            _this.noteData[index] = note
                            _this.editor.value = note.content
                            // 更新本地版本
                            _this.updateLocalNoteVersion(note.id, note.version)
                            // 更新本地内容
                            _this.updateLocalNoteContent(note.id, note.content)
                            // 更新本地状态
                            _this.updateLocalNoteStatus(note.id, false)
                        }
                    })
            },

            /**
             * 同步笔记到服务器
             */
            syncToServer(noteId, title, content) {
                console.log("同步笔记")
                const _this = this
                let data = Qs.stringify({
                    title: title,
                    content: content
                })
                this.$axios.put(`sync/note/${noteId}`, data)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            // 更新本地版本
                            _this.updateLocalNoteVersion(noteId, data.data.version)
                            // 更新本地状态
                            _this.updateLocalNoteStatus(noteId, false)
                            _this.sync = false
                        }
                    })
            },

            /**
             * 创建新的笔记
             */
            newNote() {
                const _this = this
                let title = prompt("请输入笔记的标题",""); // 弹出input框
                let data = Qs.stringify({
                    "title": title,
                    "content": ""
                })
                if (title != null) {
                    console.log("新建笔记")

                    this.$axios.post(`note/`, data)
                        .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            console.log(data)
                            _this.noteData.unshift(data.data)
                            _this.noteIndex = 0
                            // 显示当前笔记的详情
                            _this.showDetail(data.data, 0)
                            // 更新本地版本
                            _this.updateLocalNoteVersion(data.data.id, data.data.version)
                        }
                    })
                }
            },

            /**
             * 删除笔记
             */
            deleteNote() {
                let note = this.noteData[this.noteIndex]
                // console.log(note)
                let _this = this
                this.$axios.delete(`note/${note.id}`)
                    .then(res => {
                        let data = res.data
                        if (data.code === 0) {
                            // console.log(data)
                            _this.success("删除成功")
                            _this.$store.commit("DELETE_NOTE", note.id)
                            setTimeout(() => {
                                _this.reload()
                            }, 1000)
                        }
                    })
            },

            /**
             * 更新本地版本
             */
            updateLocalNoteVersion(noteId, version) {
                // console.log("更新本地版本")
                // console.log("noteId: " + noteId + " version: " + version)
                let notesInfo = localStorage.getItem("notesInfo");
                let key = "noteId_" + noteId
                if (!notesInfo) {
                    notesInfo = {}
                    notesInfo[key] = {version: version, update: true}
                } else {
                    notesInfo = JSON.parse(notesInfo);
                    if (!notesInfo[key]) {
                        notesInfo[key] = {version: version}
                    } else {
                        notesInfo[key]['version'] = version
                    }
                }
                localStorage.setItem("notesInfo", JSON.stringify(notesInfo))
            },

            /**
             * 更新状态
             */
            updateLocalNoteStatus(noteId, status) {
                let notesInfo = localStorage.getItem("notesInfo");
                let key = "noteId_" + noteId
                if (!notesInfo) {
                    notesInfo = {}
                    notesInfo[key] = {version: version, update: true}
                } else {
                    notesInfo = JSON.parse(notesInfo);
                    notesInfo[key]['update'] = status
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
                    notesInfo[key] = {update: true, content: content}
                } else {
                    notesInfo = JSON.parse(notesInfo)
                    console.log(notesInfo)
                    if (!notesInfo[key]) {
                        notesInfo[key] = {update: true, content: content}
                    } else {
                        notesInfo[key]['update'] = true
                        notesInfo[key]['content'] = content
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
                        if (data.data.length !== 0) {
                            data.data.forEach(item => {
                                let content = _this.haveAndGetContent(item.id);
                                if (content) {
                                    // 如果有本地笔记，则使用本地笔记
                                    item.content = content
                                    console.log("使用本地")
                                }
                            })
                            _this.noteData = data.data
                            _this.editor.value = _this.noteData[0].content
                            // this.checkVersion(_this.noteData[0].id, this.getVersion(_this.noteData[0].id), i)
                        }
                    }
                })
            },

            haveAndGetContent(noteId) {
                let key = "noteId_" + noteId
                let notesInfo = this.getNotesInfo()
                if (!notesInfo || !notesInfo[key] || !notesInfo[key]['content']) {
                    return false
                }
                return notesInfo[key]['content']
            },
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
            const _this = this
            // 初始化笔记
            this.initNotes()
        }
    }


</script>
