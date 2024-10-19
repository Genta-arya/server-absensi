const validRoles = ["MHS", "DOSEN", "ADMIN"];

export const isValidRole = (role) => {
    return validRoles.includes(role);
};