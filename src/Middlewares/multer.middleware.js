import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {    //cb => this is call back nothing
        cb(null, './public/temp')              // yaha pe ham call back me dete hai apne file ka address ki hame file kha rakhna hai 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)     // yaha pe ham bata rhe hai ki file name hai or orignal rahega yani jo pahle se file ka nam tha wo 
    }
})



export const upload = multer({
    storage: storage,
})



