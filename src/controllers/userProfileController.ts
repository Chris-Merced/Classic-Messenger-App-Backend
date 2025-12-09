import * as db from "../db/queries";
import * as authentication from "../authentication";
import * as fileType from "file-type";
import * as s3 from "../utils/s3Uploader";
import * as sharp from "sharp";
import * as crypto from "crypto";
import { z } from "zod";
import { Request, Response } from "express";
import { checkErrorType } from "../authentication";

export async function getUser(req: Request, res: Response) {
  try {
    const sessionData: { sessionID: string } = JSON.parse(
      req.cookies.sessionToken
    );
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
      const userObject = { user, friendRequests };

      res.status(200).json({ user: userObject });
    } else {
      return res.status(401).json({ message: "No SessionID Stored" });
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error getting user from database: " + message);
    res
      .status(500)
      .json({ message: "Error getting user from database: " + message });
  }
}

const GetUserPublicProfileSchema = z.object({
  ID: z.coerce.number().min(1),
});

export async function getUserPublicProfile(req: Request, res: Response) {
  try {
    const parsed = GetUserPublicProfileSchema.safeParse(req.query);

    if (!parsed.success) {
      console.log("Error parsing request object for getUserPublicProfile");
      console.log(z.treeifyError(parsed.error));
      res.status(500).json({
        error:
          "Error parsing request object for user profile" +
          z.treeifyError(parsed.error),
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
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error Retrieving Profile: ", message);
    res.status(500).json({ message: "Error: " + message });
  }
}

const GetUsersBySearchSchema = z.object({
  username: z.string().min(1).max(16),
  page: z.coerce.number().min(1),
  limit: z.coerce.number(),
});

export async function getUsersBySearch(req: Request, res: Response) {
  try {
    const parsed = GetUsersBySearchSchema.safeParse(req.query);
    if (!parsed.success) {
      console.log("Error parsing parameters in getUserBySearch");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({
        error: "Error parsing paramters" + z.treeifyError(parsed.error),
      });
    }
    const { page, limit, username } = parsed.data;
    /*Keep original logic until runtime is proven to work
    const page = req.query.page;
    const limit = req.query.limit;
    */

    const users = await db.getUsersByUsernameSearch(username, page, limit);
    res.status(201).json({ users: users });
  } catch (err) {
    const message = checkErrorType(err);
    console.error("Error getting users during search" + message);

    res.status(404).json({
      message: "There was a problem with the username lookup: " + message,
    });
  }
}

const FriendRequestSchema = z.object({
  userID: z.coerce.number().positive(),
  profileID: z.coerce.number().positive(),
});

export async function addFriendRequest(req: Request, res: Response) {
  try {
    const sessionToken: string = req.cookies.sessionToken;
    console.log(sessionToken);
    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      req.body.userID
    );
    if (authenticated) {
      const parsed = FriendRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        console.log("Error with parameters when adding friend request");
        console.log(z.treeifyError(parsed.error));
        return res.status(400).json({
          error: "Error adding friend request" + z.treeifyError(req.body),
        });
      }

      const { userID, profileID } = parsed.data;
      /*Keep original logic intact until runtime is proven to work
      const userID = req.body.userID;
      const profileID = req.body.profileID;
      */
      const response = await db.addFriendRequestToDatabase(userID, profileID);
      res.status(200).json({ message: response });
    } else {
      res.status(403).json("You Do Not Have Permission To View This Data");
    }
  } catch (err) {
    const message = checkErrorType(err);

    console.log(
      "There was an error adding Friend Request to Database: \n" + message
    );
    res.status(500).json({
      message:
        "There was an error adding Friend Request to Database:" + message,
    });
  }
}

export async function getFriendRequests(req: Request, res: Response) {
  try {
    const sessionToken: string = req.cookies.sessionToken;

    const parsed = FriendRequestSchema.safeParse(req.query);
    if (!parsed.success) {
      console.log("Error in parameters while getting friend requests");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({
        error:
          "Error with parameters while getting friend requests" +
          z.treeifyError(parsed.error),
      });
    }

    const { userID, profileID } = parsed.data;
    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      //comment preserves original logic until runtime is proven to work
      //req.query.userID
      userID
    );
    if (authenticated) {
      //comment preserves original logic until runtime is proven to work
      //const userID = req.query.userID;
      const data = await db.getFriendRequests(userID);
      res.status(200).json({ friendRequests: data });
    } else {
      res.status(403).json("You Do Not Have Permission To View This Data");
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error while attempting to get Friend Requests: \n" + message);
    res.status(500).json({
      message: "Error while attempting to get Friend Requests \n" + message,
    });
  }
}

export async function checkFriendRequestSent(req: Request, res: Response) {
  try {
    const sessionToken: string = req.cookies.sessionToken;
    const parsed = FriendRequestSchema.safeParse(req.query);

    if (!parsed.success) {
      console.log("Error with parameters while checking friend requests");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({
        error:
          "Error with parameters while checking friend requests" +
          z.treeifyError(parsed.error),
      });
    }
    const { userID, profileID } = parsed.data;

    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      //preserve logic until runtime is proven to work
      //req.query.userID
      userID
    );

    if (authenticated) {
      //preserve logic until runtime is proven to work
      //const userID = req.query.userID;
      //const profileID = req.query.profileID;

      const requestSent = await db.checkFriendRequestSent(userID, profileID);

      res.status(200).json(requestSent);
    } else {
      res.status(403).json("You Do Not Have Permission To View This Data");
    }
  } catch (err) {
    const message = checkErrorType(err);
    console.log("Error checking if friend request has been sent: \n" + message);
    res.status(500).json({
      message: "Error checking if friend request has been sent: \n" + message,
    });
  }
}

const AddDenyFriendSchema = z.object({
  userID: z.coerce.number().positive(),
  requestID: z.coerce.number().positive(),
});

export async function addFriend(req: Request, res: Response) {
  try {
    const parsed = AddDenyFriendSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("Error with parameters while adding friend");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({
        error: "Error while adding friend " + z.treeifyError(parsed.error),
      });
    }

    const { userID, requestID } = parsed.data;

    //Preserve logic until runtime is proven to work
    //const userID = req.body.userID;
    //const requestID = req.body.requestID;

    //original addFriend call only had two arguments; userID and RequestID
    const response = await db.addFriend(res, userID, requestID);
    res.status(200).json({ message: response });
  } catch (err) {
    const message = checkErrorType(err);
    console.log(
      "There was an error while attempting to add friend to database \n" +
        message
    );
    res.status(500).json({
      message:
        "There was an error attempting to add friend to the database \n" +
        message,
    });
  }
}

export async function denyFriend(req: Request, res: Response) {
  try {
    const parsed = AddDenyFriendSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("Error with parameters while denying friend request");
      console.log(z.treeifyError(parsed.error));
      return res.status(400).json({
        error:
          "Error with parameters while denying friend request" +
          z.treeifyError(parsed.error),
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
  } catch (err) {
    
    const message = checkErrorType(err);
    console.log("There was an error in denying a friend request \n" + message);
    res.status(500).json({
      message: "There was an error in denying a friend request \n" + message,
    });
  }
}

const RemoveFriendSchema = z.object({
  userID: z.coerce.number().positive(),
  friendID: z.coerce.number().positive(),
});

export async function removeFriend(req: Request, res: Response) {
  try {
    const parsed = RemoveFriendSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log("Error with parameters while removing friend");
      console.log(z.treeifyError(parsed.error));
      return res
        .status(400)
        .json({
          error:
            "Error with parameters while removing friend" +
            z.treeifyError(parsed.error),
        });
    }
    const { userID, friendID } = parsed.data;
    //preserve original call until runtime is proven to work
    //db.removeFriend(req.body.userID, req.body.friendID);
    db.removeFriend(userID, friendID);
    res.status(200).json({ message: "You did it" });
  } catch (err) {
    console.log("Error while attempting to remove friend: \n" + err);
    res
      .status(500)
      .json({ message: "Error attempting to remove friend from database" });
  }
}

async function checkIfFriends(req, res) {
  try {
    const userID = req.query.userID;
    const friendID = req.query.friendID;
    const friendRow = await db.checkIfFriends(userID, friendID);

    if (friendRow) {
      res.status(200).json({ friendStatus: true });
    } else {
      res.status(200).json({ friendStatus: false });
    }
  } catch (err) {
    console.log(
      "There was an error in checking friend status in controller \n" + err
    );
    res
      .status(500)
      .json({ message: "There was an error checking friend status \n" + err });
  }
}

async function getFriends(req, res) {
  try {
    const friendIDs = await db.getFriends(req.query.userID);
    const userData = await Promise.all(
      friendIDs.map(async (ID) => {
        return await db.getUserByUserID(ID);
      })
    );

    const friendsList = userData.map((user) => {
      const { password, email, is_admin, ...newUser } = user;
      return newUser;
    });

    res.status(200).json({ friendsList });
  } catch (err) {
    console.log("Error retrieving user friends: \n" + err);
    res
      .status(404)
      .json({ message: "Error retrieving user friends: \n" + err });
  }
}

async function blockUser(req, res) {
  try {
    db.blockUser(req.body.userID, req.body.blockedID);
    res.status(200).json({ message: "Successfully Blocked User" });
  } catch (err) {
    console.log("Error in blocking user:  \n" + err);
    res
      .status(500)
      .json({ message: "There was an error in blocking user to database" });
  }
}

async function checkIfBlocked(req, res) {
  try {
    const isBlocked = await db.checkIfBlocked(
      req.query.userID,
      req.query.blockedID
    );
    res.status(200).json({ isBlocked: isBlocked });
  } catch (err) {
    console.log("There was an error while checking blocked status" + err);
    res
      .status(500)
      .json({ message: "There was an error while checking blocked status" });
  }
}

async function unblockUser(req, res) {
  try {
    db.unblockUser(req.body.userID, req.body.unblockedID);
    res.status(200).json({ message: "Unblocked user" });
  } catch (err) {
    console.log("Error in unblocking user: \n" + err);
    res.status(500).json({ message: "Error in unblocking user" });
  }
}

async function checkIfBlockedByProfile(req, res) {
  try {
    const userID = req.query.profileID;
    const blockedID = req.query.userID;

    const isBlockedByProfile = await db.checkIfBlocked(userID, blockedID);
    res.status(200).json(isBlockedByProfile);
  } catch (err) {
    console.log("There was an error in checking blocked status: \n" + err);
    res
      .status(500)
      .json({ message: "There was an error in checking blocked status" });
  }
}

async function checkIfPublic(req, res) {
  try {
    const isPublic = await db.checkIfPublic(req.query.profileID);
    res.status(200).json(isPublic);
  } catch (err) {
    console.log("There was an error in checking profile status" + err);
    return res
      .status(500)
      .json({ message: "There was an error in checking profile status" });
  }
}

async function changeProfileStatus(req, res) {
  try {
    const sessionToken = req.cookies.sessionToken;
    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      req.body.userID
    );
    if (authenticated) {
      const response = await db.changeProfileStatus(
        req.body.userID,
        req.body.status
      );
      res
        .status(200)
        .json({ message: "Profile Status Changed", changed: true });
    } else {
      return res.status(403).json({
        message: "You do not have permission to modify this value",
        changed: false,
      });
    }
  } catch (err) {
    console.log("There was an error in changing the profile status: \n" + err);
    return res.status(500).json({
      message: "There was an error in changing the profile status",
      changed: false,
    });
  }
}

async function changeProfilePicture(req, res) {
  try {
    const sessionToken = req.cookies.sessionToken;

    const authenticated = await authentication.compareSessionToken(
      sessionToken,
      req.body.userID
    );

    if (authenticated) {
      const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

      if (!req.file || !req.file.buffer) {
        return res.status(400).json("No File Was Uploaded");
      }

      const newFile = await fileType.fromBuffer(req.file.buffer);

      if (!validTypes.includes(newFile.mime)) {
        console.log("Invalid Profile Picture Type, Not Supported");
        return res.status(400).json("File Type Not Supported");
      }

      const processedImageBuffer = await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat("jpeg")
        .jpeg({ quality: 80 })
        .toBuffer();

      const key = `profile-pictures/${req.body.userID}-${crypto.randomUUID()}.jpeg`;

      const profilePictureUrlObject = await db.getProfilePictureURL(
        req.body.userID
      );
      const imageUrl = await s3.uploadToS3(
        processedImageBuffer,
        key,
        "image/jpeg"
      );
      const response = await db.addProfilePictureURL(imageUrl, req.body.userID);

      if (profilePictureUrlObject && profilePictureUrlObject.profile_picture) {
        const profilePictureUrl = profilePictureUrlObject.profile_picture;
        const url = new URL(profilePictureUrl);
        const deleteKey = decodeURIComponent(url.pathname.substring(1));

        s3.deleteFromS3(deleteKey);
      }
      return res
        .status(200)
        .json({ response: response.message, pictureURL: response.url });
    } else {
      return res
        .status(403)
        .json("You do not have the permission to edit this profile");
    }
  } catch (err) {
    console.log(
      "userProfileController: \n changeProfilePicture: There was an error in changing the profile Picture" +
        err
    );
    res.status(500).json("There was an error in changing profile picture.");
  }
}

async function editAboutMe(req, res) {
  try {
    const authenticated = await authentication.compareSessionToken(
      req.cookies.sessionToken,
      req.body.userID
    );
    if (authenticated) {
      const aboutMe = req.body.aboutMe;
      const response = await db.editAboutMe(aboutMe, req.body.userID);
      res.status(200).json("About Me Section Edit Successful");
    } else {
      console.log("User does not have permission for this modification");
      res
        .status(401)
        .json("User Does not have permission for this modification");
    }
  } catch (err) {
    console.log("There was an error in changing the user's about me section");
    res.status(500).json("Could not change about me section");
  }
}

async function getMutualFriends(req, res) {
  try {
    const userID = req.query.userID;
    const profileID = req.query.profileID;
    const data = await db.getMutualFriends(userID, profileID);

    res.status(200).json(data);
  } catch (err) {
    console.log("There was an error in retrieving mutual friends: \n" + err);
    res.status(500).json("Could not retrieve mutual friends");
  }
}

async function getUserIDByUsername(req, res) {
  try {
    const user = await db.getUserByUsername(req.query.id);
    res.status(200).json({ id: user.id });
  } catch (err) {
    console.log("Error getting user ID by username" + err.message);
    res.status(500).json("Error retrieving user credentials");
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
