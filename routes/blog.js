const express = require('express')
const router = express.Router()
// const blgs = require('../data/blogs.js')
const dbConn = require('./db')

const dbConnect = dbConn.dbConnect
const getDb = dbConn.getDb

let db

dbConnect((err) => {
    if(!err){
        console.log("Successful Connection")
    }
    db = getDb()
})

function createSlug(title) {
    return title.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-');
}

router.use(express.urlencoded({ extended: false }));

router.get("/", (req,res) => {
    res.render('home')
})
//BlogHomePage
router.get("/blog", (req,res) => {
    let blgs = []
    db.collection('blog')
        .find()
        .sort({author : 1})
        .forEach(blg => {blgs.push(blg)})
        .then(() =>{
            res.status(200)
            res.render('BlogHome',{
                blog: blgs
            })
            console.log(blgs)
        })
        .catch(()=>{
            res.status(500)
        })
    
})
//Display a Single Blog
router.get("/blog/:slug", (req,res) => {
    db.collection('blog')
        .findOne({slug : req.params.slug})

        .then(doc =>{
            res.status(200)
            res.render('eachBlog',{
                title: doc.name,
                author : doc.author,
                content : doc.content
            })
            console.log(blgs)
        })
        .catch(()=>{
            res.status(500)
        })
})


//Add a blog
router.get("/addBlog",(req,res) =>{
    res.render('addBlog')
})

router.post('/addBlog',(req,res) =>{
    if (!req.body || !req.body.title) {
        return res.status(400).send('Title is missing in the request body');
    }
    const { title,content } = req.body;
    const currentDate = new Date().toISOString().split('T')[0];
    const author = 'Mafaaz'
    const slug = createSlug(title)
    db.collection('blog')
        .insertOne({"name" : title,"author" : author,"date" : currentDate,"content" : content,"slug" : slug})
        .then(doc =>{
            res.status(201)
            console.log("Successful Insertion")
        })
        .catch(err =>{
                res.status(500)
                console.log("Error In Insertion")
            }
        )
    console.log(title,content)
    res.redirect('/blog')
})


module.exports = router