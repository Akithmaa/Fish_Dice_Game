const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");

const USERS = "users";

const getUserByEmail = async (email) => {
  const snap = await db.ref(USERS).orderByChild("email").equalTo(email).once("value");
  if (!snap.exists()) return null;

  const data = snap.val();
  const id = Object.keys(data)[0];
  return { id, ...data[id] };
};

const getUserByUsername = async (username) => {
  const snap = await db.ref(USERS).orderByChild("username").equalTo(username).once("value");
  if (!snap.exists()) return null;

  const data = snap.val();
  const id = Object.keys(data)[0];
  return { id, ...data[id] };
};

const createUser = async ({ email, username, password, profile }) => {
  const exists = await getUserByEmail(email);
  if (exists) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    email,
    username,
    passwordHash,
    profile,
    score: 0,
    createdAt: Date.now(),
    lastLogin: Date.now()
  };

  const ref = db.ref(USERS).push();
  await ref.set(user);

  return { id: ref.key, ...user };
};

const verifyUser = async ({ email, username, password }) => {
  let user = null;
  
  if (email) {
    user = await getUserByEmail(email);
  }
  
  if (!user && username) {
    user = await getUserByUsername(username);
  }
  
  if (!user) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  return match ? user : null;
};

module.exports = {
  createUser,
  verifyUser
};

