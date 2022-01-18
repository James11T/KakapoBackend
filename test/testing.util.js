import fetch from "node-fetch";
const API_URL = "http://localhost:5000/api/v1/";

const apiFetch = async (endpoint, config, body) => {
  const { token, method = "GET" } = config;

  let headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  let fetchConfig = {
    method: method,
    headers: headers,
  };

  if (body) {
    fetchConfig.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, fetchConfig);

  return response.json();
};

const signUp = async (config = {}) => {
  let {
    kakapo_id = "testing_user",
    password = "testing_password",
    email = "testingemail@kakaposocial.com",
    ...otherConfig
  } = config;

  const result = apiFetch(
    "auth/signup",
    {
      method: "POST",
      ...otherConfig,
    },
    {
      kakapo_id: kakapo_id,
      email: email,
      password: password,
    }
  );
  return result;
};

const signIn = async (config = {}) => {
  let {
    kakapo_id = "testing_user",
    password = "testing_password",
    ...otherConfig
  } = config;

  const result = apiFetch(
    "auth/signin",
    {
      method: "POST",
      ...otherConfig,
    },
    {
      kakapo_id: kakapo_id,
      password: password,
    }
  );

  return result;
};

export { signIn, signUp, apiFetch };
