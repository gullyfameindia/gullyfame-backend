const chatRouter = require("express").Router();
const ChatController = require("../controllers/ChatController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * GET /chat/chatlist - Get list of chats for the authenticated user
 */
chatRouter.get(
  "/chatlist",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().chatList),
  ResponseMiddleware,
);

/**
 * POST /chat/archive - Archive/unarchive a conversation for the caller
 * Body: chatterId, archived (bool, default true)
 */
chatRouter.post(
  "/archive",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().archiveToggle),
  ResponseMiddleware,
);

/**
 * GET /chat/chatDetails - Get 1-on-1 chat messages with pagination
 * Query params: chatterId, page, limit
 */
chatRouter.get(
  "/chatDetails",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().chatDetails),
  ResponseMiddleware,
);

/**
 * POST /chat/sendChat - Send a new message
 * Body: receiver_id, message, reply_to (optional), is_forwarded (optional)
 */
chatRouter.post(
  "/sendChat",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().sendChat),
  ResponseMiddleware,
);

/**
 * POST /chat/message/:messageId/react - Toggle reaction on a message
 * Body: emoji
 */
chatRouter.post(
  "/message/:messageId/react",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().toggleReact),
  ResponseMiddleware,
);

/**
 * POST /chat/message/delete - Delete messages (for_me or for_everyone)
 * Body: message_ids, delete_type
 */
chatRouter.post(
  "/message/delete",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().deleteMessage),
  ResponseMiddleware,
);

/**
 * PUT /chat/read - Mark messages as read
 * Body: sender_id
 */
chatRouter.put(
  "/read",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ChatController().markAsRead),
  ResponseMiddleware,
);

module.exports = chatRouter;
