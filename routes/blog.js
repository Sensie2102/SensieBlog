const express = require('express')
const router = express.Router()
const path = require('path')
const blgs = require('../data/blogs.js')

router.get("/", (req,res) => {
    res.render('home')
})

router.get("/blog", (req,res) => {
    res.render('BlogHome',{
        blog: blgs
    })
})

router.get("/blog/:slug", (req,res) => {
    myBlog = blgs.filter((e)=>{
        return e.slug == req.params.slug
    })
    res.render('eachBlog',{
        title: myBlog[0].name,
        author: myBlog[0].author,
        content: myBlog[0].content
    })
})


module.exports = router