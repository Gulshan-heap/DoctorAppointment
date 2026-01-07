import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import {v2 as cloudinary} from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import razorpay from 'razorpay'

// API  to register user
const registerUser = async (req, res)=>{
    try {
        
        const {name,email,password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({success:false,message: "All fields are required"});
        }

        if(!validator.isEmail(email)){
            return res.status(400).json({success:false,message: "Invalid email address"});
        }

        if(password.length < 8){
            return res.status(400).json({success:false,message: "Password must be at least 8 characters long"});
        }

        // hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        // save userData to database
        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);

        res.status(200).json({success:true, message: "Registration successful", token});

    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message: error.message});
        
    }
}

// Api for user login
const loginUser = async (req, res)=>{
    try {

        const {email,password} = req.body;
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(400).json({success:false,message: "User does not exist"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(isMatch){
            const token = jwt.sign({id:user._id}, process.env.JWT_SECRET);
            return res.status(200).json({success:true, message: "Login successful", token});
        }
        else{
            return res.status(400).json({success:false,message: "Invalid credentials"});
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message: error.message});
    }
}

// Api to get user profile data
const getProfile = async (req,res)=>{
    try {
        
        const userId = req.userId
        const userData = await userModel.findById(userId).select('-password')

        return res.status(200).json({success:true,userData})
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({success:false,message:error.message})
    }
}

// api to update user profile data
const updateProfile = async (req,res)=>{
    try {

        const {userId,name,phone,address,dob,gender} = req.body
        const imageFile = req.file

        if(!name || !phone|| !dob || !gender){
            return res.status(400).json({success:false,message: "Name, Phone, DOB and Gender are required"});
        }

        await userModel.findByIdAndUpdate(userId,{
            name,
            phone,
            address:JSON.parse(address),
            dob,
            gender
        })

        if(imageFile){
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})

            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{
                image:imageURL
            })
        }

        return res.status(200).json({success:true,message:"Profile updated successfully"})

    } catch (error) {
        console.log(error)
        return res.status(500).json({success:false,message:error.message})
    }
}

// api to book appointment
const bookAppointment = async (req,res)=>{
  try {
    const {  docId, slotDate, slotTime } = req.body

    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ success:false, message:"Unauthorized" })
    }

    const docData = await doctorModel.findById(docId).select('-password')

    if (!docData) {
      return res.status(404).json({ success:false, message:"Doctor not found" })
    }

    if (docData.available === false) {
      return res.status(400).json({ success:false, message:"Doctor is not available" })
    }

    let slots_booked = docData.slots_booked || {}

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.status(400).json({ success:false, message:"Slot not available" })
      }
      slots_booked[slotDate].push(slotTime)
    } else {
      slots_booked[slotDate] = [slotTime]
    }

    const userData = await userModel.findById(userId).select('-password')

    const docObj = docData.toObject()
    delete docObj.slots_booked

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: docObj,
      slotDate,
      slotTime,
      amount: docData.fees,
      date: Date.now()
    }

    const newAppointment = new appointmentModel(appointmentData)
    await newAppointment.save()

    await doctorModel.findByIdAndUpdate(docId,{
      slots_booked
    })

    return res.status(200).json({
      success:true,
      message:"Appointment booked successfully"
    })

  } catch (error) {
    console.log("BOOK APPOINTMENT ERROR:", error)
    return res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

// api to get user appointment for my appointments page
const listAppointments = async (req,res)=>{
  try {
    
    const userId = req.userId
    const appointments = await appointmentModel.find({userId})

    return res.status(200).json({success:true,appointments})

  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false,message:error.message})
  }
}

//api to cancel appointment
const cancelAppointment = async(req,res)=>{
  try {

    const {userId, appointmentId} = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    // verify appointment user
    if(appointmentData.userId !== userId){
      return res.status(403).json({success:false,message:"Unauthorized"})
    }

    await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

    // free up the slot in doctor model
    const {docId,slotDate,slotTime} = appointmentData

    const doctorData = await doctorModel.findById(docId)

    let slots_booked = doctorData.slots_booked

    slots_booked[slotDate]= slots_booked[slotDate].filter(e=>e!==slotTime)

    await doctorModel.findByIdAndUpdate(docId,{slots_booked})

    return res.status(201).json({success:true,message:'Appointment cancelled'})
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false,message:error.message})
  }
}

const razorpayInstance = new razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_KEY_SECRET
})

// api to make payment of appointment using razorpay
const paymentRazorpay = async (req,res)=>{

  try {
    const {appointmentId} = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if(!appointmentData || appointmentData.cancelled){
      return res.json({success:false,message:"Appointment cancelled or not found"})
    }

    // creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,//can change 1 to 100 as well
      currency:process.env.CURRENCY,
      receipt:appointmentId,
    }

    // creation of an order
    const order = await razorpayInstance.orders.create(options)

    return res.status(200).json({success:true,order})



  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false,message:error.message})
  }
  
}

// API to verify payment of razorpay
const verifyRazorpay = async(req,res)=>{
  try {

    const {razorpay_order_id} = req.body
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    if(orderInfo.status === 'paid'){
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})

      return res.json({success:true,message:"Payment Successful"})
    }
    else{
      return res.json({success:false,message:"Payment failed"})
    }
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({success:false,message:error.message})
  }
}

export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointments,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay
}