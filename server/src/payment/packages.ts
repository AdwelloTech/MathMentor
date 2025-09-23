import { Request, Response } from "express";
import { PackagePricing, dynamicFind, parseJSON } from "../core";

/* ---------- Package pricing (UI calls) ---------- */
export async function getPackagePricing(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { package_type: 1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, PackagePricing, { q, sort, limit, offset });
}
