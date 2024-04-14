const { MongoClient } = require('mongodb')

let dbconnection

module.exports.dbConnect = (cb) =>{
    MongoClient.connect('mongodb://127.0.0.1:27017/Blogs')
        .then((client) =>{
            dbconnection = client.db()
            return cb()
        })
        .catch((err) =>{
            console.log("Error Connection : " + err)
            return cb(err)
        })
}

module.exports.getDb = () => dbconnection
