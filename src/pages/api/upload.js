import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({
    uploadDir: "./public/uploads",
    keepExtensions: true,
  });

  if (!fs.existsSync("./public/uploads")) {
    fs.mkdirSync("./public/uploads", { recursive: true });
  }

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "Upload error" });
    }

    const uploadedFile = files.file;
    const filename = uploadedFile[0]?.newFilename || "unknown";

    return res.status(200).json({
      message: "File uploaded successfully",
      filename: filename,
    });
  });
}
