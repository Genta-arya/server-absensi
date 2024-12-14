import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getHistoryAgenda = async (req, res) => {
  const { id } = req.body;

  console.log(id);
  try {
    // Check if user exists
    const checkUserId = await prisma.user.findUnique({
      where: { id },
    });

    if (!checkUserId) {
      return sendResponse(res, 404, "User not found");
    }

    // Get the latest 5 agendas
    const agenda = await prisma.agenda.findMany({
      where: { idUser: id, status_berkas: true },
      orderBy: { createdAt: "desc" }, // Sort by latest createdAt
      take: 5, // Take only the latest 5
    });

    if (agenda.length === 0) {
      return sendResponse(res, 200, "No agenda found");
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

export const getHistoryData = async (req, res) => {
  const { id } = req.params;
  try {
    // check id
    if (!id) {
      return sendResponse(res, 400, "Mohon lengkapi id");
    }
    const existUser = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    if (!existUser) {
      return sendResponse(res, 404, "User not found");
    }

    const history = await prisma.agenda.findMany({
      where: {
        idUser: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sendResponse(res, 200, "Success", history);
  } catch (error) {
    handleError(res, error);
  }
};
