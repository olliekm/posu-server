const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken')
const User = require('./models/user.js')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const cors = require('cors')
const user = require('./models/user.js')
const request = require('request');
const { response } = require('express')
const { links } = require('express/lib/response')

app.use(express.json())

const con = mongoose.connect('mongodb+srv://ollieadmin:ollie123@cluster0.y0pmv.mongodb.net/thesis?retryWrites=true&w=majority', {useNewUrlParser: true})
const db = mongoose.connection
db.on('error', (error) => console.log(error))
db.on('open', () => console.log("Connected"))
app.use(cors())





  app.get('/users', async (req, res) => {
    try {
      const users = await User.find()
      res.send(users)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })

  app.post('/signup', async (req, res) => {
      const badEmail = await User.find({email: req.body.email })
      const badUsername = await User.find({username: req.body.username })
      console.log(badEmail , badUsername)
      if(badEmail != "" || badUsername != ""){
        res.send("Error:11")
      } else{
        try{
          console.log(req.body.password)
          const salt = await bcrypt.genSalt(1)
          const hashedPassword = await bcrypt.hash(req.body.password, salt) 
          console.log(salt)
          console.log(hashedPassword)
          const users = new User({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email
          })
          const newUser = await users.save()
          res.send(users.username)
          //res.status(201).json(newUser)
        }catch(err){
          res.send("ERROR")
        }
      }
      
      
  })

  app.get('/', async (req, res) => {
    res.send("users")
  })
  
  
  app.get('/user/:username', async (req, res) => {
    const username = req.params.username
    const user = await User.find({username: username})
    console.log(user[0])
    if(user[0] !== undefined){
      res.json(user[0].favoriteVideos)
    } else {
      res.json({error: "cant find user"})
    }

  })

  app.get('/user/:username/:token', authenticateToken, async (req, res) => {
    let username = req.user
    username = username.toString()
    console.log(username)
    const user = await User.find({username: username})
    console.log(user[0])
    if(user[0] !== undefined){
      res.json(user[0].favoriteVideos)
    } else {
      res.json({error: "cant find user"})
    }

  })

  app.get('/posts', authenticateToken, async (req, res) => {
    let username = req.user
    username = username.toString()
    const user = await User.find({username: username})
    console.log(user)
  })

  app.post('/post-video', authenticateToken, async (req, res) => {
    let username = req.user
    username = username.toString()
    if(req.body.title !== null){
      const user = await User.updateOne({username: username},
        {
          $push: { "favoriteVideos": {
                title: req.body.title,
                rating: req.body.rating,
                link: req.body.link,
                thumb: req.body.thumbnail
            }
            }
        }
        )
      console.log(user)
      console.log(req.body)
      res.json("great")
    } else {
      console.log("no title")
    }
    
  })  

  app.post('/login', async (req, res) => {
    const user = await User.find({email: req.body.email})
    //console.log(req.body.password, req.body.email)

    if(user === null) return res.status(400).send('cannot find user')
    try {
    if(await bcrypt.compare(req.body.password, user[0].password)){
        
        console.log(user[0].email + "is logged in " + user[0].password)
        const signUser = user[0].username

        const accessToken = jwt.sign(signUser, process.env.ACCESS_TOKEN_SECRET)
        res.json({ accessToken: accessToken, username: user[0].username})

    } else{
      res.send('wrong')
      console.log("wrong")
      }
    } catch{
      res.status(500).send('error!')
    }


  })

  app.post('/delete', authenticateToken, async (req, res) => {
    let username = req.user
    username = username.toString()
    // console.log(req.body.selectedList);
    let postTitles = []
    const post = await User.find({username: username})
    let selectedPosts = req.body.selectedList
    let postIndex  = parseInt(selectedPosts)
    console.log(postIndex);
      for(let i = 0; i<selectedPosts.length; i++){
        console.log(post[0].favoriteVideos[parseInt(selectedPosts[i])].title)
        let postTitle = post[0].favoriteVideos[parseInt(selectedPosts[i])].title
        await User.updateMany({username: username}, 
          {
            $pull: {favoriteVideos: {title: {$in:[postTitle]}}}
          }
          )
        }
      

    // }
    console.log(user)
    res.json('yo')

  })

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, signUser) => {
      console.log(err)
      if (err) return res.sendStatus(403)
      req.user = signUser
      next()
    })
  }



  app.listen(process.env.PORT || 3001, () => {
    console.log("Server Started")
})