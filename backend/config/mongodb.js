import mongoose from "mongoose";

const connectDB = async ()=>{

    mongoose.connection.on('connected', ()=> console.log("Database Connected"))

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`)
    } catch (error) {
        console.error("MongoDB connection failed - check MONGODB_URI and that the Atlas cluster is running:", error.message)
        process.exit(1)
    }
}

export default connectDB


/*
const connect = async()=>{
    mongoose.connection.on('connected',()=>console.log("yahooo!!!"))

    await mongoose.connect()
    }
*/