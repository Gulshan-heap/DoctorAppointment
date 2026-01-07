import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";
// backend\models\appointmentModel.js

const authDoctor = async (req, res, next) => {
  try {
    const {dtoken} = req.headers 

    if (!dtoken) {
      return res.status(401).json({
        success: false,
        message: 'Not Authorized. Login Again'
      })
    }

    const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)

    console.log("req.body:", req.body);
    console.log("req.doctor:", req.doctor);



    req.doctor = {
      docId: token_decode.id,
    };

    next()

  } catch (error) {
    console.error(error)
    return res.status(401).json({
      success: false,
      message: error.message
    })
  }
}

export default authDoctor
