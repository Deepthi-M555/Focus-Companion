const fs = require("fs/promises");

async function deleteRecording(filePath) {

    if (!filePath) {

        return;

    }

    try {

        await fs.unlink(filePath);

    }

    catch {

        /*
            Ignore cleanup errors.
        */

    }

}

module.exports = {

    deleteRecording

};