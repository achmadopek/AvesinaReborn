const crypto = require("crypto");
const dbSecman = require("../db/connection-secman");

// ===== AMBIL MENUS =====
exports.getMenusRole = async (req, res) => {
    const { role_ids } = req.body;

    if (!role_ids || !role_ids.length) {
        return res.status(400).json({ message: "role_ids wajib diisi" });
    }

    try {
        const [rows] = await dbSecman.promise().query(
            `
            SELECT 
                m.menu_id,
                m.application_id,
                m.parent_id,
                m.name,
                m.path,
                m.icon,
                m.sort_order
            FROM role_menu rm
            JOIN menus m ON rm.menu_id = m.menu_id
            WHERE rm.role_id IN (?)
              AND m.is_active = 'Yes'
            ORDER BY m.sort_order ASC
            `,
            [role_ids]
        );

        return res.json(rows);

    } catch (err) {
        console.error("getMenusRole error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};