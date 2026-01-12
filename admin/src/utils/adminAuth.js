export const getAdminToken = () => {
  return localStorage.getItem("adminToken");
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminToken");
  window.location.href = "/";
};
