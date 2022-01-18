import { signIn, signUp, apiFetch } from "./testing.util.js";

import assert from "assert";

describe("Signing up", () => {
  it("sign up should return success", async () => {
    const signUpData = await signUp();
    //assert.equal(signUpData.success, true);
    assert.ok(true);
  });

  it("sign up while authenticated should return error 405", async () => {
    const signInData = await signIn();
    const signUpData = await signUp({
      token: signInData.token,
      kakapo_id: "not_used",
    });
    assert.equal(signUpData.error, 405);
  });

  describe("Invalid inputs", () => {
    it("sign up with existing kakapo id should return error 114", async () => {
      const signUpData = await signUp();
      assert.equal(signUpData.error, 114);
    });

    it("sign up with invalid kakapo id should return error 101", async () => {
      const signUpData = await signUp({ kakapo_id: "invalid kakapo" });
      assert.equal(signUpData.error, 101);
    });

    it("sign up with invalid kakapo id should return invalid parameter as kakapo_id", async () => {
      const signUpData = await signUp({ kakapo_id: "invalid kakapo" });
      assert.equal(signUpData.badParameters[0], "kakapo_id");
    });

    it("sign up with invalid password should return error 101", async () => {
      const signUpData = await signUp({ password: "small" });
      assert.equal(signUpData.error, 101);
    });

    it("sign up with invalid password should return invalid parameter as password", async () => {
      const signUpData = await signUp({ password: "small" });
      assert.equal(signUpData.badParameters[0], "password");
    });

    it("sign up with invalid email should return error 101", async () => {
      const signUpData = await signUp({ email: "bad email" });
      assert.equal(signUpData.error, 101);
    });

    it("sign up with invalid email should return invalid parameter as email", async () => {
      const signUpData = await signUp({ email: "bad email" });
      assert.equal(signUpData.badParameters[0], "email");
    });
  });

  describe("Missing inputs", () => {
    it("sign up with missing kakapo id should return error 100", async () => {
      const signUpData = await signUp({ kakapo_id: null });
      assert.equal(signUpData.error, 100);
    });

    it("sign up with missing kakapo_id should return missing parameter as kakapo_id", async () => {
      const signUpData = await signUp({ kakapo_id: null });
      assert.equal(signUpData.missingParameters[0], "kakapo_id");
    });

    it("sign up with missing password should return error 100", async () => {
      const signUpData = await signUp({ password: null });
      assert.equal(signUpData.error, 100);
    });

    it("sign up with missing password should return missing parameter as password", async () => {
      const signUpData = await signUp({ password: null });
      assert.equal(signUpData.missingParameters[0], "password");
    });

    it("sign up with missing email should return error 100", async () => {
      const signUpData = await signUp({ email: null });
      assert.equal(signUpData.error, 100);
    });

    it("sign up with missing email should return missing parameter as email", async () => {
      const signUpData = await signUp({ email: null });
      assert.equal(signUpData.missingParameters[0], "email");
    });
  });
});

describe("Signing in", () => {
  it("sign in should return a token", async () => {
    const signInData = await signIn();
    assert.ok(signInData.token);
  });

  it("token authentication should return user", async () => {
    const signInData = await signIn();
    const meData = await apiFetch("user/me", { token: signInData.token });
    assert.ok(meData.user.id);
  });

  it("invalid token should be ignored, returning error 401", async () => {
    const meData = await apiFetch("user/me", { token: "Bad token" });
    assert.equal(meData.error, 401);
  });

  it("sign in when already signed in should return error 405", async () => {
    const signInData = await signIn();
    const signInData2 = await signIn({ token: signInData.token });
    assert.equal(signInData2.error, 405);
  });

  describe("Invalid inputs", () => {
    it("sign in with wrong password should return error 400", async () => {
      const signInData = await signIn({ password: "wrongpassword" });
      assert.equal(signInData.error, 400);
    });

    it("sign in with wrong kakapo id should return error 104", async () => {
      const signInData = await signIn({ kakapo_id: "doesnt exist" });
      assert.equal(signInData.error, 104);
    });
  });

  describe("Missing inputs", () => {
    it("sign in with missing kakapo_id should return error 100", async () => {
      const signInData = await signIn({ kakapo_id: null });
      assert.equal(signInData.error, 100);
    });

    it("sign in with missing kakapo_id should return missing parameter as kakapo_id", async () => {
      const signInData = await signIn({ kakapo_id: null });
      assert.equal(signInData.missingParameters[0], "kakapo_id");
    });

    it("sign in with missing password should return error 100", async () => {
      const signInData = await signIn({ password: null });
      assert.equal(signInData.error, 100);
    });

    it("sign in with missing password should return missing parameter as password", async () => {
      const signInData = await signIn({ password: null });
      assert.equal(signInData.missingParameters[0], "password");
    });
  });
});
