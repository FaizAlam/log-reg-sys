if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const express = require('express')
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const users = require("./models/user")
const session = require("express-session")
const bcrypt = require("bcrypt");
const user = require('./models/user')
const nodemailer = require("nodemailer")
const {google} = require("googleapis")

const app = express()
const port = process.env.PORT ||5000
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(session({
  secret:"secret key",
  resave:false,
  saveUninitialized:false,
  
}))


mainURL = "https://log-reg-sys.herokuapp.com/"

//Database
mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true,useUnifiedTopology:true})
const db = mongoose.connection
db.on('error',error=>console.error(error))
db.once('open',()=>console.log("database connected"))

//Setup nodemailer
/*
const nodemailerFrom = "loggskey1@gmail.com"
const nodemailerObject = {
  service: "gmail",
  host:"smtp.gmail.com",
  port:465,
  secure:true,
  auth:{
    user:"loggkey1@gmail.com",
    pass: process.env.nodemailer_pass
  }
}

*/
// setup mail oauth

const client_secret = process.env.client_secret
const client_id = process.env.client_id
const redirect_uris = process.env.redirect_uris
const oAuth2Client = new google.auth.OAuth2(client_id,client_secret,redirect_uris);
oAuth2Client.setCredentials({refresh_token:process.env.Refresh_token})


app.use(function(req,res,next){
  req.mainURL = mainURL
  req.isLogin = (typeof req.session.user !== "undefined")
  req.user = req.session.user

  next()
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post("/register1", (req,res)=>{
  console.log("cryy baby")
})

app.post("/register",async (req,res)=>{
  console.log("inside register func")
  const name = req.body.name
  const email = req.body.email
  const password = req.body.password
  const reset_token = " "
  const isVerified = false
  const verification_token = new Date().getTime()

  console.log(email)

  const alread_user = await users.findOne({"email":email})
  if(alread_user!=null){
    console.log("already a user")
    res.json("Already a user")
  }else{
    bcrypt.hash(password,10,async(err,hash)=>{
      await user.create({
        "name":name,
        "email":email,
        "password":hash,
        "reset_token":reset_token,
        "isVerified":isVerified,
        "verification_token":verification_token
      },
      
      async(err,data)=>{
        console.log("calling mailer function")
        const accessToken = await oAuth2Client.getAccessToken()
        const  transporter = nodemailer.createTransport({
          service:"gmail",
          host:"smtp.gmail.com",
          port:465,
          secure:true,
          auth:{
              type:'OAuth2',
              user:'loggskey1@gmail.com',
              clientId : client_id,
              clientSecret : client_secret,
              refreshToken : process.env.Refresh_token,
              accessToken : accessToken
      
          }
      });
      console.log("smtp setup finished")
        var text = "Please verify your account by clicking the following link "+ mainURL + "/verifyEmail/" +email+"/"+verification_token;
        
        var html = "Please verify your account by clicking the following link :<br><br><a href= '+ mainURL +email+"/"+verification_token'>Confirm Email</a> ";

        await transporter.sendMail({
          from:'Mailer <loggskey1@gmail.com>',
          to:email,
          subject:"Email Verification",
          text:text,
          html:html,
        }, function(err,info){
          if(err){
            console.log(err)
          }else{
            console.log('Email Sent: '+info.response)
          }
        })
        res.status(200).send("verify your account(check spam folder too)")
      }

      )
    })
  }
})

app.get('/verifyEmail/:email/:verification_token', async (req,res)=>{
        
  const email = req.params.email
  const verification_token = req.params.verification_token

  const user = await users.findOne({
      $and :[{
          "email":email,
      },{
          "verification_token":parseInt(verification_token)
      }]
  });

  if(user ==null){
      res.status(500).send("Email doesn't exist")
  }else{
      await users.findOneAndUpdate({
          $and:[{
              "email":email,
          },{
              "verification_token":parseInt(verification_token)
          }]
      },{
          $set:{
              "verification_token":"",
              "isVerified":true
          }
      })
      
      res.send("User Verified");
  }
})

app.post("/login", async (req,res)=>{
  const email = req.body.email
  const password = req.body.password
  
  const user = await users.findOne({"email":email})
  //console.log(email)
  //console.log(user)
  if(user == null){

      res.status(500).send("Email not found")
      return false
  }
  bcrypt.compare(password,user.password,(err,isVerify)=>{
      if(isVerify){
          if(user.isVerified){
              req.session.user = user
              res.send("Logged In")
              //console.log(req)
              return false
          }
          res.send("Email not verified")
          return false
      }
          
          
          res.send("Incorrect Password")
  })
})


app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})