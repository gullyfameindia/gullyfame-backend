const ChatService = require("../services/ChatService");
const socket = require("../util/socket");

module.exports = () => {
  const chatList = async (req, res, next) => {
    console.log("ChatController => chatList");
    const { userId } = req.body;
    const view = req.query.view === "archived" ? "archived" : "all";

    const chatlist = await ChatService().getChatList(userId, view);

    req.rData = { chatlist };
    req.msg = "success";
    next();
  };

  const archiveToggle = async (req, res, next) => {
    console.log("ChatController => archiveToggle");
    const { userId, chatterId, archived } = req.body;

    if (!chatterId) {
      req.rCode = 0;
      req.msg = "chatter_id_required_for_archive";
      return next();
    }

    const data = await ChatService().setArchived(
      userId,
      chatterId,
      archived !== false,
    );

    req.rData = data;
    req.msg = "success";
    next();
  };

  const chatDetails = async (req, res, next) => {
    console.log("ChatController => chatDetails");
    const { userId } = req.body;
    const { chatterId } = req.query;
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 10;

    if (!chatterId) {
      req.rCode = 0;
      req.msg = "chatter_id_required";
      return next();
    }

    const { totalMessageCount, messages } = await ChatService().getChatDetails(
      userId,
      chatterId,
      page,
      limit,
    );

    req.rData = {
      page,
      totalMessageCount,
      limit,
      messages,
    };
    req.msg = "success";
    next();
  };

  const sendChat = async (req, res, next) => {
    console.log("ChatController => sendChat");
    const { userId, receiver_id, message, reply_to, is_forwarded } = req.body;

    if (!receiver_id || !message) {
      req.rCode = 0;
      req.msg = "receiver_and_message_required";
      return next();
    }

    const chatData = {
      sender_id: userId,
      receiver_id,
      message,
      reply_to: reply_to || null,
      is_forwarded: is_forwarded || false,
    };

    const savedMessage = await ChatService().sendMessage(chatData);

    const messagePayload = {
      _id: savedMessage._id,
      sender_id: savedMessage.sender_id,
      receiver_id: savedMessage.receiver_id,
      message: savedMessage.message,
      createdAt: savedMessage.createdAt,
      updatedAt: null,
      is_deleted: false,
      is_forwarded: savedMessage.is_forwarded,
      reply_to: savedMessage.reply_to,
      reactions: [],
      is_read: false,
      read_at: null,
    };

    socket.emitToUser(receiver_id, "new_message", messagePayload);

    req.rData = { message: messagePayload };
    req.msg = "success";
    next();
  };

  const toggleReact = async (req, res, next) => {
    console.log("ChatController => toggleReact");
    const { userId, emoji } = req.body;
    const { messageId } = req.params;

    if (!messageId || !emoji) {
      req.rCode = 0;
      req.msg = "message_id_and_emoji_required";
      return next();
    }

    const data = await ChatService().toggleReaction(messageId, userId, emoji);

    if (!data) {
      req.rCode = 5;
      req.msg = "message_not_found";
      return next();
    }

    req.rData = data;
    req.msg = "success";
    next();
  };

  const deleteMessage = async (req, res, next) => {
    console.log("ChatController => deleteMessage");
    const { userId, message_ids, delete_type } = req.body;

    if (
      !message_ids ||
      !Array.isArray(message_ids) ||
      message_ids.length === 0
    ) {
      req.rCode = 0;
      req.msg = "message_ids_required";
      return next();
    }

    const validTypes = ["for_me", "for_everyone"];
    if (!delete_type || !validTypes.includes(delete_type)) {
      req.rCode = 0;
      req.msg = "invalid_delete_type";
      return next();
    }

    await ChatService().deleteMessages(message_ids, userId, delete_type);

    req.rData = null;
    req.msg = "success";
    next();
  };

  const markAsRead = async (req, res, next) => {
    console.log("ChatController => markAsRead");
    const { userId, sender_id } = req.body;

    if (!sender_id) {
      req.rCode = 0;
      req.msg = "sender_id_required";
      return next();
    }

    const data = await ChatService().markAsRead(userId, sender_id);

    req.rData = data;
    req.msg = "success";
    next();
  };

  return {
    chatList,
    archiveToggle,
    chatDetails,
    sendChat,
    toggleReact,
    deleteMessage,
    markAsRead,
  };
};
