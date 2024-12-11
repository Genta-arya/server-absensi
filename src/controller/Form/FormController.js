import prisma from "../../config/prisma.js";
import sharp from "sharp";

export const uploadForm = async (req, res) => {
  try {
    const { forms } = req.body;

    if (!forms) {
      return res
        .status(400)
        .send({ message: "'forms' tidak ditemukan dalam request body" });
    }

    const parsedForms = JSON.parse(forms);

    if (!parsedForms || parsedForms.length === 0) {
      return res
        .status(400)
        .send({ message: "Tidak ada data form yang valid" });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send({ message: "Tidak ada file yang diunggah" });
    }

    let baseUrl =
      process.env.MODE === "pro"
        ? `${process.env.URL}/public/uploads/kegiatan/`
        : "http://localhost:3008/public/uploads/kegiatan/";

    const compressAndConvertToBase64 = async (filePath) => {
      try {
        const compressedImageBuffer = await sharp(filePath)
          .resize(800)
          .jpeg({ quality: 70 })
          .toBuffer();

        const base64String = compressedImageBuffer.toString("base64");
        return `data:image/jpeg;base64,${base64String}`;
      } catch (error) {
        console.error("Error during image compression and conversion:", error);
        throw error;
      }
    };

    const base64Files = await Promise.all(
      files.slice(0, 2).map(async (file) => {
        return await compressAndConvertToBase64(file.path);
      })
    );

    const imageUrls = files.map((file) => `${baseUrl}${file.filename}`);

    for (let form of parsedForms) {
      const savedData = {
        agenda: { connect: { id: form.agendaId } },
        kegiatanId: form.kegiatanId,
        gps: form.gps,
        detail: form.detail,
        tanggal: new Date(),
        status: true,
        mahasiswa: { connect: { id: form.userId } },
        gambar1_b64: base64Files[0],
        gambar2_b64: base64Files[1],
        gambar1: imageUrls[0],
        gambar2: imageUrls[1],
      };

      const agenda = await prisma.formAgenda.findMany({
        where: { agenda: { id: form.agendaId, status: true } },
      });

      if (agenda.length === 0) {
        await prisma.formAgenda.create({ data: savedData });
      }

      await prisma.agenda.updateMany({
        where: { id: form.agendaId },
        data: { status_berkas: true },
      });
    }

    res.status(200).json({
      message: "Form berhasil diunggah.",
      status: 200,

      data: parsedForms.map((form) => form.agendaId),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Terjadi kesalahan server." });
  }
};
export const updateForm = async (req, res) => {
  const { forms } = req.body;

  const files = req.files;
  console.log(files);
  const formatForms = JSON.parse(forms);

  const baseUrl =
    process.env.MODE === "pro"
      ? `${process.env.URL}/public/uploads/kegiatan/`
      : "http://localhost:3008/public/uploads/kegiatan/";

  const compressAndConvertToBase64 = async (filePath) => {
    try {
      const compressedImageBuffer = await sharp(filePath)
        .resize(800) // Ubah ukuran gambar
        .jpeg({ quality: 70 }) // Kompres kualitas
        .toBuffer();

      const base64String = compressedImageBuffer.toString("base64");
      return `data:image/jpeg;base64,${base64String}`;
    } catch (error) {
      console.error("Error during image compression and conversion:", error);
      throw error;
    }
  };

  try {
    // Konversi gambar ke Base64
    const base64Files = await Promise.all(
      files.slice(0, 2).map(async (file) => {
        return await compressAndConvertToBase64(file.path);
      })
    );

    // Buat URL gambar
    const imageUrls = files.map((file) => `${baseUrl}${file.filename}`);

    // Periksa apakah data form ada
    const existingData = await prisma.formAgenda.findFirst({
      where: {
        agendaId: forms.id,
      },
    });

    if (!existingData) {
      console.log("Form tidak ditemukan");
      return res.status(400).send({ message: "Form tidak ditemukan" });
    }

    // Update data form di database
    const updatedForm = await prisma.formAgenda.update({
      where: { id: existingData.id },
      data: {
        detail: formatForms.detail,
        gambar1: imageUrls[0] || existingData.gambar1,
        gambar2: imageUrls[1] || existingData.gambar2,
        gambar1_b64: base64Files[0] || existingData.gambar1_b64,
        gambar2_b64: base64Files[1] || existingData.gambar2_b64,
      },
    });

    res.status(200).send({
      message: "Form berhasil diperbarui",
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).send({ message: "Terjadi kesalahan server." });
  }
};

export const getSingleForm = async (req, res) => {
  const { id } = req.params;
  console.log("id retrive", id);

  try {
    const exits = await prisma.formAgenda.findFirst({
      where: {
        agendaId: id,
      },
      select: {
        id: true,
        agendaId: true,
        tanggal: true,
        gambar1: true,
        gambar2: true,
        gambar1_b64: true,
        gambar2_b64: true,
        status: true,
        gps: true,
        detail: true,
      },
    });
    if (!exits) {
      return res.status(400).send({ message: "Form tidak ditemukan" });
    }
    return res.status(200).send({ message: "Form ditemukan", data: exits });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Terjadi kesalahan server." });
  }
};

export const checkStatusFormBerkas = async (req, res) => {
  try {
    const { id } = req.body;
    console.log("ID status:", id);

    // Validasi ID
    if (!id || !Array.isArray(id)) {
      return res
        .status(400)
        .send({ message: "Mohon lengkapi id dalam bentuk array." });
    }

    // Ambil semua agenda dengan status_berkas: true dan waktuselesai terkait
    const agendas = await prisma.agenda.findMany({
      where: {
        id: { in: id },
      },
      include: {
        group: {
          select: {
            kegiatan: {
              select: {
                waktuselesai: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();

    // Periksa apakah ada agenda dengan waktuselesai yang telah lewat
    const expiredAgendas = agendas.filter((agenda) => {
      const waktuselesai = agenda.group?.kegiatan?.waktuselesai;
      return waktuselesai && new Date(waktuselesai) <= now;
    });

    if (expiredAgendas.length > 0) {
      console.log("Agenda telah melewati waktu selesai");
      return res.status(200).send({
        message: "Agenda telah melewati waktu selesai",
        status: true,
        ids: expiredAgendas.map((agenda) => agenda.id),
      });
    }

    // Ambil agenda dengan status_berkas: true
    const forms = agendas.filter((agenda) => agenda.status_berkas);

    if (forms.length === 0) {
      console.log("Tidak ada berkas yang diupload");
      return res
        .status(200)
        .send({ message: "Berkas belum diupload", status: false, ids: [] });
    }

    // Ekstrak id dari hasil pencarian
    const trueIds = forms.map((form) => form.id);

    res
      .status(200)
      .send({ message: "Berkas sudah diupload", status: true, ids: trueIds });
  } catch (error) {
    console.error("Kesalahan server:", error);
    res.status(500).send({ message: "Terjadi kesalahan server." });
  }
};
