import jwt from "jsonwebtoken"
import doctorModel from "../models/doctorModel.js"

const authDoctor = async (req, res, next) => {
  try {

    const token = req.headers.dtoken   // ✅ from frontend

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Login Again"
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const doctor = await doctorModel.findById(decoded.id).select("-password")

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Doctor not found"
      })
    }

    req.doctor = doctor    // ✅ attach doctor
    next()

  } catch (error) {
    console.log(error)
    return res.status(401).json({
      success: false,
      message: error.message
    })
  }
}

export default authDoctor
