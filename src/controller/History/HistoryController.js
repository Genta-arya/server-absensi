import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getHistoryAgenda = async (req, res) => {
  const { id = "026446c7-8999-49cb-8bd5-526868b0e863" } = req.body;
  try {
    // Check if user exists
    const checkUserId = await prisma.user.findUnique({
      where: { id },
    });

    if (!checkUserId) {
      return sendResponse(res, 404, "User not found");
    }

    // Get agenda
    const agenda = await prisma.agenda.findMany({
      where: { idUser: id, status: true },
    });

    if (agenda.length === 0) {
      return sendResponse(res, 404, "No agenda found");
    }

    // Get CreatedId user names
    const createdIds = agenda.map((item) => item.createdId);
    const getCreatedId = await prisma.user.findMany({
      where: { id: { in: createdIds } },
      select: {
        id: true,
        name: true,
      },
    });

    // Format data
    const formattedAgenda = agenda.map((item) => {
      const creator = getCreatedId.find((user) => user.id === item.createdId);
      return {
        ...item,
        creatorName: creator ? creator.name : "-",
      };
    });

    return sendResponse(res, 200, "Success", formattedAgenda);
  } catch (error) {
    handleError(res, error);
  }
};
