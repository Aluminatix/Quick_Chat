import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import {v4 as uuid} from 'uuid';
import {v2 as cloudinary} from 'cloudinary';
import { getBase64, getSockets } from "../lib/helper.js";

const cookieOptions = {
    maxAge: 15*24*60*60*1000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
};

const connectDB = (uri) => {
    mongoose
    .connect(uri, {dbName: "Chatty"})
    .then((data) => {
        console.log(`Connected to DB: ${data.connection.host}`)
    })
    .catch((err) => {
        throw err;
    });
};

const sendToken = (res, user, code, message) => {
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
    // console.log(token);
    return res.status(code).cookie("chattu-token",token,cookieOptions).json({
    success: true, user,
        message,
    });
    
};

// sendToken("aha", {_id:"daiha"}, 201, "User created");


const emitEvent = (req,event,users,data) => {
    // console.log("Emit Event Call");
    const io = req.app.get("io");
    const usersSocket = getSockets(users);
    io.to(usersSocket).emit(event, data); 
    // console.log(io);
    // console.log(usersSocket);
};

const uploadFilesToCloudinary = async (files = []) => {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });
    });
  
    try {
      const results = await Promise.all(uploadPromises);
  
      const formattedResults = results.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
      return formattedResults;
    } catch (err) {
      throw new Error("Error uploading files to cloudinary", err);
    }
};

const deletFilesFromCloudinary = async (public_ids) => {
    // Delete
}


export {connectDB, sendToken, cookieOptions, emitEvent, deletFilesFromCloudinary, uploadFilesToCloudinary};