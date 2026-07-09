const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
    process.cwd(),
    "uploads",
    "voice"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, uploadDirectory);

    },

    filename(req, file, cb) {

        const extension =
            path.extname(file.originalname) || ".webm";

        cb(
            null,
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}${extension}`
        );

    }

});

const upload = multer({

    storage,

    limits: {

        fileSize: 10 * 1024 * 1024

    }

});

module.exports = upload;