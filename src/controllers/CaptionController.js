const openaiService = require("../util/openai");

module.exports = () => {
  const generateCaption = async (req, res, next) => {
    console.log("CaptionController => generateCaption");
    const { videoUrl } = req.body;

    let buffer, fileName, mimetype;

    if (req.files && req.files.media) {
      const file = req.files.media;
      buffer = file.data;
      fileName = file.name;
      mimetype = file.mimetype;
    } else if (videoUrl) {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        req.rCode = 0;
        req.msg = "video_fetch_failed";
        return next();
      }
      buffer = Buffer.from(await response.arrayBuffer());
      fileName = videoUrl.split("/").pop() || "media.mp4";
      mimetype = response.headers.get("content-type") || "video/mp4";
    } else {
      req.rCode = 0;
      req.msg = "media_required";
      return next();
    }

    const caption = await openaiService.transcribeMedia({
      buffer,
      fileName,
      mimetype,
    });

    req.rData = { caption };
    req.msg = "success";
    next();
  };

  return { generateCaption };
};
