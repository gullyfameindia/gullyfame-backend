module.exports = (lang = "en") => {
  const user_already_found = {
    en: "User already found with given username, Try again after new username!",
  };

  const success = {
    en: "success",
  };

  const logout = {
    en: "logout successfully",
  };

  const invalid_token = {
    en: "invalid token",
  };

  const users_list = {
    en: "users list",
  };

  const social_id_missing = {
    en: "social Provider id is missing!",
  };

  const interest_exists = {
    en: "you have added this interest before",
  };

  const user_not_found = {
    en: "user detail not found with given id",
  };

  const forbidden = {
    en: "forbidden",
  };

  const otp_sent = {
    en: "otp send to your register mobile number",
  };

  const otp_verified = {
    en: "login successfully",
  };

  const incorrect_otp = {
    en: "incorrect otp, try again!",
  };

  const status_changed = {
    en: "status changed successfully",
  };

  const password_changed = {
    en: "Password updated successfully. Please login with new password!",
  };

  const incorrect_password = {
    en: "Entered password is incorrect!",
  };

  const invalid_credentials = {
    en: "invalid credentials!",
  };

  return {
    user_already_found: user_already_found[lang],
    success: success[lang],
    logout: logout[lang],
    invalid_token: invalid_token[lang],
    users_list: users_list[lang],
    user_not_found: user_not_found[lang],
    forbidden: forbidden[lang],
    otp_sent: otp_sent[lang],
    otp_verified: otp_verified[lang],
    incorrect_otp: incorrect_otp[lang],
    status_changed: status_changed[lang],
    interest_exists: interest_exists[lang],
    social_id_missing: social_id_missing[lang],
    password_changed: password_changed[lang],
    incorrect_password: incorrect_password[lang],
    invalid_credentials: invalid_credentials[lang],
    category_created: "Category created successfully",
    category_deleted: "Category deleted successfully",
    chatter_id_required: "Chatter user ID is required",
    competition_id_required: "Competition ID is required",
    competition_not_found: "Competition not found",
    reel_id_required: "Reel ID is required",
    reel_not_found: "Reel not found",
    invalid_action_type:
      "Invalid action type. Must be one of: vote, like, save",
    invalid_search_type:
      "Invalid search type. Must be one of: all, users, competitions, reels",
    receiver_and_message_required: "Receiver ID and message are required",
    message_id_and_emoji_required: "Message ID and emoji are required",
    message_not_found: "Message not found",
    message_ids_required: "Message IDs array is required",
    invalid_delete_type:
      "Invalid delete type. Must be one of: for_me, for_everyone",
    sender_id_required: "Sender ID is required",
    file_name_and_type_required: "fileName and fileType are required",
    reel_published: "Reel published successfully",
    video_url_required: "video_url is required",
    reel_draft_not_found: "Draft reel not found",
    draft_saved: "Draft saved successfully",
    competition_joined: "Competition joined successfully",
    competition_not_joinable: "This competition is not open for joining",
    already_joined: "You have already joined this competition",
    kyc_fields_required: "docType and frontImage are required",
    kyc_submitted: "KYC submitted successfully",
    kyc_not_found: "KYC record not found",
    invalid_kyc_status: "status must be either APPROVED or REJECTED",
    kyc_updated: "KYC status updated successfully",
    audio_not_found: "Audio not found",
    audio_file_required: "audio file is required",
    audio_created: "Audio added successfully",
    audio_deleted: "Audio deleted successfully",
    filter_asset_required: "asset file is required",
    filter_created: "Filter added successfully",
    filter_deleted: "Filter deleted successfully",
    sticker_image_required: "image file is required",
    sticker_created: "Sticker added successfully",
    sticker_deleted: "Sticker deleted successfully",
    media_required: "Provide either a media file or a videoUrl",
    video_fetch_failed: "Could not fetch the provided videoUrl",
    comment_text_required: "text is required",
    comment_added: "Comment added successfully",
    comment_not_found: "Comment not found",
    comment_deleted: "Comment deleted successfully",
    cannot_follow_self: "You cannot follow yourself",
    follow_toggled: "Follow status updated",
    wallet_recharged: "Wallet recharged successfully",
    ac_deactivated: "Your account has been deactivated, please contact support",
    otp_resent: "otp resent to your registered mobile number",
    reset_otp_sent: "Password reset code sent to your email",
    reset_otp_verified: "Code verified, you can now set a new password",
    no_email_on_account: "No email is linked to this account, so the reset code can't be sent",
    reset_email_failed: "Could not send the reset email, please try again",
    mail_not_configured: "Email service is not available right now",
    password_too_short: "Password must be at least 6 characters",
    reset_token_invalid: "Reset link has expired, please request a new code",
    otp_expired: "OTP has expired, please request a new one",
    otp_too_many_attempts: "Too many incorrect attempts, please request a new OTP",
    otp_resend_too_soon: "Please wait a few seconds before requesting another OTP",
    otp_send_failed: "Could not send OTP, please check the number and try again",
    otp_service_unavailable: "OTP service is not available right now",
    otp_email_not_supported: "OTP login is only available with a mobile number",
    payment_order_created: "Payment order created",
    razorpay_not_configured: "Payments are not configured on this server",
    invalid_recharge_amount: "amount must be a whole number within the allowed recharge range",
    payment_details_required:
      "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
    payment_order_not_found: "Payment order not found",
    invalid_payment_signature: "Payment verification failed",
    payment_order_mismatch: "Payment does not belong to this order",
    payment_amount_mismatch: "Payment amount does not match the order",
    payment_not_captured: "Payment has not been completed yet",
    tip_sent: "Tip sent successfully",
    insufficient_balance: "Insufficient wallet balance",
    invalid_amount: "amount must be a positive number",
    cannot_tip_self: "You cannot tip yourself",
    notification_not_found: "Notification not found",
    soundfx_audio_required: "audio file is required",
    soundfx_created: "Sound FX added successfully",
    soundfx_deleted: "Sound FX deleted successfully",
    chatter_id_required_for_archive: "chatterId is required",
    reel_export_queued: "Export started",
    reel_not_exportable: "Reel must have a video before it can be exported",
    ffmpeg_not_installed:
      "ffmpeg is not installed on this server — server-side export is unavailable",
    to_user_id_required: "toUserId is required",
    cannot_invite_self: "You cannot invite yourself",
  };
};
