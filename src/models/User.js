import db from "../db/index.js";
import bcrypt from "bcrypt";

class User {
  static async create({ username, email, password }) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const [user] = await db("users")
      .insert({
        username,
        email,
        password: hashedPassword,
      })
      .returning(["id", "username", "email", "created_at"]);

    return user;
  }

  static async findById(id) {
    const user = await db("users")
      .select(["id", "username", "email", "created_at"])
      .where({ id })
      .first();

    return user;
  }

  static async findByEmail(email) {
    const user = await db("users")
      .select(["id", "username", "email", "password", "created_at"])
      .where({ email })
      .first();

    return user;
  }

  static async findByUsername(username) {
    const user = await db("users")
      .select(["id", "username", "email", "password", "created_at"])
      .where({ username })
      .first();

    return user;
  }

  static async findByEmailOrUsername(identifier) {
    const user = await db("users")
      .select(["id", "username", "email", "password", "created_at"])
      .where({ email: identifier })
      .orWhere({ username: identifier })
      .first();

    return user;
  }

  static async updateById(id, updateData) {
    // If password is being updated, hash it
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const [user] = await db("users")
      .where({ id })
      .update({
        ...updateData,
        updated_at: db.fn.now(),
      })
      .returning(["id", "username", "email", "updated_at"]);

    return user;
  }

  static async deleteById(id) {
    const deletedCount = await db("users").where({ id }).del();

    return deletedCount > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async emailExists(email) {
    const user = await db("users").select("id").where({ email }).first();

    return !!user;
  }

  static async usernameExists(username) {
    const user = await db("users").select("id").where({ username }).first();

    return !!user;
  }
}

export default User;
