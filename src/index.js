import dotenv from 'dotenv';
dotenv.config();
import mongoose from "mongoose";
import connectDB from "./db/db.index.js";
import { app } from './app.js';


connectDB()
.then(()=>{
    console.log("Connection successful")
    app.on("error", (error)=>{
        console.log("app cannot talk to db, but db is connected")
        throw error
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`app is listening on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONgo connection failed", err)
})



















































// DB is in another continent
// use try catch and async await
/*
(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("app cannot talk to db, but db is connected")
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log(error)
        throw error
    }
})
    */