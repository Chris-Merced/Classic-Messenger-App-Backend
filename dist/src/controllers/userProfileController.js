"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = getUser;
exports.getUserPublicProfile = getUserPublicProfile;
exports.getUsersBySearch = getUsersBySearch;
exports.addFriendRequest = addFriendRequest;
exports.getFriendRequests = getFriendRequests;
exports.checkFriendRequestSent = checkFriendRequestSent;
exports.addFriend = addFriend;
exports.denyFriend = denyFriend;
exports.removeFriend = removeFriend;
exports.checkIfFriends = checkIfFriends;
exports.getFriends = getFriends;
exports.blockUser = blockUser;
exports.checkIfBlocked = checkIfBlocked;
exports.unblockUser = unblockUser;
exports.checkIfBlockedByProfile = checkIfBlockedByProfile;
exports.checkIfPublic = checkIfPublic;
exports.changeProfileStatus = changeProfileStatus;
exports.changeProfilePicture = changeProfilePicture;
exports.editAboutMe = editAboutMe;
exports.getMutualFriends = getMutualFriends;
exports.getUserIDByUsername = getUserIDByUsername;
const db = __importStar(require("../db/queries"));
const authentication = __importStar(require("../authentication"));
const file_type_1 = __importDefault(require("file-type"));
const s3Uploader_1 = __importDefault(require("../utils/s3Uploader"));
const sharp_1 = __importDefault(require("sharp"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const authentication_1 = require("../authentication");
async function getUser(req, res) {
    try {
        const sessionData = JSON.parse(req.cookies.sessionToken);
        if (sessionData.sessionID) {
            const userID = await db.getSessionBySessionID(sessionData.sessionID);
            if (!userID) {
                return res.status(401).json({ message: "Invalid session ID" });
            }
            const user = await db.getUserByUserID(userID);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const friendRequests = await db.getFriendRequests(userID);
            //keep original logic until resolved in production
            //const { password, ...userWithoutPassword } = user;
            //user already has password dissected in getFriendRequests so pass user + friendRequests
            // into new object
            const userObject = { ...user, friendRequests };
            res.status(200).json({ user: userObject });
        }
        else {
            return res.status(401).json({ message: "No SessionID Stored" });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error getting user from database: " + message);
        res
            .status(500)
            .json({ error: "Error getting user from database: " + message });
    }
}
const GetUserPublicProfileSchema = zod_1.z.object({
    ID: zod_1.z.coerce.number().min(1),
});
async function getUserPublicProfile(req, res) {
    try {
        const parsed = GetUserPublicProfileSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error parsing request object for getUserPublicProfile");
            console.log(zod_1.z.treeifyError(parsed.error));
            res.status(500).json({
                error: "Error parsing request object for user profile" +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        if (!parsed?.data?.ID) {
            console.log("No User ID Provided for Public Profile Retrieval");
            return res.status(400).json({ error: "Invalid User Profile Parameter" });
        }
        const { ID } = parsed.data;
        const userData = await db.getUserByUserID(ID);
        const { email, is_admin, ...user } = userData;
        res.status(200).json({ user: user });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error Retrieving Profile: ", message);
        res.status(500).json({ error: "Error: " + message });
    }
}
const GetUsersBySearchSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(16),
    page: zod_1.z.coerce.number().min(0),
    limit: zod_1.z.coerce.number(),
});
async function getUsersBySearch(req, res) {
    try {
        console.log(req.query.page);
        const parsed = GetUsersBySearchSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error parsing parameters in getUserBySearch");
            console.log(zod_1.z.treeifyError(parsed.error));
            console.log(zod_1.z.treeifyError(parsed.error).properties?.page?.errors);
            return res.status(400).json({
                error: "Error parsing paramters" + zod_1.z.treeifyError(parsed.error),
            });
        }
        const { page, limit, username } = parsed.data;
        /*Keep original logic until runtime is proven to work
        const page = req.query.page;
        const limit = req.query.limit;
        */
        const users = await db.getUsersByUsernameSearch(username, page, limit);
        res.status(201).json({ users: users });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.error("Error getting users during search" + message);
        res.status(404).json({
            error: "There was a problem with the username lookup: " + message,
        });
    }
}
const FriendRequestSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    profileID: zod_1.z.coerce.number().positive(),
});
async function addFriendRequest(req, res) {
    try {
        const sessionToken = req.cookies.sessionToken;
        console.log(sessionToken);
        const authenticated = await authentication.compareSessionToken(sessionToken, req.body.userID);
        if (authenticated) {
            const parsed = FriendRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                console.log("Error with parameters when adding friend request");
                console.log(zod_1.z.treeifyError(parsed.error));
                return res.status(400).json({
                    error: "Error adding friend request" + zod_1.z.treeifyError(req.body),
                });
            }
            const { userID, profileID } = parsed.data;
            /*Keep original logic intact until runtime is proven to work
            const userID = req.body.userID;
            const profileID = req.body.profileID;
            */
            const response = await db.addFriendRequestToDatabase(userID, profileID);
            res.status(200).json({ message: response });
        }
        else {
            res.status(403).json("You Do Not Have Permission To View This Data");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error adding Friend Request to Database: \n" + message);
        res.status(500).json({
            error: "There was an error adding Friend Request to Database:" + message,
        });
    }
}
async function getFriendRequests(req, res) {
    try {
        const sessionToken = req.cookies.sessionToken;
        const parsed = FriendRequestSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error in parameters while getting friend requests");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while getting friend requests" +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, profileID } = parsed.data;
        const authenticated = await authentication.compareSessionToken(sessionToken, 
        //comment preserves original logic until runtime is proven to work
        //req.query.userID
        userID);
        if (authenticated) {
            //comment preserves original logic until runtime is proven to work
            //const userID = req.query.userID;
            const data = await db.getFriendRequests(userID);
            res.status(200).json({ friendRequests: data });
        }
        else {
            res.status(403).json("You Do Not Have Permission To View This Data");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error while attempting to get Friend Requests: \n" + message);
        res.status(500).json({
            error: "Error while attempting to get Friend Requests \n" + message,
        });
    }
}
async function checkFriendRequestSent(req, res) {
    try {
        const sessionToken = req.cookies.sessionToken;
        const parsed = FriendRequestSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameters while checking friend requests");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while checking friend requests" +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, profileID } = parsed.data;
        const authenticated = await authentication.compareSessionToken(sessionToken, 
        //preserve logic until runtime is proven to work
        //req.query.userID
        userID);
        if (authenticated) {
            //preserve logic until runtime is proven to work
            //const userID = req.query.userID;
            //const profileID = req.query.profileID;
            const requestSent = await db.checkFriendRequestSent(userID, profileID);
            res.status(200).json(requestSent);
        }
        else {
            res.status(403).json("You Do Not Have Permission To View This Data");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error checking if friend request has been sent: \n" + message);
        res.status(500).json({
            error: "Error checking if friend request has been sent: \n" + message,
        });
    }
}
const AddDenyFriendSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    requestID: zod_1.z.coerce.number().positive(),
});
async function addFriend(req, res) {
    try {
        const parsed = AddDenyFriendSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while adding friend");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error while adding friend " + zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, requestID } = parsed.data;
        //Preserve logic until runtime is proven to work
        //const userID = req.body.userID;
        //const requestID = req.body.requestID;
        //original addFriend call only had two arguments; userID and RequestID
        const response = await db.addFriend(res, userID, requestID);
        res.status(200).json({ message: response });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error while attempting to add friend to database \n" +
            message);
        res.status(500).json({
            error: "There was an error attempting to add friend to the database \n" +
                message,
        });
    }
}
async function denyFriend(req, res) {
    try {
        const parsed = AddDenyFriendSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while denying friend request");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while denying friend request" +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, requestID } = parsed.data;
        //preserve original logic until runtime is proven to work
        //swap values so that the users friend request
        //is not deleted but the requesters friend request is
        //const requestID = req.body.userID;
        //const userID = req.body.requestID;
        await db.denyFriend(userID, requestID);
        res.status(200).json({ message: "friend request denied" });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in denying a friend request \n" + message);
        res.status(500).json({
            error: "There was an error in denying a friend request \n" + message,
        });
    }
}
const RemoveFriendSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    friendID: zod_1.z.coerce.number().positive(),
});
async function removeFriend(req, res) {
    try {
        const parsed = RemoveFriendSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while removing friend");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while removing friend" +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, friendID } = parsed.data;
        //preserve original call until runtime is proven to work
        //db.removeFriend(req.body.userID, req.body.friendID);
        db.removeFriend(userID, friendID);
        res.status(200).json({ message: "You did it" });
    }
    catch (err) {
        console.log("Error while attempting to remove friend: \n" + err);
        res
            .status(500)
            .json({ error: "Error attempting to remove friend from database" });
    }
}
async function checkIfFriends(req, res) {
    try {
        //THIS IS USING THE RemoveFriendSchema assuming queries remain the same
        // if this does not work then create a new schema
        const parsed = RemoveFriendSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error in parameters while checking if friends");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error in parameters while checking friend status" +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, friendID } = parsed.data;
        //Keeping original logic until runtime is proven to work
        //const userID = req.query.userID;
        //const friendID = req.query.friendID;
        const friendRow = await db.checkIfFriends(userID, friendID);
        if (friendRow) {
            res.status(200).json({ friendStatus: true });
        }
        else {
            res.status(200).json({ friendStatus: false });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in checking friend status in controller \n" + message);
        res.status(500).json({
            error: "There was an error checking friend status \n" + message,
        });
    }
}
const GetFriendsSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
});
// This function should check for authentication so users cannot curl
//    or fetch to retrieve user info
async function getFriends(req, res) {
    try {
        const parsed = GetFriendsSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameters in getFriends");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error retrieving users friends " + zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID } = parsed.data;
        const friendIDs = await db.getFriends(userID);
        const userData = await Promise.all(friendIDs.map(async (ID) => {
            return await db.getUserByUserID(ID);
        }));
        const friendsList = userData.map((user) => {
            //dereferencing originally had password in it
            //its been removed since userData does not contain password property
            const { email, is_admin, ...newUser } = user;
            return newUser;
        });
        res.status(200).json({ friendsList });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error retrieving user friends: \n" + message);
        res
            .status(404)
            .json({ error: "Error retrieving user friends: \n" + message });
    }
}
const BlockUserSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    blockedID: zod_1.z.coerce.number().positive(),
});
//This should require authentication so users cannot modify other users blocked lists
async function blockUser(req, res) {
    try {
        const parsed = BlockUserSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while blocking user");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while blocking user " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, blockedID } = parsed.data;
        await db.blockUser(userID, blockedID);
        //keeping original db call to preserve logic until runtime is proven to work
        //db.blockUser(req.body.userID, req.body.blockedID);
        res.status(200).json({ message: "Successfully Blocked User" });
    }
    catch (err) {
        console.log("Error in blocking user:  \n" + err);
        res
            .status(500)
            .json({ error: "There was an error in blocking user to database" });
    }
}
async function checkIfBlocked(req, res) {
    try {
        const parsed = BlockUserSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameters while checking if user is blocked");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with paramteres while checking is user is blocked " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, blockedID } = parsed.data;
        const isBlocked = await db.checkIfBlocked(userID, blockedID);
        res.status(200).json({ isBlocked: isBlocked });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error while checking blocked status" + message);
        res.status(500).json({
            error: "There was an error while checking blocked status " + message,
        });
    }
}
//this should require authentication to disallow outside users for modifying friends list
const UnblockUserSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    unblockedID: zod_1.z.coerce.number().positive(),
});
async function unblockUser(req, res) {
    try {
        const parsed = UnblockUserSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while unblocking user");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while unblocking users " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, unblockedID } = parsed.data;
        await db.unblockUser(userID, unblockedID);
        //preserve original call until runtime is proven to work
        //db.unblockUser(req.body.userID, req.body.unblockedID);
        res.status(200).json({ message: "Unblocked user" });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error in unblocking user: \n" + message);
        res.status(500).json({ error: "Error in unblocking user " + message });
    }
}
async function checkIfBlockedByProfile(req, res) {
    try {
        const parsed = BlockUserSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameters while checking blocked status");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while checking blocked status " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, blockedID } = parsed.data;
        //keep original variable assignments until runtime is proved to work
        //const userID = req.query.profileID;
        //const blockedID = req.query.userID;
        const isBlockedByProfile = await db.checkIfBlocked(blockedID, userID);
        res.status(200).json(isBlockedByProfile);
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in checking blocked status: \n" + message);
        res.status(500).json({
            error: "There was an error in checking blocked status " + message,
        });
    }
}
const CheckIfPublicSchema = zod_1.z.object({
    profileID: zod_1.z.coerce.number().positive(),
});
async function checkIfPublic(req, res) {
    try {
        const parsed = CheckIfPublicSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameters while checking profile status");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with paramteres while checking profile status " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { profileID } = parsed.data;
        const isPublic = await db.checkIfPublic(profileID);
        res.status(200).json(isPublic);
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in checking profile status" + message);
        return res.status(500).json({
            error: "There was an error in checking profile status " + message,
        });
    }
}
const ChangeProfileStatusSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    status: zod_1.z.boolean(),
});
async function changeProfileStatus(req, res) {
    try {
        const parsed = ChangeProfileStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while changing profile status ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while changing profile status " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, status } = parsed.data;
        const sessionToken = req.cookies.sessionToken;
        const authenticated = await authentication.compareSessionToken(sessionToken, req.body.userID);
        if (authenticated) {
            const response = await db.changeProfileStatus(userID, status);
            res
                .status(200)
                .json({ message: "Profile Status Changed", changed: true });
        }
        else {
            return res.status(403).json({
                error: "You do not have permission to modify this value",
                changed: false,
            });
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in changing the profile status: \n" + message);
        return res.status(500).json({
            error: "There was an error in changing the profile status " + message,
            changed: false,
        });
    }
}
async function changeProfilePicture(req, res) {
    try {
        const sessionToken = req.cookies.sessionToken;
        const authenticated = await authentication.compareSessionToken(sessionToken, req.body.userID);
        if (authenticated) {
            const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
            if (!req.file || !req.file.buffer) {
                return res.status(400).json("No File Was Uploaded");
            }
            const newFile = await file_type_1.default.fromBuffer(req.file.buffer);
            if (!newFile) {
                throw new Error("buffer could not be retrieved from uploaded file");
            }
            if (!validTypes.includes(newFile.mime)) {
                console.log("Invalid Profile Picture Type, Not Supported");
                return res.status(400).json("File Type Not Supported");
            }
            const processedImageBuffer = await (0, sharp_1.default)(req.file.buffer)
                .resize(512, 512)
                .toFormat("jpeg")
                .jpeg({ quality: 80 })
                .toBuffer();
            const key = `profile-pictures/${req.body.userID}-${crypto_1.default.randomUUID()}.jpeg`;
            const profilePictureUrlObject = await db.getProfilePictureURL(req.body.userID);
            const imageUrl = await s3Uploader_1.default.uploadToS3(processedImageBuffer, key, "image/jpeg");
            const response = await db.addProfilePictureURL(imageUrl, req.body.userID);
            if (profilePictureUrlObject && profilePictureUrlObject.profile_picture) {
                const profilePictureUrl = profilePictureUrlObject.profile_picture;
                const url = new URL(profilePictureUrl);
                const deleteKey = decodeURIComponent(url.pathname.substring(1));
                s3Uploader_1.default.deleteFromS3(deleteKey);
            }
            return res
                .status(200)
                .json({ response: response.message, pictureURL: response.url });
        }
        else {
            return res
                .status(403)
                .json("You do not have the permission to edit this profile");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("userProfileController: \n changeProfilePicture: There was an error in changing the profile Picture" +
            message);
        res.status(500).json("There was an error in changing profile picture.");
    }
}
const EditAboutMeSchema = zod_1.z.object({
    aboutMe: zod_1.z.string().max(500, "Max length is 500 characters"),
    userID: zod_1.z.coerce.number().positive(),
});
async function editAboutMe(req, res) {
    try {
        const sessionToken = req.cookies.sessionToken;
        const parsed = EditAboutMeSchema.safeParse(req.body);
        if (!parsed.success) {
            console.log("Error with parameters while editing about me: ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(400).json({
                error: "Error with parameters while editing about me: " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { aboutMe, userID } = parsed.data;
        const authenticated = await authentication.compareSessionToken(sessionToken, userID);
        if (authenticated) {
            const response = await db.editAboutMe(aboutMe, userID);
            res.status(200).json("About Me Section Edit Successful");
        }
        else {
            console.log("User does not have permission for this modification");
            res
                .status(401)
                .json("User Does not have permission for this modification");
        }
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in changing the user's about me section: " + message);
        res.status(500).json({ error: "Could not change about me section" });
    }
}
const MutualFriendsSchema = zod_1.z.object({
    userID: zod_1.z.coerce.number().positive(),
    profileID: zod_1.z.coerce.number().positive(),
});
async function getMutualFriends(req, res) {
    try {
        const parsed = MutualFriendsSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameters while getting mutual friends: ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res.status(200).json({
                error: "Error with parameters while getting mutual friends: " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { userID, profileID } = parsed.data;
        //keep original variable assignments until runtime is proven to work
        //const userID = req.query.userID;
        //const profileID = req.query.profileID;
        const data = await db.getMutualFriends(userID, profileID);
        res.status(200).json(data);
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("There was an error in retrieving mutual friends: \n" + message);
        res.status(500).json("Could not retrieve mutual friends " + message);
    }
}
const GetUserIDSchema = zod_1.z.object({
    id: zod_1.z.string().max(16),
});
async function getUserIDByUsername(req, res) {
    try {
        const parsed = GetUserIDSchema.safeParse(req.query);
        if (!parsed.success) {
            console.log("Error with parameter while retrieving user id by username: ");
            console.log(zod_1.z.treeifyError(parsed.error));
            return res
                .status(400)
                .json({
                error: "Error with parameter while retrieving user id by username: " +
                    zod_1.z.treeifyError(parsed.error),
            });
        }
        const { id } = parsed.data;
        const user = await db.getUserByUsername(id);
        res.status(200).json({ id: user.id });
    }
    catch (err) {
        const message = (0, authentication_1.checkErrorType)(err);
        console.log("Error getting user ID by username" + message);
        res.status(500).json("Error retrieving user credentials " + message);
    }
}
module.exports = {
    getUser,
    getUserPublicProfile,
    getUserIDByUsername,
    getUsersBySearch,
    addFriendRequest,
    getFriendRequests,
    addFriend,
    denyFriend,
    checkIfFriends,
    getFriends,
    removeFriend,
    blockUser,
    unblockUser,
    checkIfBlocked,
    checkIfBlockedByProfile,
    checkIfPublic,
    changeProfileStatus,
    changeProfilePicture,
    editAboutMe,
    getMutualFriends,
    checkFriendRequestSent,
};
//# sourceMappingURL=userProfileController.js.map