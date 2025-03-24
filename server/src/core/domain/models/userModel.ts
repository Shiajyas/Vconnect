import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "../interfaces/IUser";

const userSchema = new Schema<IUser>(
  {
    fullname: { type: String, required: true, trim: true, maxlength: 25 },
    username: { type: String, required: true, trim: true, maxlength: 25, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    avatar: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png",
    },


    role: { type: String, enum: ["admin", "proUser", "user"], default: "user" },
    subscription: {
      isActive: { type: Boolean, default: false },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },

    bio: {type: String, default:""},
    gender: { type: String, default: "male" },
    mobile: { type: String, default: "" },
    address: { type: String, default: "" },
    saved: [{ type: mongoose.Types.ObjectId, ref: "post" }],
    story: { type: String, default: "", maxlength: 200 },
    website: { type: String, default: "" },
    followers: [{ type: mongoose.Types.ObjectId, ref: "user" }], // Followers array
    following: [{ type: mongoose.Types.ObjectId, ref: "user" }], // Following array
    isBlocked: { type: Boolean, default: false },
  },



  {
    timestamps: true,
  }
);

// 🔹 Fetch followers of a user
userSchema.statics.findFollowers = async function (userId: string) {
  return await this.find({ following: userId }).select("username fullname avatar");
};

// 🔹 Fetch users the user is following
userSchema.statics.findFollowing = async function (userId: string) {
  return await this.find({ followers: userId }).select("username fullname avatar");
};

// 🔹 Function to block a user
userSchema.methods.block = function () {
  this.isBlocked = true;
  return this.save();
};

// 🔹 Function to unblock a user
userSchema.methods.unblock = function () {
  this.isBlocked = false;
  return this.save();
};

const User: Model<IUser> = mongoose.model<IUser>("user", userSchema);

export default User;
