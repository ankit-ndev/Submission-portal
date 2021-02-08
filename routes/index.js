let EntityCtrl = require("../controller");
const multer = require('multer');
const isImage = require('is-image');
const nconf = require("nconf");
const path = require('path');
const fs = require('fs');
const ObjectId = require("mongodb").ObjectId;

function middleware(request) {
    const params = request.params;
    request.entity = params.entity;
    if (params.command) request.command = params.command;
    if (params.entity_id) request.entity_id = params.entity_id;
    request.executeHook = true;
    if (request.body) request.data = request.body;
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (isImage(file.originalname)) {
            cb(null, `${__dirname}/../storage/images`);
        } else cb(null, `${__dirname}/../storage/files`);
    },
    filename: function (req, file, cb) {
        let { _id } = req.session.user;
        if (typeof _id === "undefined") _id = ObjectId();
        const name = `${_id}-${new Date().getTime()}${path.extname(file.originalname)}`;
        cb(null, name);
    }
});

const maxSize = 1024 * 1024 * 10; // 10 MB file size supported 

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if(ext !== '.pdf') { // only pdf allowed
            return callback(new Error('Only PDF are allowed'))
        }
        callback(null, true)
    },
    limits: { fileSize: maxSize }
}).single('file');

module.exports = parent => {
    parent.use((req, res, callback) => {
        let user = req.session.user;
        if (!user) user = {
            isLoggedIn: false,
            role: "public"
        };
        req.session.user = user;
        callback();
    });

    parent.post("/api/1/uploads", (req, res) => {
        upload(req, res, (err) => {
            if (err) return res.status(406).send({ status: 406, error: err.toString() });
            try {
                let url = `${nconf.get("url")}`;
                const filename = req.file.filename;
                if (isImage(filename)) url += "/images";
                else url += "/files";
                url += `/${filename}`;

                res.status(201).send({ status: 201, url })
            } catch (e) {
                res.status(406).send({ status: 406, error: "Invalid Image" });
            }
        })
    });

    parent.post("/api/1/delete", (req, res) => {
        const { role } = req.session.user;
        if (role === "public") return res.status(401).json({ status: 401, error: "Unauthorized" });
        if (!req.body.file) {
            return res.status(406).json({ status: 401, error: "Required Parameters Missing" });
        }
        const { file } = req.body;
        const filename = file.split(nconf.get('url'));

        fs.stat(`${__dirname}/../storage/${filename[1]}`, function (err, stats) {
            if (err) {
                return res.status(500).json({status: 500, error: "Cannot delete file at the moment"});
            }
            fs.unlink(`${__dirname}/../storage/${filename[1]}`,function(err){
                 if(err){
                    return res.status(500).json({status: 500, error: "Cannot delete file at the moment"});
                 }
                 res.status(200).json({ status: 200, "message": "File deleted sucessfully" });
            });

        });
    });

    parent.get("/api/1/entity/:entity", async (req, res) => {
        middleware(req);
        const response = await new EntityCtrl().list(req);
        res.status(200).json(response);
    });

    parent.get("/api/1/entity/:entity/:entity_id", async (req, res) => {
        middleware(req);
        const response = await new EntityCtrl().get(req);
        res.status(200).json(response);
    });

    parent.post("/api/1/entity/:entity", async (req, res) => {
        middleware(req);
        const response = await new EntityCtrl().add(req);
        res.status(200).json(response);
    });

    parent.put("/api/1/entity/:entity/:entity_id", async (req, res) => {
        middleware(req);
        const response = await new EntityCtrl().edit(req);
        res.status(200).json(response);
    });

    parent.delete("/api/1/entity/:entity/:entity_id", async (req, res) => {
        middleware(req);
        const response = await new EntityCtrl().delete(req);
        res.status(200).json(response);
    });

    parent.all("/api/1/entity/:entity/_/:command", async (req, res) => {
        middleware(req);
        const response = await new EntityCtrl().customCommand(req);
        res.status(200).json(response);
    });

    parent.use((req, res)=> {
        res.sendFile(path.join(__dirname, "/../build/index.html"));
    });
};
