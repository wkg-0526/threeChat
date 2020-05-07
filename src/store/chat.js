import WebIM from "../utils/WebIM";
import Api from "../api/request";
// import WebIM from "../utils/WebIM";

// TODO 处理页面刷新无法获取到音频url
const res = function(response) {
  let objectUrl = WebIM.utils.parseDownloadResponse.call(WebIM.conn, response);
  return objectUrl; //  'blob:http://localhost:8080/536070e2-b3a0-444a-b1cc-f0723cf95588'
};

function test(url, func) {
  let options = {
    url: url,
    headers: { Accept: "audio/mp3" },
    onFileDownloadComplete: func,
    onFileDownloadError: function() {
      console.log("音频下载失败");
    }
  };
  WebIM.utils.download.call(WebIM.conn, options);
}

const Chat = {
  state: {
    userList: {
      contactUserList: [],
      groupUserList: [],
      chatroomUserList: []
    },
    msgList: {
      contact: {},
      group: {},
      chatroom: {}
    },
    currentMsgs: []
  },
  mutations: {
    updateUserList(state, payload) {
      const { userList, type } = payload;
      // 如果是添加黑名单，则从当前用户列表中删掉此人
      if (payload.black && payload.black.type === "addBlack") {
        const addName = payload.black.addName;
        const userList = state.userList[type];
        let newUserList = _.pullAllBy(userList, [{ name: addName }], "name");
        state.userList[type] = newUserList;
      } else {
        state.userList[type] = userList;
      }
      // state.userList[type] = userList;
    },
    /**
     * @description: 更新群组信息
     * @param {type}
     * @return:
     */
    updateMsgList(state, payload) {
      Api.findUserGroupDetail({ groupId: payload.mid }).then(res => {
        let name = "";
        if (payload.from === res.data.doctorAccount) {
          name = res.data.doctorAccount;
        } else if (payload.from === res.data.userAccount) {
          name = res.data.userAccount;
        } else {
          name = res.data.nickName;
        }
        const { chatType, chatId, msg, bySelf, type, id } = payload;
        console.log(state.msgList, "1111");
        const { params } = Vue.$route;
        let status = "unread";
        if (payload.chatType == "contact") {
          if (params.id == payload.from) {
            status = "read";
          }
        } else if (payload.chatType == "group") {
          if (params.id == payload.chatId) {
            status = "read";
          }
        }

        if (!state.msgList[chatType][chatId]) {
          console.log(
            [
              {
                msg,
                bySelf,
                type: type || "",
                mid: id,
                status: status,
                // name: getName(message),
                ...payload
              }
            ],
            222
          );
          state.msgList[chatType][chatId] = [
            {
              msg,
              bySelf,
              type: type || "",
              mid: id,
              status: status,
              name,
              ...payload
            }
          ];
        } else {
          console.log(
            {
              msg,
              bySelf,
              type: type || "",
              mid: id,
              status,
              // name: getName(message),
              ...payload
            },
            111
          );
          state.msgList[chatType][chatId].push({
            msg,
            bySelf,
            type: type || "",
            mid: id,
            status,
            name,
            ...payload
          });
          state.msgList[chatType][chatId] = state.msgList[chatType][
            chatId
          ].sort((a, b) => {
            return a.time - b.time;
          });

          // state.msgList[chatType][chatId] = _unique(state.msgList[chatType][chatId])
        }
        console.log(state.msgList, "msgList");

        if (chatType === "chatroom" && !bySelf) {
          // 聊天室消息去重处理
          state.currentMsgs = _.uniqBy(state.msgList[chatType][chatId], "mid");
        } else {
          state.currentMsgs = Object.assign(
            {},
            state.msgList[chatType][params.id || chatId]
          ); // 这里params.id在路由跳转的时候会undefind，取chatId兼容
        }
        state.msgList = Object.assign({}, state.msgList);
      });
    },
    updateCurrentMsgList(state, messages) {
      state.currentMsgs = messages;
    },
    updateMessageMid(state, message) {
      const { id, mid } = message;
      const { name, params } = Vue.$route;
      // state.currentMsgs.forEach((item) => {
      //     if(item.mid == id){
      //         item.mid = mid
      //     }
      // })
      Object.keys(state.msgList[name]).forEach(user => {
        if (state.msgList[name][user].length) {
          state.msgList[name][user].forEach(msg => {
            if (msg.mid == id) {
              msg.mid = mid;
            }
          });
        }
      });
    },
    updateMessageStatus(state, message) {
      const { id, mid, action, readUser } = message;
      const { name, params } = Vue.$route;
      Object.keys(state.msgList[name]).forEach(user => {
        // console.log(state.msgList[name][user]);

        if (action == "oneUserReadMsgs") {
          if (state.msgList[name][readUser]) {
            state.msgList[name][readUser].forEach(msg => {
              if (msg.status != "recall") {
                msg.status = "read";
              }
            });
          }
        } else if (state.msgList[name][user].length) {
          state.msgList[name][user].forEach(msg => {
            if (action === "readMsgs" && !msg.bySelf) {
              if (msg.status != "recall") {
                msg.status = "read";
              }
            } else if (msg.mid == id || msg.mid == mid) {
              msg.status = message.status;
              if (message.msg) {
                msg.msg = message.msg;
              }
            }
          });
        }
      });
    },
    // 黑名单筛选用户列表
    changeUserList(state, payload) {
      console.log(state, payload, "wu");
      let ary = [];
      _.forIn(payload, function(value, key) {
        ary.push({ name: key });
      });
      state.userList.contactUserList = _.pullAllBy(
        state.userList.contactUserList,
        ary,
        "name"
      );
    }
  },
  actions: {
    /**
     * @description: 获取私聊用户列表
     * @param {type}
     * @return:
     */
    onGetContactUserList: function(context, payload) {
      // 获取好友信息
      var options = {
        success: function(roster) {
          // console.log("roster", roster, 123);
          // const userList = roster.filter(user =>
          //   ["both", "to"].includes(user.subscription)
          // );
          // console.log(userList, "userListUser");
          // context.commit("updateUserList", {
          //   userList,
          //   type: "contactUserList",
          //   black: payload
          // });
        }
      };
      WebIM.conn.getRoster(options);
    },
    /**
     * @description: 获取群组用户列表
     * @param {type}
     * @return:
     **/
    onGetGroupUserList: function(context, payload) {
      var options = {
        success: function(resp) {
          let userList = resp.data;
          userList.forEach((user, index) => {
            userList[index].name = user.groupname;
          });
          console.log(userList, "userList");
          context.commit("updateUserList", {
            userList,
            type: "groupUserList"
          });
        },
        error: function(e) {}
      };
      WebIM.conn.getGroup(options);
    },
    /**
     * @description: 获取聊天室用户列表
     * @param {type}
     * @return:
     */
    onGetChatroomUserList: function(context, payload) {
      var option = {
        apiUrl: "https://a1.easemob.com",
        pagenum: 1, // 页数
        pagesize: 20, // 每页个数
        success: function(list) {
          context.commit("updateUserList", {
            userList: list.data,
            type: "chatroomUserList"
          });
        },
        error: function() {
          console.log("List chat room error");
        }
      };
      WebIM.conn.getChatRooms(option);
    },
    // 获取当前聊天对象的记录 @payload： {key, type}
    onGetCurrentChatObjMsg: function(context, payload) {
      const { id, type } = payload;
      context.commit("updateCurrentMsgList", context.state.msgList[type][id]);
    },
    onSendText: function(context, payload) {
      const { chatType, chatId, message, ext } = payload;
      const id = WebIM.conn.getUniqueId();
      const time = +new Date();
      const chatroom = chatType === "chatroom";
      const type = chatType === "contact" ? "singleChat" : "groupChat";
      const jid = {
        contact: "name",
        group: "groupid",
        chatroom: "id"
      };
      const msgObj = new WebIM.message("txt", id);
      msgObj.set({
        msg: message,
        to: chatId[jid[chatType]],
        chatType: type,
        roomType: chatroom,
        ext: ext,
        success: function() {
          console.log(msgObj, 11);
          context.commit("updateMsgList", {
            chatType,
            chatId: chatId[jid[chatType]],
            msg: message,
            bySelf: true,
            time: time,
            mid: id,
            // name: getName(message),
            status: "sending",
            ext
          });
        },
        fail: function(e) {
          console.log("Send private text error", msgObj);
        }
      });
      if (chatType === "group" || chatType === "chatroom") {
        msgObj.setGroup("groupchat");
      }
      WebIM.conn.send(msgObj.body);
    },
    sendImgMessage: function(context, payload) {
      const { chatType, chatId, roomType, file, callback } = payload;
      const id = WebIM.conn.getUniqueId();
      const jid = {
        contact: "name",
        group: "groupid",
        chatroom: "id"
      };
      const msgObj = new WebIM.message("img", id);
      msgObj.set({
        apiUrl: WebIM.config.apiURL,
        file: file,
        to: chatId[jid[chatType]],
        roomType: roomType,
        onFileUploadError: function(error) {
          console.log("图片上传失败", error);
          callback();
        },
        onFileUploadComplete: function(data) {
          let url = data.uri + "/" + data.entities[0].uuid;
          context.commit("updateMsgList", {
            msg: url,
            chatType,
            chatId: chatId[jid[chatType]],
            bySelf: true,
            type: "img",
            time: data.timestamp,
            mid: id,
            // name: getName(message),
            status: "sending"
          });
          callback();
        },
        success: function() {
          console.log("图片发送成功");
        }
      });
      if (chatType === "group" || chatType === "chatroom") {
        msgObj.setGroup("groupchat");
      }
      WebIM.conn.send(msgObj.body);
    },
    sendFileMessage: function(context, payload) {
      const { chatType, chatId, roomType, file, callback } = payload;
      const id = WebIM.conn.getUniqueId();
      const jid = {
        contact: "name",
        group: "groupid",
        chatroom: "id"
      };
      const msgObj = new WebIM.message("file", id);
      msgObj.set({
        apiUrl: WebIM.config.apiURL,
        file: file,
        ext: {
          file_length: file.data.size
        },
        to: chatId[jid[chatType]],
        roomType: roomType,
        onFileUploadError: function(error) {
          console.log("文件上传失败", error);
          callback();
        },
        onFileUploadComplete: function(data) {
          let url = data.uri + "/" + data.entities[0].uuid;
          context.commit("updateMsgList", {
            msg: url,
            chatType,
            chatId: chatId[jid[chatType]],
            bySelf: true,
            type: "file",
            filename: file.data.name,
            file_length: file.data.size,
            time: data.timestamp,
            // name: getName(message),
            mid: id,
            status: "sending"
          });
          callback();
        },
        success: function() {
          console.log("文件发送成功");
        }
      });
      if (chatType === "group" || chatType === "chatroom") {
        msgObj.setGroup("groupchat");
      }
      WebIM.conn.send(msgObj.body);
    },
    sendRecorder: function(context, payload) {
      const { useId, type, file } = payload;
      const id = WebIM.conn.getUniqueId();
      const msgObj = new WebIM.message("audio", id);
      let isRoom = type == "chatroom" || type == "groupchat";

      const jid = {
        contact: "name",
        group: "groupid",
        chatroom: "id"
      };

      // console.log('bold>>>', bold);
      // console.log('newBold>>', WebIM.utils.parseDownloadResponse.call(WebIM.conn, bold));
      // let newBold = WebIM.utils.parseDownloadResponse.call(WebIM.conn, bold)
      // var file = WebIM.utils.getFileUrl(input);
      msgObj.set({
        apiUrl: WebIM.config.apiURL,
        file: file,
        to: useId,
        type: "audio",
        roomType: isRoom,

        onFileUploadError: function(error) {
          console.log("语音上传失败", error);
        },
        onFileUploadComplete: function(data) {
          console.log("上传成功", data);

          let url = data.uri + "/" + data.entities[0].uuid;
          context.commit("updateMsgList", {
            msg: url,
            chatType: type,
            chatId: useId,
            bySelf: true,
            type: "audio",
            // name: getName(message),
            filename: file.data.name,
            // file_length: file.data.size,
            // time: data.timestamp,
            mid: id,
            status: "sending"
          });
        },
        success: function(data) {
          console.log("语音发送成功", data);
        },
        flashUpload: WebIM.flashUpload
      });

      if (type === "group" || type === "chatroom") {
        msgObj.setGroup("groupchat");
      }
      WebIM.conn.send(msgObj.body);
    },

    onCallVideo: function(context, payload) {
      const { chatType, to } = payload;
      const type = chatType === "contact" ? "singleChat" : "groupChat";
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (chatType === "contact") {
        // this.setState({
        //     showWebRTC: true
        // })
        WebIM.call.caller = userInfo.userId;
        WebIM.call.makeVideoCall(to, null, payload.rec, payload.recMerge);
      }
    },
    onCallVoice: function(context, payload) {
      const { chatType, to } = payload;
      const type = chatType === "contact" ? "singleChat" : "groupChat";
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (chatType === "contact") {
        WebIM.call.caller = userInfo.userId;
        WebIM.call.makeVoiceCall(to, null, payload.rec, payload.recMerge);
      }
    },

    getHistoryMessage: function(context, payload) {
      const options = {
        queue: payload.name,
        isGroup: payload.isGroup,
        count: 10, // 每次获取消息条数
        success: function(msgs) {
          try {
            payload.success && payload.success(msgs);
            if (msgs.length) {
              const userInfo = JSON.parse(localStorage.getItem("userInfo"));
              const userId = userInfo && userInfo.userId;
              msgs.forEach(item => {
                let time = Number(item.time);
                let msg = {};
                const bySelf = item.from == userId;
                if (!item.filename) {
                  msg = {
                    chatType: payload.isGroup ? "group" : "contact",
                    chatId: bySelf ? item.to : item.from,
                    msg: item.data,
                    bySelf: bySelf,
                    time: time,
                    // name: getName(message),
                    mid: item.id,
                    status: "read"
                  };
                  if (payload.isGroup) {
                    msg.chatId = item.to;
                  } else {
                    msg.chatId = bySelf ? item.to : item.from;
                  }
                } else if (
                  !item.ext.file_length &&
                  item.filename !== "audio" &&
                  item.filename.substring(item.filename.length - 3) !== "mp4"
                ) {
                  // 为图片的情况
                  msg = {
                    msg: item.url,
                    chatType: payload.isGroup ? "group" : "contact",
                    chatId: bySelf ? item.to : item.from,
                    bySelf: bySelf,
                    type: "img",
                    // name: getName(message),
                    time: time,
                    mid: item.id,
                    status: "read"
                  };
                  if (payload.isGroup) {
                    msg.chatId = item.to;
                  } else {
                    msg.chatId = bySelf ? item.to : item.from;
                  }
                } else if (item.filename === "audio") {
                  msg = {
                    msg: item.url,
                    chatType: payload.isGroup ? "group" : "contact",
                    chatId: bySelf ? item.to : item.from,
                    bySelf: bySelf,
                    // name: getName(message),
                    type: "audio"
                  };
                  if (payload.isGroup) {
                    msg.chatId = item.to;
                  } else {
                    msg.chatId = bySelf ? item.to : item.from;
                  }
                } else if (
                  item.filename.substring(item.filename.length - 3) === "mp4"
                ) {
                  msg = {
                    msg: item.url,
                    chatType: payload.isGroup ? "group" : "contact",
                    chatId: bySelf ? item.to : item.from,
                    bySelf: bySelf,
                    // name: getName(message),
                    type: "video"
                  };
                  if (payload.isGroup) {
                    msg.chatId = item.to;
                  } else {
                    msg.chatId = bySelf ? item.to : item.from;
                  }
                } else {
                  msg = {
                    msg: item.url,
                    chatType: payload.isGroup ? "group" : "contact",
                    chatId: bySelf ? item.to : item.from,
                    bySelf: bySelf,
                    type: "file",
                    filename: item.filename,
                    file_length: item.file_length,
                    time: time,
                    mid: item.id,
                    // name: getName(message),
                    status: "read"
                  };
                  if (payload.isGroup) {
                    msg.chatId = item.to;
                  } else {
                    msg.chatId = bySelf ? item.to : item.from;
                  }
                }
                msg.isHistory = true;
                context.commit("updateMsgList", msg);
              });
              context.commit("updateMessageStatus", { action: "readMsgs" });
            }
          } catch (e) {
            console.log("error", e);
          }
        },
        fail: function() {}
      };
      WebIM.conn.fetchHistoryMessages(options);
    },

    recallMessage: function(context, payload) {
      const { chatType, mid } = payload.message;
      const to = payload.to;
      const me = this;
      const chatTypeObj = {
        contact: "chat",
        group: "groupchat",
        chatroom: "chatroom"
      };
      const option = {
        mid,
        to,
        type: chatTypeObj[chatType],
        success: function() {
          payload.message.status = "recall";
          payload.message.msg = "消息已撤回";
          Vue.$store.commit("updateMessageStatus", payload.message);
        },
        fail: function() {
          // me.$message('消息撤回失败');
        }
      };
      WebIM.conn.recallMessage(option);
    }
  },
  getters: {
    onGetContactUserList(state) {
      console.log(state.userList.contactUserList, "wu");
      return state.userList.contactUserList;
    },
    onGetGroupUserList(state) {
      return state.userList.groupUserList;
    },
    onGetChatroomUserList(state) {
      return state.userList.chatroomUserList;
    },
    onGetCurrentChatObjMsg(state) {
      return state.currentMsgs;
    },
    fetchHistoryMessages(state) {
      return state.currentMsgs;
    }
  }
};
export default Chat;
