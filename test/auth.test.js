import assert from "assert";

import { signIn, signUp, apiFetch } from "./testing.util.js";

describe("Auth routes", () => {
  describe("Signing up", () => {
    it("return success when signing up with valid values", async () => {
      const signUpData = await signUp();
      assert.equal(signUpData.success, true);
    });

    it("should return error 405 when signing up while authenticated ", async () => {
      const signInData = await signIn();
      const signUpData = await signUp({
        token: signInData.token,
        kakapo_id: "not_used",
      });
      assert.equal(signUpData.error, 405);
    });

    describe("Invalid inputs", () => {
      it("should return error 114 when signing up with existing kakapo id ", async () => {
        const signUpData = await signUp();
        assert.equal(signUpData.error, 114);
      });

      it("should return error 101 when signing up with invalid kakapo id ", async () => {
        const signUpData = await signUp({ kakapo_id: "invalid kakapo" });
        assert.equal(signUpData.error, 101);
      });

      it("should return invalid parameter as kakapo_id when signing up with invalid kakapo id ", async () => {
        const signUpData = await signUp({ kakapo_id: "invalid kakapo" });
        assert.equal(signUpData.badParameters[0], "kakapo_id");
      });

      it("should return error 101 when signing up with invalid password ", async () => {
        const signUpData = await signUp({ password: "small" });
        assert.equal(signUpData.error, 101);
      });

      it("should return invalid parameter as password when signing up with invalid password ", async () => {
        const signUpData = await signUp({ password: "small" });
        assert.equal(signUpData.badParameters[0], "password");
      });

      it("should return error 101 when signing up with invalid email", async () => {
        const signUpData = await signUp({ email: "bad email" });
        assert.equal(signUpData.error, 101);
      });

      it("should return invalid parameter as email when signing up with invalid email ", async () => {
        const signUpData = await signUp({ email: "bad email" });
        assert.equal(signUpData.badParameters[0], "email");
      });
    });

    describe("Missing inputs", () => {
      it("should return error 100 when signing up with missing kakapo id ", async () => {
        const signUpData = await signUp({ kakapo_id: null });
        assert.equal(signUpData.error, 100);
      });

      it("should return missing parameter as kakapo_id when signing up with missing kakapo_id ", async () => {
        const signUpData = await signUp({ kakapo_id: null });
        assert.equal(signUpData.missingParameters[0], "kakapo_id");
      });

      it("should return error 100 when signing up with missing password", async () => {
        const signUpData = await signUp({ password: null });
        assert.equal(signUpData.error, 100);
      });

      it("should return missing parameter as password when signing up with missing password", async () => {
        const signUpData = await signUp({ password: null });
        assert.equal(signUpData.missingParameters[0], "password");
      });

      it("should return error 100 when signing up with missing email ", async () => {
        const signUpData = await signUp({ email: null });
        assert.equal(signUpData.error, 100);
      });

      it("should return missing parameter as email when signing up with missing email ", async () => {
        const signUpData = await signUp({ email: null });
        assert.equal(signUpData.missingParameters[0], "email");
      });
    });
  });

  describe("Signing in", () => {
    it("should return a token when signing in with correct credentials", async () => {
      const signInData = await signIn();
      assert.ok(signInData.token);
    });

    it("return error 401 when using malformed tokem, by ignoring the token", async () => {
      const meData = await apiFetch("user/me", { token: "Bad token" });
      assert.equal(meData.error, 401);
    });

    it("should return error 405 when signing in while already signed in", async () => {
      const signInData = await signIn();
      const signInData2 = await signIn({ token: signInData.token });
      assert.equal(signInData2.error, 405);
    });

    describe("Invalid inputs", () => {
      it("should return error 400 when signing in with wrong password ", async () => {
        const signInData = await signIn({ password: "wrongpassword" });
        assert.equal(signInData.error, 400);
      });

      it("should return error 104 when signing in with wrong kakapo id ", async () => {
        const signInData = await signIn({ kakapo_id: "doesnt exist" });
        assert.equal(signInData.error, 104);
      });
    });

    describe("Missing inputs", () => {
      it("should return error 100 when signing in with missing kakapo_id", async () => {
        const signInData = await signIn({ kakapo_id: null });
        assert.equal(signInData.error, 100);
      });

      it("should return missing parameter as kakapo_id when signing in with missing kakapo_id", async () => {
        const signInData = await signIn({ kakapo_id: null });
        assert.equal(signInData.missingParameters[0], "kakapo_id");
      });

      it("should return error 100 when signing in with missing password", async () => {
        const signInData = await signIn({ password: null });
        assert.equal(signInData.error, 100);
      });

      it("should return missing parameter as password when signing in with missing password", async () => {
        const signInData = await signIn({ password: null });
        assert.equal(signInData.missingParameters[0], "password");
      });
    });
  });
});

await signUp({
  kakapo_id: "userTest1",
  password: "usertestpassword",
});

await signUp({
  kakapo_id: "userTest2",
  password: "usertestpassword",
});

const userTest1 = await signIn({
  kakapo_id: "userTest1",
  password: "usertestpassword",
});
const token1 = userTest1.token;
const testUser1 = userTest1.user;

const userTest2 = await signIn({
  kakapo_id: "userTest2",
  password: "usertestpassword",
});
const token2 = userTest2.token;
const testUser2 = userTest2.user;

describe("User routes", () => {
  describe("me", () => {
    it("should return the currently authenticated user when callingA me", async () => {
      const meData = await apiFetch("user/me", { token: token1 });
      assert.ok(!meData.error);
    });

    it("should return error 401 when calling me while unauthenticated", async () => {
      const meData = await apiFetch("user/me");
      assert.equal(meData.error, 401);
    });
  });

  describe("idtaken", () => {
    it("should return true when the kakapo id is avaialble", async () => {
      const idTakenData = await apiFetch("user/idtaken/testing_user");
      assert.equal(idTakenData.taken, true);
    });

    it("should return false when the kakapo id is not taken", async () => {
      const idTakenData = await apiFetch("user/idtaken/nottaken");
      assert.strictEqual(idTakenData.taken, false);
    });
  });

  describe("count", () => {
    it("should return the number of registered users", async () => {
      const countData = await apiFetch("user/count");
      assert.ok(!countData.error);
      assert.equal(typeof countData.count, "number");
      assert.ok(countData.count >= 0);
    });
  });

  describe("getting a user", () => {
    it("should return the requested user object", async () => {
      const userData = await apiFetch(`user/${userTest1.kakapo_id}`);
      assert.equal(userData.kakapo_id, userTest1.kakapo_id);
    });

    it("should return error 104 when getting a user that does not exist", async () => {
      const userData = await apiFetch("user/idontexist");
      assert.equal(userData.error, 104);
    });
  });

  describe("friends", () => {
    describe("Sending friend requests", () => {
      it("should return success after sending a friend request", async () => {
        const friendRequestData = await apiFetch(
          `user/friend/request/send/${testUser2.kakapo_id}`,
          { token: token1, method: "POST" }
        );
        assert.equal(friendRequestData.success, true);
      });

      it("should return error when sending friend request to absent user", async () => {
        const friendRequestData = await apiFetch(
          `user/friend/request/send/idonotexist`,
          { token: token1, method: "POST" }
        );
        assert.equal(friendRequestData.error, 104);
      });
    });

    describe("Getting friend requests", () => {
      it("should return a list of friend requests with 1 entry", async () => {
        const friendRequestsData = await apiFetch("user/friend/request/all", {
          token: token2,
        });

        assert.ok(friendRequestsData.friend_requests.length === 1);
      });
    });

    describe("Accepting friend requests", () => {
      it("should return success after accepting request", async () => {
        const friendRequestData = await apiFetch(
          `user/friend/request/accept/${testUser1.kakapo_id}`,
          {
            token: token2,
            method: "POST",
          }
        );

        assert.equal(friendRequestData.success, true);
      });

      it("should return error when accepting absent friend request", async () => {
        const friendRequestData = await apiFetch(
          `user/friend/request/accept/${testUser1.kakapo_id}`,
          {
            token: token2,
            method: "POST",
          }
        );

        assert.equal(friendRequestData.error, 106);
      });
    });

    describe("Counting friends", () => {
      it("should return 1 friend for user 1", async () => {
        const friendCountData = await apiFetch(
          `user/friend/count/${testUser1.kakapo_id}`
        );

        assert.equal(friendCountData.count, 1);
      });

      it("should return 1 friend for user 2", async () => {
        const friendCountData = await apiFetch(
          `user/friend/count/${testUser2.kakapo_id}`
        );

        assert.equal(friendCountData.count, 1);
      });

      it("should return 0 friend for test user", async () => {
        const friendCountData = await apiFetch(
          "user/friend/count/testing_user"
        );

        assert.equal(friendCountData.count, 0);
      });
    });
  });
});

describe("Explore routes", () => {
  describe("Exploring users", () => {
    it("should return 3 users with 'test' in the name", async () => {
      const exploreUserData = await apiFetch("explore/users/test");

      assert.ok(!exploreUserData.error);
      assert.equal(exploreUserData.users.length, 3);
    });

    it("should return 1 users with 'testing' in the name", async () => {
      const exploreUserData = await apiFetch("explore/users/testing");

      assert.ok(!exploreUserData.error);
      assert.equal(exploreUserData.users.length, 1);
    });

    it("should return 0 users with 'noNameHasThis' in the name", async () => {
      const exploreUserData = await apiFetch("explore/users/noNameHasThis");

      assert.ok(!exploreUserData.error);
      assert.equal(exploreUserData.users.length, 0);
    });
  });
});

await signUp({ kakapo_id: "postTester" });

const postTest = await signIn({ kakapo_id: "postTester" });
const postToken = postTest.token;
console.log(postToken);
const postUser = postTest.user;
