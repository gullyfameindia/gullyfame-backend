const Chat = require("../models/Chat");
const ChatArchive = require("../models/ChatArchive");
const mongoose = require("mongoose");

module.exports = () => {
  const getChatList = async (userId, view = "all") => {
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const archivedChatterIds = (
      await ChatArchive.find({ user: objectUserId }).select("chatter").lean()
    ).map((a) => a.chatter);

    const chatlist = await Chat.aggregate([
      {
        $match: {
          $or: [{ sender_id: objectUserId }, { receiver_id: objectUserId }],
          deleted_for: { $ne: objectUserId },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender_id", objectUserId] },
              "$receiver_id",
              "$sender_id",
            ],
          },
          latest_message: { $first: "$message" },
          last_message_time: { $first: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          chatter_user_id: "$_id",
          latest_message: 1,
          last_message_time: 1,
        },
      },
      {
        $sort: { last_message_time: -1 },
      },
    ]);

    const archivedSet = new Set(archivedChatterIds.map((id) => id.toString()));
    const withArchiveFlag = chatlist.map((c) => ({
      ...c,
      archived: archivedSet.has(c.chatter_user_id.toString()),
    }));

    if (view === "archived") {
      return withArchiveFlag.filter((c) => c.archived);
    }
    return withArchiveFlag.filter((c) => !c.archived);
  };

  const setArchived = async (userId, chatterId, archived) => {
    if (archived) {
      await ChatArchive.updateOne(
        { user: userId, chatter: chatterId },
        { user: userId, chatter: chatterId },
        { upsert: true },
      );
    } else {
      await ChatArchive.deleteOne({ user: userId, chatter: chatterId });
    }
    return { chatterId, archived };
  };

  const getChatDetails = async (userId, chatterId, page, limit) => {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const objectChatterId = new mongoose.Types.ObjectId(chatterId);

    const query = {
      $or: [
        { sender_id: objectUserId, receiver_id: objectChatterId },
        { sender_id: objectChatterId, receiver_id: objectUserId },
      ],
      deleted_for: { $ne: objectUserId },
    };

    const totalMessageCount = await Chat.countDocuments(query);
    const skip = (page - 1) * limit;

    const messages = await Chat.find(query)
      .select(
        "_id sender_id receiver_id message createdAt updatedAt is_deleted is_forwarded reply_to reactions read_at",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // For deleted messages, mask the content
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      message: msg.is_deleted ? "" : msg.message,
      updatedAt:
        msg.updatedAt && msg.updatedAt.getTime() !== msg.createdAt.getTime()
          ? msg.updatedAt
          : null,
    }));

    return { totalMessageCount, messages: formattedMessages };
  };

  const sendMessage = async (data) => {
    const chat = await Chat.create(data);
    return chat.toObject();
  };

  const toggleReaction = async (messageId, userId, emoji) => {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const objectMessageId = new mongoose.Types.ObjectId(messageId);

    const message = await Chat.findById(objectMessageId);
    if (!message) return null;

    // Check if user already has this emoji reaction
    const existingIndex = message.reactions.findIndex(
      (r) =>
        r.user_id.toString() === objectUserId.toString() && r.emoji === emoji,
    );

    if (existingIndex > -1) {
      // Remove the reaction
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add the reaction
      message.reactions.push({ user_id: objectUserId, emoji });
    }

    await message.save();

    return {
      messageId,
      reactions: message.reactions,
    };
  };

  const deleteMessages = async (messageIds, userId, deleteType) => {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const objectIds = messageIds.map((id) => new mongoose.Types.ObjectId(id));

    if (deleteType === "for_everyone") {
      // Verify all messages belong to the authenticated user
      const messages = await Chat.find({ _id: { $in: objectIds } }).lean();

      for (const msg of messages) {
        if (msg.sender_id.toString() !== objectUserId.toString()) {
          throw new Error("You can only delete your own messages for everyone");
        }
        // Check if any message has been read - read messages can't be deleted for everyone
        if (msg.isRead || msg.read_at) {
          throw new Error("Read messages cannot be deleted for everyone");
        }
      }

      await Chat.updateMany(
        { _id: { $in: objectIds } },
        { $set: { is_deleted: true, message: "" } },
      );
    } else if (deleteType === "for_me") {
      // Add user to deleted_for array
      await Chat.updateMany(
        { _id: { $in: objectIds } },
        { $addToSet: { deleted_for: objectUserId } },
      );
    }
  };

  const markAsRead = async (receiverId, senderId) => {
    const objectReceiverId = new mongoose.Types.ObjectId(receiverId);
    const objectSenderId = new mongoose.Types.ObjectId(senderId);

    const now = new Date();

    await Chat.updateMany(
      {
        sender_id: objectSenderId,
        receiver_id: objectReceiverId,
        isRead: false,
      },
      {
        $set: { isRead: true, read_at: now },
      },
    );

    return { read_at: now };
  };

  return {
    getChatList,
    setArchived,
    getChatDetails,
    sendMessage,
    toggleReaction,
    deleteMessages,
    markAsRead,
  };
};
