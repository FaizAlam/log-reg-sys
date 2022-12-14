const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    id:{
        type:mongoose.ObjectId
    },
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        required:true
    },
    password :{
        type:String,
        required:true
    },
    reset_token:{
        type:String,
        required:true
    },
    isVerified:{
        type:Boolean,
        required:true
    },
    verification_token:{
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model("users",userSchema)