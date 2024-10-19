const validRoles = ["MHS", "DOSEN"];

export const isValidRole = (role) => {
    return validRoles.includes(role);
};