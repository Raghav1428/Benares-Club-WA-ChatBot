const sessions = {};

export const getSession = (userId) => sessions[userId];
export const setSession = (userId, value) => {
  if (!sessions[userId]) sessions[userId] = {};
  sessions[userId] = { ...sessions[userId], ...value };
};
export const clearSession = (userId) => { delete sessions[userId]; };
