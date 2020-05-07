<template>
  <div class="messagebox" v-show="activedKey[type]!= ''">
    <div class="messagebox-header">
      <!-- <div>{{type}}</div> -->
      <div>
        <a-icon type="left" class="user-goback" v-show="broken" @click="showUserList" />
        <span>{{activedKey[type].groupname? `${activedKey[type].name } &nbsp;&nbsp; ${activedKey[type].groupid || ''}`:`${activedKey[type].username } &nbsp;&nbsp; ${activedKey[type].groupid || ''}`}}</span>
        <a-icon v-if="type=='group'" type="ellipsis" class="user-ellipsis" @click="changeMenus" />
        <a-dropdown v-else-if="type=='contact'">
          <a class="ant-dropdown-link user-ellipsis" href="#" @click="changeMenus">
            <a-icon type="ellipsis" />
          </a>
          <a-menu slot="overlay">
            <a-menu-item @click="menuClick('1')">
              <a href="javascript:;">加入黑名单</a>
            </a-menu-item>
            <a-menu-item @click="menuClick('2')">
              <a href="javascript:;">删除好友</a>
            </a-menu-item>
          </a-menu>
        </a-dropdown>
      </div>
    </div>

    <div class="messagebox-content" ref="msgContent">
      <div class="moreMsgs" @click="loadMoreMsgs">{{loadText}}</div>
      <div
        v-for="(item,i) in msgList"
        :key="i"
        class="message-group"
        :style="{'float':item.bySelf ? 'right':'left'}"
      >
        <h4 style="text-align: left;margin:0">{{item.bySelf===false?item.name:''}}</h4>

        <!-- 撤回消息 -->
        <div v-if="item.status == 'recall'" class="recallMsg">{{item.msg}}</div>
        <div v-if="item.status == 'recall'" class="recallMsg">{{renderTime(item.time)}}</div>
        <!-- 撤回消息 end -->
        <a-dropdown
          v-else
          :trigger="['contextmenu']"
          :style="{'float':item.bySelf ? 'right':'left'}"
          :disabled="!item.bySelf"
        >
          <span style="user-select: none">
            <!-- <el-dropdown v-else @command="handleCommand(item)" trigger="click" :style="{'float':item.bySelf ? 'right':'left'}">
            <span class="el-dropdown-link">-->
            <!-- 图片消息 -->
            <img
              width="100"
              height="100"
              :key="item.msg"
              :src="item.msg"
              v-if="item.type === 'img'"
              class="img-style"
            />
            <!-- 名片 -->
            <div
              v-else-if="item.ext&&item.msg===''"
              class="file-style"
              :style="{'float':item.bySelf ? 'right':'left'}"
            >
              <el-card :body-style="{ padding: '0px' }">
                <div style="padding: 14px;">
                  <h2 :style="{display:'flex'}">
                    <img
                      :style="{width:'50px',height:'50px',marginRight:'10px',marginBottom:'10px'}"
                      :src="item.ext.doctorIdHead"
                      alt
                    />
                    <div>
                      <h3 :style="{marginBottom:'0'}">{{item.ext.doctorName}}</h3>
                      <span>{{item.ext.DoctorPosition}}</span>
                    </div>
                  </h2>

                  <div class="bottom clearfix">
                    <a href="#">个人名片</a>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 音频消息 -->
            <div v-else-if="item.type==='audio'" :style="{'float':item.bySelf ? 'right':'left'}">
              <audio :src="item.msg" controls></audio>
            </div>
            <!-- 视频消息 -->
            <div v-else-if="item.type==='video'">
              <video :src="item.msg" width="100%" controls></video>
            </div>
            <!-- 聊天消息 -->
            <p
              style="user-select: text;width:'100px'"
              v-if="item.type===''&&!item.ext "
              v-html="renderTxt(item.msg)"
              :class="{ 'byself': item.bySelf}"
            />

            <!-- <div v-if="item.bySelf?true:false" class="status">{{status[item.status]}}</div> -->
          </span>
          <!-- <el-dropdown-menu slot="dropdown" >
            <el-dropdown-item command="a" :disabled="!item.bySelf">撤回</el-dropdown-item>
          </el-dropdown-menu>
          </el-dropdown>-->

          <a-menu slot="overlay">
            <a-menu-item key="1" @click="handleCommand(item)">撤回</a-menu-item>
          </a-menu>
        </a-dropdown>

        <!-- 聊天时间 -->
        <div
          v-if="item.status !== 'recall'"
          class="time-style"
          :style="{'text-align':item.bySelf ? 'right':'left'}"
        >{{renderTime(item.time)}} {{item.bySelf?status[item.status]:''}}</div>
      </div>
    </div>
    <div class="messagebox-footer">
      <div class="footer-icon">
        <!-- 表情组件 -->
        <ChatEmoji v-on:selectEmoji="selectEmoji" :inpMessage="message" />
        <!-- 上传图片组件 -->
        <UpLoadImage :type="this.type" :chatId="activedKey[type]" />
        <!-- 上传文件组件 -->
        <UpLoadFile :type="this.type" :chatId="activedKey[type]" v-show="false" />
        <!-- 发送名片 -->
        <i class="el-icon-bank-card icon" @click="sendCard"></i>

        <!-- 发送语音 -->
        <RecordAudio v-show="true" />

        <i
          class="el-icon-video-camera icon"
          @click="callVideo"
          v-show="true&&type != 'chatroom'"
          :style="nowIsVideo?'pointer-events: none':'cursor: pointer'"
        ></i>
        <i
          v-if="type === 'contact'"
          class="el-icon-microphone icon"
          @click="callVoice"
          v-show="true && type != 'chatroom'"
          :style="nowIsVideo?'pointer-events: none':'cursor: pointer'"
        ></i>
      </div>
      <div class="fotter-send">
        <a-input
          v-model="message"
          equired
          placeholder="消息"
          class="sengTxt"
          @pressEnter="onSendTextMsg"
          style="resize:none"
          ref="txtDom"
        />
        <template />
      </div>
    </div>

    <GetGroupInfo ref="groupInfoModel" @closeGroupMessage="closeGroupMessage" />

    <EmediaModal ref="emediaModal" @changeIsVideoState="changeIsVideoState" />
    <MultiAVModal :to="activedKey[type]" />
    <AddAVMemberModal ref="addAvMembertModal" :to="activedKey[type]" />

    <div class="search" v-show="isShow">
      <el-input v-model="input" placeholder="请输入内容" @input="Search"></el-input>
      <ul v-if="list.length>0">
        <li
          v-for="item in list"
          :key="item.doctorId"
          @click="sendId(item.appAccount,item.doctorId,item.occupationTitle)"
        >
          <img :src="item.portraitg" alt />
          <span>{{item.fullName}}</span>
          <span>{{item.occupationTitle}}</span>
        </li>
      </ul>
      <ul v-else>
        <li
          v-for="item in doctors"
          :key="item.doctorId"
          :data-id="item.appAccount"
          @click="sendId(item.appAccount,item.doctorId,item.occupationTitle)"
        >
          <img :src="item.portraitg" alt />
          <span>{{item.fullName}}</span>
          <span>{{item.occupationTitle}}</span>
        </li>
      </ul>
      <el-button type="primary" @click="isShow=false" plain>取消</el-button>
    </div>
  </div>
</template>

<script>
import ChatEmoji from "../chatEmoji/index.vue";
import emoji from "../../config/emoji";
import UpLoadImage from "../upLoadImage/index.vue";
import UpLoadFile from "../upLoadFile/index.vue";
import RecordAudio from "../recorder/index.vue";
import "./index.less";
import { mapActions, mapGetters } from "vuex";
import EmediaModal from "../emediaModal/index";
import moment from "moment";
import _ from "lodash";
import AddAVMemberModal from "../emediaModal/addAVMemberModal";
import MultiAVModal from "../emediaModal/multiAVModal";
import GetGroupInfo from "../group/groupInfo.vue";
import Api from "@/api/request.js";

export default {
  data() {
    return {
      input: "",
      doctors: [],
      list: [],
      isShow: false,
      activedKey: {
        contact: "",
        group: "",
        chatroom: ""
      },
      ext: {
        IsMingPian: "IsMingPian",
        doctorId: "",
        doctorIdHead: "",
        doctorName: "",
        DoctorPosition: "",
        Fromid: "",
        appAccount: "",
        userId: ""
      },
      message: "",
      isHttps: window.location.protocol === "https:",
      loadText: "加载更多",
      status: {
        sending: "发送中",
        sent: "已发送",
        read: "已读"
      },
      nowIsVideo: false
    };
  },
  created() {},
  beforeMount() {
    if (this.type === "contact") {
      this.onGetContactUserList();
    } else if (this.type === "group") {
      this.onGetGroupUserList();
    } else if (this.type === "chatroom") {
      this.onGetChatroomUserList();
    }
  },
  updated() {
    // console.log("数据", this.$store);
    this.scollBottom();
    console.log(this.msgList, "我");
  },
  computed: {
    ...mapGetters({
      contact: "onGetContactUserList",
      group: "onGetGroupUserList",
      chatroom: "onGetChatroomUserList",
      msgList: "onGetCurrentChatObjMsg"
    }),
    userList() {
      return {
        contact: this.contact,
        group: this.group,
        chatroom: this.chatroom
      };
    },
    selectedKeys() {
      return [this.getKey(this.activedKey[this.type]) || ""];
    }
  },
  props: [
    "type", // 聊天类型 contact, group, chatroom
    "username", // 选中的聊天对象
    "broken", // 是否适应移动端
    "showUserList",
    "hideUserList"
  ],
  methods: {
    sendCard() {
      this.isShow = !this.isShow;
      if (this.isShow === true) {
        Api.appfindDoctorpage().then(res => {
          if (res.status === 200 && res) {
            this.doctors = res.data;
          }
        });
      }
    },
    Search() {
      let input = this.input;
      if (input) {
        return (this.list = this.doctors.filter(
          value => value.fullName.indexOf(this.input) !== -1
        ));
      } else {
        this.list = this.doctors;
      }
    },

    ...mapActions([
      "onGetContactUserList",
      "onGetGroupUserList",
      "onGetChatroomUserList",
      "onGetCurrentChatObjMsg",
      "onSendText",
      "onCallVideo",
      "onCallVoice",
      "getGroupMembers",
      "getHistoryMessage",
      "onAddBlack",
      "onDelteFirend",
      "onGetGroupinfo",
      "recallMessage",
      "onGetGroupBlack"
    ]),
    getKey(item, type) {
      let key = "";
      switch (type) {
        case "contact":
          key = item.name;
          break;
        case "group":
          key = item.groupid;
          break;
        case "chatroom":
          key = item.id;
          break;
        default:
          break;
      }
      return key;
    },
    getCurrentMsg(props) {
      this.onGetCurrentChatObjMsg({
        type: props,
        id: this.getKey(this.activedKey[props], props)
      });
    },
    select(key) {
      this.$data.activedKey[this.type] = key;
      const me = this;
      me.$data.loadText = "加载更多";
      // if( me.roomId){
      //     WebIM.conn.quitChatRoom({
      //         roomId: me.roomId // 聊天室id
      //     });
      //     me.roomId = ''
      //   }

      if (this.type === "group") {
        this.$router.push({ name: this.type, params: { id: key.groupid } });
        this.onGetCurrentChatObjMsg({ type: this.type, id: key.groupid });

        setTimeout(() => {
          Vue.$store.commit("updateMessageStatus", {
            action: "oneUserReadMsgs",
            readUser: key.groupid
          });
          this.$forceUpdate();
        }, 100);

        if (!this.msgList) {
          this.getHistoryMessage({ name: key.groupid, isGroup: true });
        }
      } else if (this.type === "contact") {
        this.$router.push({ name: this.type, params: { id: key.name } });
        this.onGetCurrentChatObjMsg({ type: this.type, id: key.name });
        setTimeout(() => {
          Vue.$store.commit("updateMessageStatus", {
            action: "oneUserReadMsgs",
            readUser: key.name
          });
          this.$forceUpdate();
        }, 100);

        if (!this.msgList) {
          this.getHistoryMessage({ name: key.name, isGroup: false });
        }
      } else if (this.type === "chatroom") {
        const me = this;
        // me.roomId = key.id

        this.$router.push({ name: this.type, params: { id: key.id } });
        this.onGetCurrentChatObjMsg({ type: this.type, id: key.id });

        WebIM.conn.joinChatRoom({
          roomId: key.id, // 聊天室id
          success: function() {
            // console.log("加入聊天室成功");
            if (!me.msgList) {
              me.getHistoryMessage({ name: key.id, isGroup: true });
              setTimeout(() => {
                me.$forceUpdate();
              }, 100);
            }
          }
        });
      }
    },

    loadMoreMsgs() {
      const me = this;
      const success = function(msgs) {
        if (msgs.length === 0) {
          me.$data.loadText = "已无更多数据";
        }
      };
      let name = "";
      let isGroup = false;
      if (this.type === "contact") {
        name = this.$data.activedKey[this.type].name;
      } else if (this.type === "group") {
        name = this.$data.activedKey[this.type].groupid;
        isGroup = true;
      } else if (this.type === "chatroom") {
        name = this.$data.activedKey[this.type].id;
        isGroup = true;
      }
      this.getHistoryMessage({
        name,
        isGroup,
        success
      });
    },

    changeMenus() {
      if (this.type === "contact") {
      } else if (this.type === "group") {
        this.$refs.groupInfoModel.chengeInfoModel();
        this.getGroupInfo();
      }
    },
    menuClick(i) {
      this.changeMenus();
      switch (i) {
        case "1":
          // console.log("加入黑名单");
          this.onAddBlack({
            userId: this.$data.activedKey[this.type]
          });
          this.$data.activedKey.contact = "";
          this.$router.push({
            // 核心语句
            path: "/contact" // 跳转的路径
          });
          break;
        case "2":
          this.onDelteFirend({
            userId: this.$data.activedKey[this.type],
            callback: () => {
              this.closeContactMessage();
            }
          });
          break;
        default:
          break;
      }
    },
    getGroupInfo() {
      this.onGetGroupinfo({
        select_id: this.$data.activedKey[this.type].groupid
      });
    },
    onSendTextMsg() {
      console.log(this.msgList);
      if (this.$data.message == "" || this.$data.message == "\n") {
        this.$data.message = "";
        return;
      }
      this.onSendText({
        chatType: this.type,
        chatId: this.$data.activedKey[this.type],
        message: this.$data.message
      });
      this.$data.message = "";
    },
    sendId(appAccount, doctorId, occupationTitle) {
      console.log(this.msgList);
      let Fromid = JSON.parse(localStorage.getItem("userInfo")).userId;
      Api.findUserAppAccount({ appAccount }).then(res => {
        console.log(res.data.list, 11);
        let list = [];
        if (res.status === 200) {
          this.ext.doctorId = doctorId;
          this.ext.DoctorPosition = occupationTitle;
          this.ext.doctorIdHead = res.data.list[0].userHead;
          this.ext.DoctorPosition = occupationTitle;
          this.ext.doctorName = res.data.list[0].userName;
          this.ext.appAccount = appAccount;
          this.ext.Fromid = Fromid;
          this.ext.userId = res.data.list[0].userId;
          this.isShow = false;
          console.log(this.$data.ext);
          this.onSendText({
            chatType: this.type,
            chatId: this.$data.activedKey[this.type],
            ext: this.$data.ext,
            message: ""
          });
        }
      });
    },
    selectEmoji(v) {
      this.$data.message = v;
      this.$refs.txtDom.focus();
    },

    customEmoji(value) {
      console.log(value, 11);
      return `<img src="../../../static/faces/${value}" style="width:20px"/>`;
      // ../../../static/faces/${value}
    },

    renderTxt(txt = "") {
      let rnTxt = [];
      let match = null;
      const regex = /(\[.*?\])/g;
      let start = 0;
      let index = 0;
      while ((match = regex.exec(txt))) {
        index = match.index;
        if (index > start) {
          rnTxt.push(txt.substring(start, index));
        }
        if (match[1] in emoji.obj) {
          const v = emoji.obj[match[1]];
          rnTxt.push(this.customEmoji(v));
        } else {
          rnTxt.push(match[1]);
        }
        start = index + match[1].length;
      }
      rnTxt.push(txt.substring(start, txt.length));

      return rnTxt.toString().replace(/,/g, "");
    },

    callVideo() {
      if (this.type == "contact") {
        this.$refs.emediaModal.showEmediaModal();
        this.$refs.emediaModal.showCallerWait(
          this.$data.activedKey[this.type].name
        );

        const videoSetting = JSON.parse(localStorage.getItem("videoSetting"));
        const recMerge = (videoSetting && videoSetting.recMerge) || false;
        const rec = (videoSetting && videoSetting.rec) || false;
        this.onCallVideo({
          chatType: this.type,
          to: this.$data.activedKey[this.type].name,
          rec,
          recMerge
        });
      } else if (this.type == "group") {
        this.getGroupMembers(this.$data.activedKey[this.type].groupid);
        this.$refs.addAvMembertModal.show();
      }
    },
    callVoice() {
      this.$refs.emediaModal.showEmediaModal();
      this.$refs.emediaModal.showCallerWait(
        this.$data.activedKey[this.type].name
      );

      const videoSetting = JSON.parse(localStorage.getItem("videoSetting"));
      const recMerge = (videoSetting && videoSetting.recMerge) || false;
      const rec = (videoSetting && videoSetting.rec) || false;
      this.onCallVoice({
        chatType: this.type,
        to: this.$data.activedKey[this.type].name,
        rec,
        recMerge
      });
    },
    readablizeBytes(value) {
      let s = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      let e = Math.floor(Math.log(value) / Math.log(1024));
      return (value / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
    },

    // TODO 可以抽离到utils
    renderTime(time) {
      const nowStr = new Date();
      const localStr = time ? new Date(time) : nowStr;
      const localMoment = moment(localStr);
      const localFormat = localMoment.format("MM-DD hh:mm A");
      return localFormat;
    },
    getLastMsg(item) {
      const { name, params } = this.$route;
      const chatList = this.$store.state.chat.msgList[name];
      let userId = "";
      if (name == "contact") {
        userId = item.name;
      } else if (name == "group") {
        userId = item.groupid;
      } else {
        userId = item.id;
      }
      const currentMsgs = chatList[userId] || [];
      const lastMsg = currentMsgs.length
        ? currentMsgs[currentMsgs.length - 1].msg
        : "";
      const msgTime = currentMsgs.length
        ? this.renderTime(currentMsgs[currentMsgs.length - 1].time)
        : "";
      return { lastMsg, msgTime };
    },
    scollBottom() {
      setTimeout(() => {
        const dom = this.$refs.msgContent;
        if (!dom) return;
        dom.scrollTop = dom.scrollHeight;
      }, 0);
    },
    handleCommand(item) {
      let name = "";
      if (this.type === "contact") {
        name = this.$data.activedKey[this.type].name;
      } else if (this.type === "group") {
        name = this.$data.activedKey[this.type].groupid;
      } else if (this.type === "chatroom") {
        name = this.$data.activedKey[this.type].id;
      }
      this.recallMessage({ to: name, message: item });
    },
    closeGroupMessage() {
      //退出群组或解散群组时关闭聊天框
      this.$data.activedKey["group"] = "";
    },
    closeContactMessage() {
      //删除好友时关闭当前聊天框
      this.$data.activedKey["contact"] = "";
    },
    changeIsVideoState(v) {
      v ? (this.$data.nowIsVideo = true) : (this.$data.nowIsVideo = false);
    },
    /**
     * @description: 出发父级方法
     * @param {type}
     * @return:
     */

    onEmitParentFuntion(param) {
      this.$emit("contactTypeChange", param);
    }
  },
  components: {
    EmediaModal,
    AddAVMemberModal,
    ChatEmoji,
    UpLoadImage,
    UpLoadFile,
    MultiAVModal,
    GetGroupInfo,
    RecordAudio
  }
};
</script>

<style scoped lang='less'>
.byself {
  float: right;
}
.recallMsg {
  font-size: 12px;
  color: #aaa;
  width: 100%;
  text-align: center;
}
.custom-title {
  font-weight: 500;
}
.moreMsgs {
  background: #ccc !important;
  border-radius: 8px;
  cursor: pointer;
}
.status {
  display: inline;
  position: relative;
  top: 20px;
  font-size: 12px;
  left: -6px;
  color: #736c6c;
  float: left;
}
.unreadNum {
  float: left;
  width: 100%;
}
.icon-style {
  display: inline-block;
  background-color: #f04134;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: white;
  line-height: 1.5;
  text-align: center;
}
.emoji-style {
  width: 22px;
  float: left;
}
.img-style {
  max-width: 350px;
}
.time-style {
  clear: both;
  margin-left: 2px;
  margin-top: 3px;
  font-size: 12px;
  color: #888c98;
}
.file-style {
  width: 240px;
  margin: 2px 2px 2px 0;
  font-size: 13px;
  h2 {
    border-bottom: 1px solid #e0e0e0;
    font-weight: 300;
    text-align: left;
  }
  h3 {
    max-width: 100%;
    font-size: 15px;
    height: 20px;
    line-height: 20px;
    font-weight: 600;
    -o-text-overflow: ellipsis;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-align: left;
    margin-bottom: 20px;
  }
  .bottom {
    span {
      color: #999999;
      text-align: left;
    }
  }
  a {
    color: #999999;
    float: right;
    text-decoration: none;
  }
  .el-dropdown-link {
    cursor: pointer;
    color: #409eff;
  }
  .el-icon-arrow-down {
    font-size: 12px;
  }
  .el-button {
    padding: 0;
  }
}
.search {
  background: #eee;
  width: 80%;
  height: 300px;
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0;
  bottom: 0;
  margin: auto;
  padding: 10px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
  ul {
    margin-top: 10px;
    li {
      list-style: none;
      background: #fff;
      margin-right: 45px;
      margin-bottom: 10px;
      cursor: pointer;
      img {
        height: 50px;
        margin-right: 30px;
      }
      span {
        margin-right: 30px;
        font-size: 16px;
      }
    }
  }
}
</style>

