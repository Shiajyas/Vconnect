import { Request, Response } from "express";
import { AdminOverviewService } from "../../useCase/AdminOverviewService";

const service = new AdminOverviewService();

export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    const data = await service.getOverview();
    res.status(200).json(data);
  } catch (err) {
    console.error("Admin overview fetch error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
