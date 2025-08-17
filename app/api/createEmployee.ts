import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, firstName, lastName, role, department, position, company_id, managerId, hierarchyLevel, permissions = {} } = req.body;

    if (!email || !password || !firstName || !lastName || !role || !company_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Create user
    const employeeRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Write to Firestore via Admin SDK
    await adminDB.collection("users").doc(employeeRecord.uid).set({
      id: employeeRecord.uid,
      email,
      role,
      first_name: firstName,
      last_name: lastName,
      department: department || "",
      position: position || "",
      company_id,
      manager_id: managerId && managerId !== "none" ? managerId : null,
      hierarchy_level: parseInt(hierarchyLevel) || 0,
      ...permissions,
      direct_reports: [],
      reporting_chain: [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, uid: employeeRecord.uid });
  } catch (error: any) {
    console.error("Error creating employee:", error);
    return res.status(500).json({ error: error.message });
  }
}
